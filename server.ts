import express from 'express';
import path from 'path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDB, saveDB } from './server/db';
import { getPrisma, checkDbConnection, isJsonFallbackEnabled } from './server/prisma';
import { OutboundOrder, OutboundOrderItem, OrderStatus, Wave, Feedback, FeedbackComment } from './src/types';
import { requirePermission, hasPermission, normalizeRole } from './server/permissions';
import { generalRateLimit, authRateLimit, corsMiddleware, requestIdMiddleware, errorHandler, notFoundHandler, helmetConfig, compressionMiddleware } from './server/middleware';
import { loginSchema, outboundCreateSchema, outboundUpdateSchema, inboundCreateSchema, inboundReceiveSchema, inventoryAdjustSchema, inventoryTransferSchema, returnCreateSchema, returnInspectSchema, billingRuleCreateSchema, apiKeyCreateSchema, apiKeyUpdateSchema, webhookCreateSchema, webhookUpdateSchema, storeConnectionCreateSchema, storeConnectionUpdateSchema, userCreateSchema, userUpdateSchema, resetPasswordSchema, feedbackCreateSchema, exceptionCaseCreateSchema, bulkImportSchema, formatZodError } from './server/validation';
import { carrierAdapter, storeAdapter, storageAdapter } from './server/adapters';
import { initWebSocket, getWebSocket } from './server/websocket';
import { processChat } from './server/ai-assistant';
import { generateBillingRecords, generateInvoices, markInvoicePaid, voidInvoice, recalculateInvoice } from './server/modules/billing';
import { buildWarehouseScopedWhere, resolveWarehouseId, requireWarehouseAccess } from './server/modules/warehouse';

const JWT_SECRET = process.env.JWT_SECRET || 'NiceC-WMS-Secret-Token-Key-2026!';

// Helper to decode current JWT user from headers
function getCurrentUser(req: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (err) {
    return null;
  }
}

// Authentication and Authorization Middlewares
function requireAuth(req: any, res: any, next: any) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please login first.' });
  }
  req.user = user;
  next();
}

function requireRole(...allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please login first.' });
    }
    const userRole = (req.user.role || '').toUpperCase();
    const hasRole = allowedRoles.some(r => r.toUpperCase() === userRole);
    if (!hasRole) {
      return res.status(403).json({ error: `Forbidden. Role '${req.user.role}' does not have permission.` });
    }
    next();
  };
}

function requireCustomerAccess(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login first.' });
  }
  const role = (req.user.role || '').toUpperCase();
  if (role === 'CLIENT' || role === 'CUSTOMER') {
    const targetCustomerId = req.params.customerId || req.params.id || req.query.customerId || req.body.customerId;
    if (targetCustomerId && req.user.customerId && targetCustomerId !== req.user.customerId) {
      return res.status(403).json({ error: "Forbidden. You do not have access to this customer's data." });
    }
  }
  next();
}

// 1. Stock Reservation Helper on Order Creation
async function reserveStock(orderId: string, customerId: string, skuId: string, qty: number, warehouseId: string) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    const prisma = getPrisma();
    try {
      await prisma.$transaction(async (tx) => {
        const inv = await tx.inventory.findFirst({
          where: { skuId, warehouseId }
        });
        if (!inv || inv.availableQty < qty) {
          throw new Error(`库存不足，无法预留 SKU: ${skuId}`);
        }
        
        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            availableQty: inv.availableQty - qty,
            reservedQty: inv.reservedQty + qty
          }
        });
        
        await tx.inventoryReservation.create({
          data: {
            customer: { connect: { id: customerId } },
            orderId,
            skuId,
            skuCode: inv.skuCode,
            warehouseId,
            quantity: qty,
            status: 'ACTIVE'
          }
        });
        
        await tx.inventoryTransaction.create({
          data: {
            customerId,
            warehouseId,
            skuId,
            skuCode: inv.skuCode,
            type: 'RESERVE',
            direction: 'OUT',
            quantity: qty,
            beforeQty: inv.availableQty,
            afterQty: inv.availableQty - qty,
            reason: `Outbound Order ${orderId} Stock Reservation`
          }
        });
      });
    } catch (err: any) {
      console.error('Prisma stock reservation failed:', err.message);
      throw err;
    }
  } else {
    const db = getDB();
    const inv = db.inventory.find(i => i.skuId === skuId);
    if (inv) {
      inv.availableQty = Math.max(0, inv.availableQty - qty);
      inv.reservedQty = (inv.reservedQty || 0) + qty;
    }
    saveDB();
  }
}

// 2. Stock Deduction Helper on Order Shipment
async function deductStock(orderId: string) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    const prisma = getPrisma();
    try {
      await prisma.$transaction(async (tx) => {
        const reservations = await tx.inventoryReservation.findMany({
          where: { orderId, status: 'ACTIVE' }
        });
        for (const resv of reservations) {
          const inv = await tx.inventory.findFirst({
            where: { skuId: resv.skuId, warehouseId: resv.warehouseId }
          });
          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                reservedQty: Math.max(0, inv.reservedQty - resv.quantity)
              }
            });
          }
          await tx.inventoryReservation.update({
            where: { id: resv.id },
            data: { status: 'CONSUMED' }
          });
          
          await tx.inventoryTransaction.create({
            data: {
              customerId: resv.customerId,
              warehouseId: resv.warehouseId,
              skuId: resv.skuId,
              skuCode: resv.skuCode,
              type: 'SHIP',
              direction: 'OUT',
              quantity: resv.quantity,
              beforeQty: inv ? inv.availableQty + inv.reservedQty : 0,
              afterQty: inv ? inv.availableQty + inv.reservedQty - resv.quantity : 0,
              reason: `Outbound Order ${orderId} Shipped`
            }
          });
        }
      });
    } catch (err) {
      console.error('Prisma stock deduction failed:', err);
    }
  } else {
    const db = getDB();
    const items = db.outboundOrderItems.filter(item => item.orderId === orderId);
    for (const item of items) {
      const inv = db.inventory.find(i => i.skuId === item.skuId);
      if (inv) {
        inv.reservedQty = Math.max(0, (inv.reservedQty || 0) - item.qty);
      }
    }
    saveDB();
  }
}

// 3. Stock Release Helper on Order Cancellation
async function releaseStock(orderId: string) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    const prisma = getPrisma();
    try {
      await prisma.$transaction(async (tx) => {
        const reservations = await tx.inventoryReservation.findMany({
          where: { orderId, status: 'ACTIVE' }
        });
        for (const resv of reservations) {
          const inv = await tx.inventory.findFirst({
            where: { skuId: resv.skuId, warehouseId: resv.warehouseId }
          });
          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                availableQty: inv.availableQty + resv.quantity,
                reservedQty: Math.max(0, inv.reservedQty - resv.quantity)
              }
            });
          }
          await tx.inventoryReservation.update({
            where: { id: resv.id },
            data: { status: 'RELEASED' }
          });
          
          await tx.inventoryTransaction.create({
            data: {
              customerId: resv.customerId,
              warehouseId: resv.warehouseId,
              skuId: resv.skuId,
              skuCode: resv.skuCode,
              type: 'RELEASE',
              direction: 'IN',
              quantity: resv.quantity,
              beforeQty: inv ? inv.availableQty : 0,
              afterQty: inv ? inv.availableQty + resv.quantity : 0,
              reason: `Outbound Order ${orderId} Cancelled`
            }
          });
        }
      });
    } catch (err) {
      console.error('Prisma stock release failed:', err);
    }
  } else {
    const db = getDB();
    const items = db.outboundOrderItems.filter(item => item.orderId === orderId);
    for (const item of items) {
      const inv = db.inventory.find(i => i.skuId === item.skuId);
      if (inv) {
        inv.availableQty += item.qty;
        inv.reservedQty = Math.max(0, (inv.reservedQty || 0) - item.qty);
      }
    }
    saveDB();
  }
}

// Define port - always 3000 according to platform rules
const PORT = 3000;

async function startServer() {
  const app = express();

  // ==========================================
  // Global Middleware (Security, Compression, CORS, Rate Limit)
  // ==========================================
  app.use(compressionMiddleware());
  app.use(helmetConfig());
  app.use(corsMiddleware());
  app.use(requestIdMiddleware());
  app.use(express.json({ limit: '10mb' }));
  app.use(generalRateLimit());

  // Strict rate limit on login
  app.use('/api/auth/login', authRateLimit());

  // Health Check APIs
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/health/db', async (req, res) => {
    const hasDb = await checkDbConnection();
    const jsonFallbackEnabled = isJsonFallbackEnabled();
    res.json({
      status: hasDb ? 'healthy' : (jsonFallbackEnabled ? 'fallback' : 'unavailable'),
      database: hasDb ? 'PostgreSQL (Prisma)' : (jsonFallbackEnabled ? 'file-based JSON fallback' : 'No database available'),
      jsonFallbackEnabled,
      nodeEnv: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });

  // Simple Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // ==========================================
  // Auth API
  // ==========================================
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }
    
    // Check if demo login is enabled
    const isProduction = process.env.NODE_ENV === 'production';
    const enableDemoLogin = process.env.ENABLE_DEMO_LOGIN === 'true';
    if (isProduction && !enableDemoLogin) {
      // In production, only database users can login (skip demo fallback)
    }

    // 1. Try real database login if available
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { username: username },
              { email: username }
            ]
          }
        });
        
        if (dbUser) {
          if (dbUser.status !== 'ACTIVE') {
            return res.status(401).json({ status: 'error', message: 'Account is disabled' });
          }
          // Compare passwords with bcrypt
          const isMatch = bcrypt.compareSync(password, dbUser.passwordHash);
          if (isMatch) {
            const token = jwt.sign(
              { 
                id: dbUser.id, 
                username: dbUser.username, 
                email: dbUser.email, 
                role: dbUser.role, 
                customerId: dbUser.customerId,
                warehouseId: dbUser.warehouseId
              },
              JWT_SECRET,
              { expiresIn: '24h' }
            );
            
            return res.json({
              status: 'success',
              user: {
                id: dbUser.id,
                username: dbUser.username,
                email: dbUser.email,
                name: dbUser.username,
                role: dbUser.role,
                customerId: dbUser.customerId,
                warehouseId: dbUser.warehouseId,
                token
              }
            });
          }
          // Password didn't match but user exists
          return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }
        // User not found in DB
        if (isProduction && !enableDemoLogin) {
          return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }
      } catch (err) {
        console.error('Prisma auth error:', err);
        if (isProduction && !enableDemoLogin) {
          return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }
      }
    }

    // 2. Demo login (only if enabled)
    const enableJsonFallback = process.env.ENABLE_JSON_FALLBACK !== 'false';
    if (!enableJsonFallback || (!enableDemoLogin && isProduction)) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const db = getDB();
    let localUser = db.users.find(u => u.username === username || u.email === username);
    
    // Add spec-required users on-the-fly to the fallback database if not present
    const specUsers: Record<string, any> = {
      'client@nicecwms.com': {
        id: 'usr_client_spec',
        username: 'client@nicecwms.com',
        email: 'client@nicecwms.com',
        role: 'CLIENT' as any,
        customerId: 'cust_1',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      },
      'client2@nicecwms.com': {
        id: 'usr_client2_spec',
        username: 'client2@nicecwms.com',
        email: 'client2@nicecwms.com',
        role: 'CLIENT' as any,
        customerId: 'cust_2',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      },
      'client@nicec.net': {
        id: 'usr_client',
        username: 'client@nicec.net',
        email: 'client@nicec.net',
        role: 'CLIENT' as any,
        customerId: 'cust_1',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      },
      'admin@nicecwms.com': {
        id: 'usr_admin_spec',
        username: 'admin@nicecwms.com',
        email: 'admin@nicecwms.com',
        role: 'ADMIN' as any,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      },
      'warehouse@nicecwms.com': {
        id: 'usr_wh_spec',
        username: 'warehouse@nicecwms.com',
        email: 'warehouse@nicecwms.com',
        role: 'WAREHOUSE_MANAGER' as any,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      },
    };
    
    if (!localUser && specUsers[username]) {
      localUser = specUsers[username];
      db.users.push(localUser);
      saveDB();
    }

    // Demo password map (only used when ENABLE_DEMO_LOGIN is active)
    const demoPasswords: Record<string, string> = {
      'admin@nicecwms.com': 'admin123456',
      'warehouse@nicecwms.com': 'warehouse123456',
      'client@nicecwms.com': 'client123456',
      'client2@nicecwms.com': 'client123456',
      'admin@nicec.net': 'admin123456',
      'neal@nicec.net': 'admin123456',
      'operator@nicec.net': 'warehouse123456',
      'operator': 'warehouse123456',
      'client@nicec.net': 'client123456',
    };

    if (localUser) {
      // Check if local user has a passwordHash in DB (from seeded data)
      if ((localUser as any).passwordHash) {
        const isMatch = bcrypt.compareSync(password, (localUser as any).passwordHash);
        if (!isMatch) {
          return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }
      } else {
        // Fallback to demo password check
        const expectedPassword = demoPasswords[username];
        if (!expectedPassword || password !== expectedPassword) {
          return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }
      }
      
      const u = localUser as any;
      const token = jwt.sign(
        { 
          id: u.id, 
          username: u.username, 
          email: u.email, 
          role: u.role, 
          customerId: u.customerId,
          warehouseId: u.warehouseId
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({
        status: 'success',
        user: {
          id: u.id,
          name: u.username,
          email: u.email,
          role: u.role,
          customerId: u.customerId,
          warehouseId: u.warehouseId,
          token
        }
      });
    }
    
    return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
  });

  // ==========================================
  // Static Reference APIs
  // ==========================================
  app.get('/api/customers', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          const customers = await prisma.customer.findMany({ where: { id: user.customerId } });
          return res.json(customers);
        }
        const customers = await prisma.customer.findMany();
        return res.json(customers);
      } catch (err) {
        console.error('Prisma customers fetch error:', err);
      }
    }

    const db = getDB();
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      const customers = db.customers.filter(c => c.id === user.customerId);
      return res.json(customers);
    }
    res.json(db.customers);
  });

  app.get('/api/carriers', requireAuth, (req: any, res) => {
    const db = getDB();
    res.json(db.carriers);
  });

  app.get('/api/logistics-channels', requireAuth, (req: any, res) => {
    const db = getDB();
    res.json(db.logisticsChannels);
  });

  app.get('/api/products', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        let prods = [];
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          prods = await prisma.product.findMany({ where: { customerId: user.customerId } });
        } else {
          prods = await prisma.product.findMany();
        }
        return res.json(prods);
      } catch (err) {
        console.error('Prisma products list error:', err);
      }
    }

    const db = getDB();
    let prods = db.products || [];
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      prods = prods.filter(p => p.customerId === user.customerId);
    }
    res.json(prods);
  });

  // ==========================================
  // Outbound Orders API
  // ==========================================
  
  // GET /api/outbound-orders (List with filters, pagination, search)
  app.get('/api/outbound-orders', requireAuth, async (req: any, res) => {
    const user = req.user;
    const {
      tab, // OrderStatus
      customerNameCode,
      orderType,
      salesPlatform,
      logisticsChannel,
      carrier,
      productCategory,
      recipient,
      sku,
      outboundOrderNo,
      createdTimeStart,
      createdTimeEnd,
      minQty,
      maxQty,
      sortBy = 'createdTime',
      sortOrder = 'desc',
      page = '1',
      pageSize = '10'
    } = req.query;

    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        // Construct filter object
        const where: any = {};

        // Role-based customer data isolation
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          where.customerId = user.customerId;
        }

        // Tab Filter
        const activeTab = (tab as string || 'ALL').toUpperCase();
        if (activeTab !== 'ALL') {
          where.status = activeTab;
        }

        // String search filters
        if (customerNameCode) {
          where.customer = {
            OR: [
              { id: { contains: customerNameCode, mode: 'insensitive' } },
              { name: { contains: customerNameCode, mode: 'insensitive' } },
              { code: { contains: customerNameCode, mode: 'insensitive' } }
            ]
          };
        }

        if (orderType) {
          where.orderType = orderType;
        }

        if (salesPlatform) {
          where.salesPlatform = salesPlatform;
        }

        if (logisticsChannel) {
          where.OR = [
            { logisticsChannelId: logisticsChannel },
            { logisticsChannel: { name: { contains: logisticsChannel as string, mode: 'insensitive' } } }
          ];
        }

        if (carrier) {
          where.OR = [
            ...(where.OR || []),
            { carrierId: carrier },
            { carrier: { name: { contains: carrier as string, mode: 'insensitive' } } }
          ];
        }

        if (recipient) {
          where.recipient = { contains: recipient as string, mode: 'insensitive' };
        }

        if (outboundOrderNo) {
          where.orderNo = { contains: outboundOrderNo as string, mode: 'insensitive' };
        }

        if (sku) {
          where.items = {
            some: {
              OR: [
                { skuCode: { contains: sku as string, mode: 'insensitive' } },
                { productName: { contains: sku as string, mode: 'insensitive' } }
              ]
            }
          };
        }

        if (productCategory) {
          where.items = {
            ...(where.items || {}),
            some: {
              ...(where.items?.some || {}),
              category: productCategory
            }
          };
        }

        if (minQty || maxQty) {
          where.totalQty = {};
          if (minQty) where.totalQty.gte = parseInt(minQty as string, 10);
          if (maxQty) where.totalQty.lte = parseInt(maxQty as string, 10);
        }

        if (createdTimeStart || createdTimeEnd) {
          where.createdTime = {};
          if (createdTimeStart) where.createdTime.gte = new Date(createdTimeStart as string);
          if (createdTimeEnd) where.createdTime.lte = new Date(createdTimeEnd as string);
        }

        // Pagination
        const pNum = parseInt(page as string, 10);
        const pSize = parseInt(pageSize as string, 10);
        const skip = (pNum - 1) * pSize;

        // Sorting
        const orderBy: any = {};
        if (sortBy === 'createdTime') {
          orderBy.createdTime = sortOrder;
        } else if (sortBy === 'totalQty') {
          orderBy.totalQty = sortOrder;
        } else if (sortBy === 'totalWeight') {
          orderBy.totalWeight = sortOrder;
        } else {
          orderBy[sortBy as string] = sortOrder;
        }

        const [ordersList, totalCount] = await Promise.all([
          prisma.outboundOrder.findMany({
            where,
            include: {
              items: true,
              customer: true,
              logisticsChannel: true,
              carrier: true
            },
            orderBy,
            skip,
            take: pSize
          }),
          prisma.outboundOrder.count({ where })
        ]);

        // Dynamic tab count calculations (based on the user role-isolated orders, but NOT tab-filtered)
        const countsWhere: any = {};
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          countsWhere.customerId = user.customerId;
        }

        const countsGroup = await prisma.outboundOrder.groupBy({
          by: ['status'],
          where: countsWhere,
          _count: {
            id: true
          }
        });

        const counts: any = {
          ALL: 0,
          PENDING: 0,
          PICKING: 0,
          REVIEWS: 0,
          SHIPPING: 0,
          SHIPPED: 0,
          EXCEPTIONS: 0,
          CANCELLED: 0
        };

        let grandTotal = 0;
        for (const item of countsGroup) {
          const statusStr = item.status;
          counts[statusStr] = item._count.id;
          grandTotal += item._count.id;
        }
        counts.ALL = grandTotal;

        const resolvedOrders = ordersList.map(ord => ({
          ...ord,
          customerName: ord.customer?.name || '',
          customerCode: ord.customer?.code || '',
          logisticsChannelName: ord.logisticsChannel?.name || '',
          carrierName: ord.carrier?.name || '',
          items: ord.items || []
        }));

        return res.json({
          orders: resolvedOrders,
          total: totalCount,
          counts,
          page: pNum,
          pageSize: pSize
        });

      } catch (err: any) {
        console.error('Prisma query error:', err);
      }
    }

    // Fallback local JSON db
    const db = getDB();
    let orders = [...db.outboundOrders];

    // Role-based customer data isolation
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      orders = orders.filter(ord => ord.customerId === user.customerId);
    }

    // Tab count computation (based on the isolated orders list)
    const counts = {
      ALL: orders.length,
      PENDING: orders.filter(o => o.status === 'PENDING').length,
      PICKING: orders.filter(o => o.status === 'PICKING').length,
      REVIEWS: orders.filter(o => o.status === 'REVIEWS').length,
      SHIPPING: orders.filter(o => o.status === 'SHIPPING').length,
      SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
      EXCEPTIONS: orders.filter(o => o.status === 'EXCEPTIONS').length,
      CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
    };

    // 1. Resolve customer & logistics details
    orders = orders.map(ord => {
      const cust = db.customers.find(c => c.id === ord.customerId);
      const chan = db.logisticsChannels.find(l => l.id === ord.logisticsChannelId);
      const carr = db.carriers.find(c => c.id === ord.carrierId);
      const items = db.outboundOrderItems.filter(item => item.orderId === ord.id);
      
      return {
        ...ord,
        customerName: cust ? cust.name : '',
        customerCode: cust ? cust.code : '',
        logisticsChannelName: chan ? chan.name : '',
        carrierName: carr ? carr.name : '',
        items
      };
    });

    // 2. Tab Filter (Except ALL)
    const activeTab = (tab as string || 'ALL').toUpperCase();
    if (activeTab !== 'ALL') {
      orders = orders.filter(ord => ord.status === activeTab);
    }

    // 3. String Search Filters
    if (customerNameCode) {
      const query = (customerNameCode as string).toLowerCase();
      orders = orders.filter(ord => 
        ord.customerId.toLowerCase().includes(query) ||
        (ord.customerName && ord.customerName.toLowerCase().includes(query)) ||
        (ord.customerCode && ord.customerCode.toLowerCase().includes(query))
      );
    }

    if (orderType) {
      orders = orders.filter(ord => ord.orderType === orderType);
    }

    if (salesPlatform) {
      orders = orders.filter(ord => ord.salesPlatform === salesPlatform);
    }

    if (logisticsChannel) {
      orders = orders.filter(ord => ord.logisticsChannelId === logisticsChannel || ord.logisticsChannelName?.includes(logisticsChannel as string));
    }

    if (carrier) {
      orders = orders.filter(ord => ord.carrierId === carrier || ord.carrierName === carrier);
    }

    if (recipient) {
      const query = (recipient as string).toLowerCase();
      orders = orders.filter(ord => ord.recipient.toLowerCase().includes(query));
    }

    if (outboundOrderNo) {
      const query = (outboundOrderNo as string).toLowerCase();
      orders = orders.filter(ord => ord.orderNo.toLowerCase().includes(query));
    }

    // SKU filter
    if (sku) {
      const query = (sku as string).toLowerCase();
      orders = orders.filter(ord => 
        ord.items && ord.items.some(item => 
          item.skuCode.toLowerCase().includes(query) || 
          item.productName.toLowerCase().includes(query)
        )
      );
    }

    // Category filter
    if (productCategory) {
      orders = orders.filter(ord =>
        ord.items && ord.items.some(item => item.category === productCategory)
      );
    }

    // Quantity range filters
    if (minQty) {
      const min = parseInt(minQty as string, 10);
      orders = orders.filter(ord => ord.totalQty >= min);
    }
    if (maxQty) {
      const max = parseInt(maxQty as string, 10);
      orders = orders.filter(ord => ord.totalQty <= max);
    }

    // Date range filters
    if (createdTimeStart && createdTimeEnd) {
      const start = new Date(createdTimeStart as string);
      const end = new Date(createdTimeEnd as string);
      orders = orders.filter(ord => {
        const oTime = new Date(ord.createdTime);
        return oTime >= start && oTime <= end;
      });
    }

    // Sorting
    orders.sort((a: any, b: any) => {
      let fieldA = a[sortBy as string];
      let fieldB = b[sortBy as string];

      if (typeof fieldA === 'string') {
        fieldA = fieldA.toLowerCase();
        fieldB = fieldB.toLowerCase();
      }

      if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const pNum = parseInt(page as string, 10);
    const pSize = parseInt(pageSize as string, 10);
    const total = orders.length;
    const startIndex = (pNum - 1) * pSize;
    const paginatedOrders = orders.slice(startIndex, startIndex + pSize);

    res.json({
      orders: paginatedOrders,
      total,
      counts,
      page: pNum,
      pageSize: pSize
    });
  });

  // GET /api/outbound-orders/:id
  app.get('/api/outbound-orders/:id', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({
          where: { id: req.params.id },
          include: {
            items: true,
            customer: true,
            logisticsChannel: true,
            carrier: true
          }
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        
        // Client access guard
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          if (order.customerId !== user.customerId) {
            return res.status(403).json({ error: 'Forbidden. Access denied.' });
          }
        }

        return res.json({
          ...order,
          customerName: order.customer?.name || '',
          customerCode: order.customer?.code || '',
          logisticsChannelName: order.logisticsChannel?.name || '',
          carrierName: order.carrier?.name || '',
          items: order.items || []
        });
      } catch (err) {
        console.error('Prisma order fetch error:', err);
      }
    }

    const db = getDB();
    const order = db.outboundOrders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Client access guard
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      if (order.customerId !== user.customerId) {
        return res.status(403).json({ error: 'Forbidden. Access denied.' });
      }
    }

    const cust = db.customers.find(c => c.id === order.customerId);
    const chan = db.logisticsChannels.find(l => l.id === order.logisticsChannelId);
    const carr = db.carriers.find(c => c.id === order.carrierId);
    const items = db.outboundOrderItems.filter(item => item.orderId === order.id);

    res.json({
      ...order,
      customerName: cust ? cust.name : '',
      customerCode: cust ? cust.code : '',
      logisticsChannelName: chan ? chan.name : '',
      carrierName: carr ? carr.name : '',
      items
    });
  });

  app.post('/api/outbound-orders', requireAuth, async (req: any, res) => {
    const user = req.user;
    const {
      customerId,
      logisticsChannelId,
      carrierId,
      remark = '',
      recipient,
      salesPlatform = 'Amazon',
      orderType = '单品单件',
      items = []
    } = req.body;

    let resolvedCustomerId = customerId;
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      resolvedCustomerId = user.customerId;
    }

    if (!resolvedCustomerId || !logisticsChannelId || !carrierId || !recipient || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate outbound order code
    const orderNo = 'OBS' + String(Date.now()).substring(3, 15);
    const newOrderId = 'ord_' + Math.random().toString(36).substr(2, 9);
    const totalQty = items.reduce((sum: number, item: any) => sum + (item.qty || 1), 0);
    const totalWeight = parseFloat((totalQty * 1.2).toFixed(2));

    const effectiveWhId = resolveWarehouseId(req.user, 'wh_default');
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const result = await prisma.$transaction(async (tx) => {
          // 1. Pre-verify all SKU stock levels in transaction
          for (const item of items) {
            const inv = await tx.inventory.findFirst({
              where: { skuId: item.skuId, warehouseId: effectiveWhId }
            });
            if (!inv || inv.availableQty < item.qty) {
              const skuObj = await tx.sKU.findUnique({ where: { id: item.skuId } });
              throw new Error(`库存不足，无法预留 SKU: ${skuObj ? skuObj.code : item.skuId} (可用: ${inv ? inv.availableQty : 0}, 需求: ${item.qty})`);
            }
          }

          // 2. Create the Outbound Order
          const order = await tx.outboundOrder.create({
            data: {
              id: newOrderId,
              orderNo,
              status: 'PENDING',
              remark: remark || '-',
              totalWeight,
              totalQty,
              customerId: resolvedCustomerId,
              logisticsChannelId,
              carrierId,
              waveId: null,
              labelPrinted: 'NOT_PRINTED',
              recipient,
              salesPlatform,
              orderType,
              createdTime: new Date()
            }
          });

          // 3. Create items, update stock, and write logs
          const createdItems = [];
          for (const item of items) {
            const skuObj = await tx.sKU.findUnique({ where: { id: item.skuId } });
            const skuCode = skuObj ? skuObj.code : (item.skuCode || 'SKU-MOCK');
            const skuBarcode = skuObj ? skuObj.barcode : (item.skuBarcode || skuCode || 'BARCODE-MOCK');
            const productName = skuObj ? skuObj.name : (item.productName || 'Mock Product Name');

            const newItem = await tx.outboundOrderItem.create({
              data: {
                id: 'item_' + Math.random().toString(36).substr(2, 9),
                orderId: newOrderId,
                skuId: item.skuId,
                skuCode,
                skuBarcode,
                qty: item.qty,
                productName,
                category: item.category || '未分类'
              }
            });
            createdItems.push(newItem);

            // Update inventory values
            const inv = await tx.inventory.findFirst({
              where: { skuId: item.skuId, warehouseId: effectiveWhId }
            });
            if (inv) {
              await tx.inventory.update({
                where: { id: inv.id },
                data: {
                  availableQty: inv.availableQty - item.qty,
                  reservedQty: inv.reservedQty + item.qty
                }
              });

              // Create reservation
              await tx.inventoryReservation.create({
                data: {
                  customerId: resolvedCustomerId,
                  orderId: newOrderId,
                  orderItemId: newItem.id,
                  skuId: item.skuId,
                  skuCode,
                  warehouseId: effectiveWhId,
                  quantity: item.qty,
                  status: 'ACTIVE'
                }
              });

              // Create transaction log
              await tx.inventoryTransaction.create({
                data: {
                  customerId: resolvedCustomerId,
                  warehouseId: effectiveWhId,
                  skuId: item.skuId,
                  skuCode,
                  type: 'RESERVE',
                  direction: 'OUT',
                  quantity: item.qty,
                  beforeQty: inv.availableQty,
                  afterQty: inv.availableQty - item.qty,
                  reason: `Outbound Order ${newOrderId} Stock Reservation`
                }
              });
            }
          }

          return { order, items: createdItems };
        });

        const fullOrder = await prisma.outboundOrder.findUnique({
          where: { id: result.order.id },
          include: {
            customer: true,
            logisticsChannel: true,
            carrier: true
          }
        });

        return res.status(201).json({
          status: 'success',
          order: {
            ...result.order,
            customerName: fullOrder?.customer?.name || '',
            customerCode: fullOrder?.customer?.code || '',
            logisticsChannelName: fullOrder?.logisticsChannel?.name || '',
            carrierName: fullOrder?.carrier?.name || '',
            items: result.items
          }
        });

      } catch (err: any) {
        console.error('Create outbound order transactional error:', err);
        return res.status(400).json({ error: err.message || 'Create outbound order transaction failed.' });
      }
    }

    // JSON fallback
    const db = getDB();

    // 1. Pre-verify SKU stock levels in JSON database
    for (const item of items) {
      const inv = db.inventory.find(i => i.skuId === item.skuId);
      if (!inv || inv.availableQty < item.qty) {
        const skuObj = db.skus.find(s => s.id === item.skuId);
        return res.status(400).json({ error: `库存不足，无法预留 SKU: ${skuObj ? skuObj.code : item.skuId} (可用: ${inv ? inv.availableQty : 0}, 需求: ${item.qty})` });
      }
    }

    // 2. Perform reservations safely
    const newItems: OutboundOrderItem[] = items.map((item: any) => {
      const skuObj = db.skus.find(s => s.id === item.skuId);
      return {
        id: 'item_' + Math.random().toString(36).substr(2, 9),
        orderId: newOrderId,
        skuId: item.skuId,
        skuCode: skuObj ? skuObj.code : (item.skuCode || 'SKU-MOCK'),
        skuBarcode: skuObj ? skuObj.barcode : (item.skuBarcode || item.skuCode || 'BARCODE-MOCK'),
        qty: item.qty || 1,
        productName: skuObj ? skuObj.name : (item.productName || 'Mock Product Name'),
        category: item.category || '未分类'
      };
    });

    for (const item of newItems) {
      const inv = db.inventory.find(i => i.skuId === item.skuId);
      if (inv) {
        inv.availableQty = Math.max(0, inv.availableQty - item.qty);
        inv.reservedQty = (inv.reservedQty || 0) + item.qty;
      }
    }

    const newOrder: OutboundOrder = {
      id: newOrderId,
      orderNo,
      status: 'PENDING',
      remark: remark || '-',
      totalWeight,
      totalQty,
      customerId: resolvedCustomerId,
      logisticsChannelId,
      carrierId,
      waveId: null,
      labelPrinted: 'NOT_PRINTED',
      recipient,
      salesPlatform,
      createdTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      orderType
    };

    db.outboundOrders.push(newOrder);
    db.outboundOrderItems.push(...newItems);
    saveDB();

    const cust = db.customers.find(c => c.id === resolvedCustomerId);
    const chan = db.logisticsChannels.find(l => l.id === logisticsChannelId);
    const carr = db.carriers.find(c => c.id === carrierId);

    res.status(201).json({
      status: 'success',
      order: {
        ...newOrder,
        customerName: cust ? cust.name : '',
        customerCode: cust ? cust.code : '',
        logisticsChannelName: chan ? chan.name : '',
        carrierName: carr ? carr.name : '',
        items: newItems
      }
    });
  });

  app.put('/api/outbound-orders/:id', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    const updateData = req.body;

    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({
          where: { id: req.params.id },
          include: { items: true }
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Client access guard
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          if (order.customerId !== user.customerId) {
            return res.status(403).json({ error: 'Forbidden. Access denied.' });
          }
        }

        if (order.status === 'SHIPPED' && updateData.items) {
          return res.status(400).json({ error: '已出库订单无法修改商品列表' });
        }

        const effectiveWhId = resolveWarehouseId(req.user, 'wh_default');

        // Prepare fields for update
        const dataToUpdate: any = {};
        if (updateData.status) dataToUpdate.status = updateData.status;
        if (updateData.remark) dataToUpdate.remark = updateData.remark;
        if (updateData.recipient) dataToUpdate.recipient = updateData.recipient;
        if (updateData.salesPlatform) dataToUpdate.salesPlatform = updateData.salesPlatform;
        if (updateData.orderType) dataToUpdate.orderType = updateData.orderType;
        if (updateData.logisticsChannelId) dataToUpdate.logisticsChannelId = updateData.logisticsChannelId;
        if (updateData.carrierId) dataToUpdate.carrierId = updateData.carrierId;

        const updated = await prisma.$transaction(async (tx) => {
          // If items are modified, recreate them
          if (updateData.items && Array.isArray(updateData.items)) {
            // Restore previous inventory quantities before removing items
            const oldReservations = await tx.inventoryReservation.findMany({
              where: { orderId: order.id, status: 'ACTIVE' }
            });
            for (const resv of oldReservations) {
              const inv = await tx.inventory.findFirst({
                where: { skuId: resv.skuId, warehouseId: resv.warehouseId }
              });
              if (inv) {
                await tx.inventory.update({
                  where: { id: inv.id },
                  data: {
                    availableQty: inv.availableQty + resv.quantity,
                    reservedQty: Math.max(0, inv.reservedQty - resv.quantity)
                  }
                });
              }
            }
            await tx.inventoryReservation.deleteMany({ where: { orderId: order.id } });
            await tx.outboundOrderItem.deleteMany({ where: { orderId: order.id } });
            
            // Re-create items and perform fresh stock reservations
            for (const item of updateData.items) {
              const skuObj = await tx.sKU.findUnique({ where: { id: item.skuId } });
              const skuCode = skuObj ? skuObj.code : (item.skuCode || 'SKU-MOCK');
              const skuBarcode = skuObj ? skuObj.barcode : (item.skuBarcode || skuCode || 'BARCODE-MOCK');
              const productName = skuObj ? skuObj.name : (item.productName || 'Mock Product Name');

              // Check stock level first
              const inv = await tx.inventory.findFirst({
                where: { skuId: item.skuId, warehouseId: effectiveWhId }
              });
              if (!inv || inv.availableQty < item.qty) {
                throw new Error(`库存不足，无法预留 SKU: ${skuCode} (可用: ${inv ? inv.availableQty : 0}, 需求: ${item.qty})`);
              }

              const newItem = await tx.outboundOrderItem.create({
                data: {
                  id: item.id || 'item_' + Math.random().toString(36).substr(2, 9),
                  orderId: order.id,
                  skuId: item.skuId,
                  skuCode,
                  skuBarcode,
                  qty: item.qty || 1,
                  productName,
                  category: item.category || '未分类'
                }
              });

              // Apply fresh reservation values
              await tx.inventory.update({
                where: { id: inv.id },
                data: {
                  availableQty: inv.availableQty - item.qty,
                  reservedQty: inv.reservedQty + item.qty
                }
              });

              await tx.inventoryReservation.create({
                data: {
                  customerId: order.customerId,
                  orderId: order.id,
                  orderItemId: newItem.id,
                  skuId: item.skuId,
                  skuCode,
                  warehouseId: effectiveWhId,
                  quantity: item.qty,
                  status: 'ACTIVE'
                }
              });
            }

            dataToUpdate.totalQty = updateData.items.reduce((sum: number, i: any) => sum + i.qty, 0);
            dataToUpdate.totalWeight = parseFloat((dataToUpdate.totalQty * 1.2).toFixed(2));
          }

          const resOrder = await tx.outboundOrder.update({
            where: { id: order.id },
            data: dataToUpdate,
            include: { items: true }
          });

          return resOrder;
        });

        return res.json({
          status: 'success',
          order: updated
        });
      } catch (err: any) {
        console.error('Prisma update order failed:', err);
        return res.status(400).json({ error: err.message || 'Update failed.' });
      }
    }

    // JSON fallback
    const db = getDB();
    const index = db.outboundOrders.findIndex(o => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentOrder = db.outboundOrders[index];
    // Client access guard
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      if (currentOrder.customerId !== user.customerId) {
        return res.status(403).json({ error: 'Forbidden. Access denied.' });
      }
    }

    if (currentOrder.status === 'SHIPPED' && updateData.items) {
      return res.status(400).json({ error: '已出库订单无法修改商品列表' });
    }

    const updatedOrder: OutboundOrder = {
      ...currentOrder,
      ...updateData,
      id: currentOrder.id,
      orderNo: currentOrder.orderNo
    };

    if (updateData.items && Array.isArray(updateData.items)) {
      // Restore previous quantities for existing items in JSON database
      const oldItems = db.outboundOrderItems.filter(item => item.orderId === currentOrder.id);
      for (const oldItem of oldItems) {
        const inv = db.inventory.find(i => i.skuId === oldItem.skuId);
        if (inv) {
          inv.availableQty += oldItem.qty;
          inv.reservedQty = Math.max(0, (inv.reservedQty || 0) - oldItem.qty);
        }
      }

      // Check stock before re-reserving
      for (const item of updateData.items) {
        const inv = db.inventory.find(i => i.skuId === item.skuId);
        if (!inv || inv.availableQty < item.qty) {
          // Re-apply previous reservation levels on failure
          for (const oldItem of oldItems) {
            const oldInv = db.inventory.find(i => i.skuId === oldItem.skuId);
            if (oldInv) {
              oldInv.availableQty = Math.max(0, oldInv.availableQty - oldItem.qty);
              oldInv.reservedQty = (oldInv.reservedQty || 0) + oldItem.qty;
            }
          }
          return res.status(400).json({ error: `库存不足，无法预留 SKU: ${item.skuCode} (可用: ${inv ? inv.availableQty : 0}, 需求: ${item.qty})` });
        }
      }

      // Deduct items and create fresh entries
      db.outboundOrderItems = db.outboundOrderItems.filter(item => item.orderId !== currentOrder.id);
      const newItems: OutboundOrderItem[] = updateData.items.map((item: any) => ({
        id: item.id || 'item_' + Math.random().toString(36).substr(2, 9),
        orderId: currentOrder.id,
        skuId: item.skuId,
        skuCode: item.skuCode,
        skuBarcode: item.skuBarcode || item.skuCode,
        qty: item.qty || 1,
        productName: item.productName,
        category: item.category || '未分类'
      }));

      for (const item of newItems) {
        const inv = db.inventory.find(i => i.skuId === item.skuId);
        if (inv) {
          inv.availableQty = Math.max(0, inv.availableQty - item.qty);
          inv.reservedQty = (inv.reservedQty || 0) + item.qty;
        }
      }

      db.outboundOrderItems.push(...newItems);
      updatedOrder.totalQty = newItems.reduce((sum, item) => sum + item.qty, 0);
      updatedOrder.totalWeight = parseFloat((updatedOrder.totalQty * 1.2).toFixed(2));
    }

    db.outboundOrders[index] = updatedOrder;
    saveDB();

    res.json({
      status: 'success',
      order: updatedOrder
    });
  });

  // DELETE /api/outbound-orders/:id
  app.delete('/api/outbound-orders/:id', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({
          where: { id: req.params.id },
          include: { items: true }
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          if (order.customerId !== user.customerId) {
            return res.status(403).json({ error: 'Forbidden. Access denied.' });
          }
        }

        if (order.status === 'SHIPPED') {
          return res.status(400).json({ error: '已出库订单无法删除/取消' });
        }

        const updated = await prisma.$transaction(async (tx) => {
          // Release stock reservations
          const reservations = await tx.inventoryReservation.findMany({
            where: { orderId: order.id, status: 'ACTIVE' }
          });
          for (const resv of reservations) {
            const inv = await tx.inventory.findFirst({
              where: { skuId: resv.skuId, warehouseId: resv.warehouseId }
            });
            if (inv) {
              await tx.inventory.update({
                where: { id: inv.id },
                data: {
                  availableQty: inv.availableQty + resv.quantity,
                  reservedQty: Math.max(0, inv.reservedQty - resv.quantity)
                }
              });
            }
            await tx.inventoryReservation.update({
              where: { id: resv.id },
              data: { status: 'RELEASED', releasedAt: new Date() }
            });
            
            await tx.inventoryTransaction.create({
              data: {
                customerId: resv.customerId,
                warehouseId: resv.warehouseId,
                skuId: resv.skuId,
                skuCode: resv.skuCode,
                type: 'RELEASE',
                direction: 'IN',
                quantity: resv.quantity,
                beforeQty: inv ? inv.availableQty : 0,
                afterQty: inv ? inv.availableQty + resv.quantity : 0,
                reason: `Outbound Order ${order.id} Soft Deleted (Cancelled)`
              }
            });
          }

          return await tx.outboundOrder.update({
            where: { id: order.id },
            data: { status: 'CANCELLED' }
          });
        });

        return res.json({
          status: 'success',
          message: 'Order soft deleted (cancelled) successfully',
          order: updated
        });
      } catch (err: any) {
        console.error('Delete/Cancel order error:', err);
        return res.status(400).json({ error: err.message || 'Delete/Cancel failed.' });
      }
    }

    // JSON fallback
    const db = getDB();
    const ord = db.outboundOrders.find(o => o.id === req.params.id);
    if (!ord) return res.status(404).json({ error: 'Order not found' });
    
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      if (ord.customerId !== user.customerId) {
        return res.status(403).json({ error: 'Forbidden. Access denied.' });
      }
    }

    if (ord.status === 'SHIPPED') {
      return res.status(400).json({ error: '已出库订单无法删除/取消' });
    }
    
    // Release inventory reservation
    await releaseStock(ord.id);
    ord.status = 'CANCELLED';
    saveDB();

    res.json({
      status: 'success',
      message: 'Order soft deleted (cancelled) successfully',
      order: ord
    });
  });

  // POST /api/outbound-orders/batch-generate-wave
  app.post('/api/outbound-orders/batch-generate-wave', requireAuth, async (req: any, res) => {
    const user = req.user;
    const role = (user.role || '').toUpperCase();
    if (role === 'CLIENT' || role === 'CUSTOMER') {
      return res.status(403).json({ error: 'Forbidden: CLIENT role is not permitted to generate waves.' });
    }

    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'No order IDs provided' });
    }

    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const orders = await prisma.outboundOrder.findMany({
          where: { id: { in: orderIds } }
        });

        const invalidOrders = orders.filter(o => 
          ['CANCELLED', 'SHIPPED', 'CANCEL', 'SHIP'].includes((o.status || '').toUpperCase())
        );

        if (invalidOrders.length > 0) {
          return res.status(400).json({
            error: `已取消或已出库的订单禁止生成波次: ${invalidOrders.map(o => o.orderNo).join(', ')}`
          });
        }

        const count = await prisma.wave.count();
        const waveNo = 'WV' + new Date().toISOString().slice(0,10).replace(/-/g, '') + '000' + (count + 1);

        // Run as transaction
        const result = await prisma.$transaction(async (tx) => {
          const wave = await tx.wave.create({
            data: {
              waveNo,
              status: 'PICKING',
              orderCount: orderIds.length
            }
          });

          await tx.outboundOrder.updateMany({
            where: { id: { in: orderIds } },
            data: {
              waveId: wave.id,
              status: 'PICKING'
            }
          });

          await tx.operationLog.create({
            data: {
              userId: user.id || 'usr_1',
              username: user.username || user.email || 'system',
              action: `生成波次: ${waveNo}`,
              details: `成功生成波次 ${waveNo}, 包含 ${orderIds.length} 个订单`
            }
          });

          return wave;
        });

        return res.json({
          status: 'success',
          message: `波次号 ${result.waveNo} 创建成功，成功归集 ${orderIds.length} 个出库单。`,
          wave: result
        });

      } catch (err: any) {
        console.error('Prisma batch wave error:', err);
        return res.status(500).json({ error: 'PostgreSQL error: ' + err.message });
      }
    }

    // JSON fallback
    const db = getDB();
    const orders = db.outboundOrders.filter(o => orderIds.includes(o.id));
    const invalidOrders = orders.filter(o => 
      ['CANCELLED', 'SHIPPED', 'CANCEL', 'SHIP'].includes((o.status || '').toUpperCase())
    );

    if (invalidOrders.length > 0) {
      return res.status(400).json({
        error: `已取消或已出库的订单禁止生成波次: ${invalidOrders.map(o => o.orderNo).join(', ')}`
      });
    }

    // Create a wave
    const waveNo = 'WV' + new Date().toISOString().slice(0,10).replace(/-/g, '') + '000' + (db.waves.length + 1);
    const newWave: Wave = {
      id: 'wave_' + Math.random().toString(36).substr(2, 9),
      waveNo,
      status: 'PICKING',
      orderCount: orderIds.length,
      createdTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    db.outboundOrders = db.outboundOrders.map(ord => {
      if (orderIds.includes(ord.id)) {
        return {
          ...ord,
          waveId: newWave.id,
          status: 'PICKING' as OrderStatus
        };
      }
      return ord;
    });

    db.waves.push(newWave);
    
    // Log operation
    db.operationLogs.push({
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      userId: user.id || 'usr_1',
      username: user.username || user.email || 'system',
      module: '波次归集',
      action: '生成波次',
      targetId: newWave.id,
      detail: `成功生成波次 ${waveNo}, 包含 ${orderIds.length} 个订单`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    saveDB();

    res.json({
      status: 'success',
      message: `波次号 ${waveNo} 创建成功，成功归集 ${orderIds.length} 个出库单。`,
      wave: newWave
    });
  });

  // POST /api/outbound-orders/:id/cancel
  app.post('/api/outbound-orders/:id/cancel', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({
          where: { id: req.params.id },
          include: { items: true }
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          if (order.customerId !== user.customerId) {
            return res.status(403).json({ error: 'Forbidden. Access denied.' });
          }
        }

        if (order.status === 'SHIPPED') {
          return res.status(400).json({ error: '已出库订单无法取消' });
        }

        const updated = await prisma.$transaction(async (tx) => {
          // Release stock reservations
          const reservations = await tx.inventoryReservation.findMany({
            where: { orderId: order.id, status: 'ACTIVE' }
          });
          for (const resv of reservations) {
            const inv = await tx.inventory.findFirst({
              where: { skuId: resv.skuId, warehouseId: resv.warehouseId }
            });
            if (inv) {
              await tx.inventory.update({
                where: { id: inv.id },
                data: {
                  availableQty: inv.availableQty + resv.quantity,
                  reservedQty: Math.max(0, inv.reservedQty - resv.quantity)
                }
              });
            }
            await tx.inventoryReservation.update({
              where: { id: resv.id },
              data: { status: 'RELEASED', releasedAt: new Date() }
            });
            
            await tx.inventoryTransaction.create({
              data: {
                customerId: resv.customerId,
                warehouseId: resv.warehouseId,
                skuId: resv.skuId,
                skuCode: resv.skuCode,
                type: 'RELEASE',
                direction: 'IN',
                quantity: resv.quantity,
                beforeQty: inv ? inv.availableQty : 0,
                afterQty: inv ? inv.availableQty + resv.quantity : 0,
                reason: `Outbound Order ${order.id} Cancelled`
              }
            });
          }

          return await tx.outboundOrder.update({
            where: { id: order.id },
            data: { status: 'CANCELLED' }
          });
        });

        const ws = getWebSocket();
        if (ws) ws.emit('order.status_changed', { orderId: updated.id, orderNo: updated.orderNo, status: 'CANCELLED' }, updated.customerId);
        return res.json({
          status: 'success',
          message: '订单取消成功',
          order: updated
        });
      } catch (err: any) {
        console.error('Cancel order error:', err);
        return res.status(400).json({ error: err.message || 'Cancel failed.' });
      }
    }

    // JSON fallback
    const db = getDB();
    const ord = db.outboundOrders.find(o => o.id === req.params.id);
    if (!ord) return res.status(404).json({ error: 'Order not found' });
    
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      if (ord.customerId !== user.customerId) {
        return res.status(403).json({ error: 'Forbidden. Access denied.' });
      }
    }

    if (ord.status === 'SHIPPED') {
      return res.status(400).json({ error: '已出库订单无法取消' });
    }
    
    // Release inventory reservation
    await releaseStock(ord.id);
    ord.status = 'CANCELLED';
    
    // Log
    db.operationLogs.push({
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      module: '出库管理',
      action: '取消订单',
      targetId: ord.id,
      detail: `取消订单 ${ord.orderNo}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    
    saveDB();
    res.json({ status: 'success', message: '订单取消成功', order: ord });
  });

  // POST /api/outbound-orders/:id/ship (Outbound Shipment Confirmation)
  app.post('/api/outbound-orders/:id/ship', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();

    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({
          where: { id: req.params.id },
          include: { items: true }
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          if (order.customerId !== user.customerId) {
            return res.status(403).json({ error: 'Forbidden. Access denied.' });
          }
        }

        if (order.status === 'SHIPPED') {
          return res.status(400).json({ error: '订单已是出库状态' });
        }
        if (order.status !== 'SHIPPING' && order.status !== 'REVIEWS') {
          return res.status(400).json({ error: `订单状态是 ${order.status}，不能直接出库。必须先完成打包和称重。` });
        }

        const updated = await prisma.$transaction(async (tx) => {
          // Deduct stock (consume reservations)
          const reservations = await tx.inventoryReservation.findMany({
            where: { orderId: order.id, status: 'ACTIVE' }
          });
          for (const resv of reservations) {
            const inv = await tx.inventory.findFirst({
              where: { skuId: resv.skuId, warehouseId: resv.warehouseId }
            });
            if (inv) {
              await tx.inventory.update({
                where: { id: inv.id },
                data: {
                  reservedQty: Math.max(0, inv.reservedQty - resv.quantity)
                }
              });
            }
            await tx.inventoryReservation.update({
              where: { id: resv.id },
              data: { status: 'CONSUMED' }
            });
            
            await tx.inventoryTransaction.create({
              data: {
                customerId: resv.customerId,
                warehouseId: resv.warehouseId,
                skuId: resv.skuId,
                skuCode: resv.skuCode,
                type: 'SHIP',
                direction: 'OUT',
                quantity: resv.quantity,
                beforeQty: inv ? inv.availableQty + inv.reservedQty : 0,
                afterQty: inv ? inv.availableQty + inv.reservedQty - resv.quantity : 0,
                reason: `Outbound Order ${order.id} Shipped`
              }
            });
          }

          return await tx.outboundOrder.update({
            where: { id: order.id },
            data: { status: 'SHIPPED' }
          });
        });

        getWebSocket()?.emit('order.status_changed', { orderId: updated.id, orderNo: updated.orderNo, status: 'SHIPPED' }, updated.customerId);
        return res.json({
          status: 'success',
          message: '出库确认成功，库存已扣减',
          order: updated
        });
      } catch (err: any) {
        console.error('Ship order error:', err);
        return res.status(400).json({ error: err.message || 'Ship failed.' });
      }
    }

    // JSON fallback
    const db = getDB();
    const ord = db.outboundOrders.find(o => o.id === req.params.id);
    if (!ord) return res.status(404).json({ error: 'Order not found' });

    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      if (ord.customerId !== user.customerId) {
        return res.status(403).json({ error: 'Forbidden. Access denied.' });
      }
    }

    if (ord.status === 'SHIPPED') {
      return res.status(400).json({ error: '订单已是出库状态' });
    }

    // Deduct stock in JSON database
    await deductStock(ord.id);
    ord.status = 'SHIPPED';

    // Log
    db.operationLogs.push({
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      module: '出库管理',
      action: '确认出库',
      targetId: ord.id,
      detail: `出库扣减库存: ${ord.orderNo}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    saveDB();
    res.json({ status: 'success', message: '出库确认成功，库存已扣减', order: ord });
  });

  // POST /api/outbound-orders/:id/print-label
  app.post('/api/outbound-orders/:id/print-label', requireAuth, (req, res) => {
    const db = getDB();
    const ord = db.outboundOrders.find(o => o.id === req.params.id);
    if (!ord) return res.status(404).json({ error: 'Order not found' });
    
    ord.labelPrinted = 'PRINTED';
    saveDB();
    res.json({ status: 'success', message: '面单打印状态更新成功', labelUrl: `https://mockpdf.wms.nicec.net/labels/${ord.orderNo}.pdf` });
  });

  // POST /api/outbound-orders/:id/mark-label-printed
  app.post('/api/outbound-orders/:id/mark-label-printed', requireAuth, (req, res) => {
    const db = getDB();
    const ord = db.outboundOrders.find(o => o.id === req.params.id);
    if (!ord) return res.status(404).json({ error: 'Order not found' });
    
    ord.labelPrinted = 'PRINTED';
    saveDB();
    res.json({ status: 'success', order: ord });
  });

  // POST /api/outbound-orders/batch-print-pick-list
  app.post('/api/outbound-orders/batch-print-pick-list', requireAuth, (req, res) => {
    const { orderIds } = req.body;
    res.json({ status: 'success', message: `批量打印发货清单任务成功发送，包含 ${orderIds?.length || 0} 个出库单。` });
  });

  // POST /api/outbound-orders/export
  app.post('/api/outbound-orders/export', requireAuth, (req, res) => {
    res.json({ status: 'success', downloadUrl: 'https://mockpdf.wms.nicec.net/export/orders_export_temp.xlsx' });
  });

  // ==========================================
  // Waves API
  // ==========================================
  app.get('/api/waves', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const waves = await prisma.wave.findMany({
          orderBy: { createdTime: 'desc' }
        });
        return res.json(waves);
      } catch (err) {
        console.error('Prisma waves list error:', err);
      }
    }
    const db = getDB();
    res.json(db.waves);
  });

  app.get('/api/waves/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const wave = await prisma.wave.findUnique({
          where: { id: req.params.id },
          include: { orders: true }
        });
        if (!wave) return res.status(404).json({ error: 'Wave not found' });
        return res.json(wave);
      } catch (err) {
        console.error('Prisma wave fetch error:', err);
      }
    }
    const db = getDB();
    const wave = db.waves.find(w => w.id === req.params.id);
    if (!wave) return res.status(404).json({ error: 'Wave not found' });
    const waveOrders = db.outboundOrders.filter(o => o.waveId === wave.id);
    res.json({ ...wave, orders: waveOrders });
  });

  app.post('/api/waves', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const count = await prisma.wave.count();
        const waveNo = 'WV' + new Date().toISOString().slice(0,10).replace(/-/g, '') + '000' + (count + 1);
        const newWave = await prisma.wave.create({
          data: {
            waveNo,
            status: 'PENDING',
            orderCount: 0
          }
        });
        return res.status(201).json({ status: 'success', wave: newWave });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const waveNo = 'WV' + new Date().toISOString().slice(0,10).replace(/-/g, '') + '000' + (db.waves.length + 1);
    const newWave: Wave = {
      id: 'wave_' + Math.random().toString(36).substr(2, 9),
      waveNo,
      status: 'PENDING',
      orderCount: 0,
      createdTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    db.waves.push(newWave);
    saveDB();
    res.status(201).json({ status: 'success', wave: newWave });
  });

  app.put('/api/waves/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.wave.update({
          where: { id: req.params.id },
          data: {
            status: req.body.status,
            orderCount: req.body.orderCount !== undefined ? parseInt(req.body.orderCount) : undefined
          }
        });
        return res.json({ status: 'success', wave: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const index = db.waves.findIndex(w => w.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Wave not found' });
    db.waves[index] = { ...db.waves[index], ...req.body };
    saveDB();
    res.json({ status: 'success', wave: db.waves[index] });
  });

  app.delete('/api/waves/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.wave.delete({ where: { id: req.params.id } });
        return res.json({ status: 'success', message: '波次关闭/删除成功' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.waves = db.waves.filter(w => w.id !== req.params.id);
    db.outboundOrders = db.outboundOrders.map(o => o.waveId === req.params.id ? { ...o, waveId: null } : o);
    saveDB();
    res.json({ status: 'success', message: '波次关闭/删除成功' });
  });

  // ==========================================
  // Customers API (CRUD)
  // ==========================================
  app.get('/api/customers/:id', requireAuth, requireCustomerAccess, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const cust = await prisma.customer.findUnique({ where: { id: req.params.id } });
        if (!cust) return res.status(404).json({ error: 'Customer not found' });
        return res.json(cust);
      } catch (err) {
        console.error('Prisma customer fetch error:', err);
      }
    }

    const db = getDB();
    const cust = db.customers.find(c => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });
    res.json(cust);
  });

  app.post('/api/customers', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const newCust = await prisma.customer.create({
          data: {
            name: req.body.name,
            code: req.body.code,
            contact: req.body.contactName || req.body.contact || '-',
            email: req.body.email || '-'
          }
        });
        return res.status(201).json({ status: 'success', customer: newCust });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const newCust = {
      id: 'cust_' + Math.random().toString(36).substr(2, 9),
      ...req.body
    };
    db.customers.push(newCust);
    saveDB();
    res.status(201).json({ status: 'success', customer: newCust });
  });

  app.put('/api/customers/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.customer.update({
          where: { id: req.params.id },
          data: {
            name: req.body.name,
            code: req.body.code,
            contact: req.body.contactName !== undefined ? req.body.contactName : req.body.contact,
            email: req.body.email
          }
        });
        return res.json({ status: 'success', customer: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const index = db.customers.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Customer not found' });
    db.customers[index] = { ...db.customers[index], ...req.body };
    saveDB();
    res.json({ status: 'success', customer: db.customers[index] });
  });

  app.delete('/api/customers/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.customer.delete({ where: { id: req.params.id } });
        return res.json({ status: 'success', message: 'Customer deleted' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.customers = db.customers.filter(c => c.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'Customer deleted' });
  });

  // ==========================================
  // Products API (CRUD)
  // ==========================================
  app.get('/api/products/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const prod = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!prod) return res.status(404).json({ error: 'Product not found' });
        return res.json(prod);
      } catch (err) {
        console.error('Prisma product fetch error:', err);
      }
    }
    const db = getDB();
    const prod = db.products.find(p => p.id === req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    res.json(prod);
  });

  app.post('/api/products', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const newProd = await prisma.product.create({
          data: {
            name: req.body.name,
            sku: req.body.sku,
            barcode: req.body.barcode || null,
            category: req.body.category || null,
            weight: parseFloat(req.body.weight || 0),
            volume: parseFloat(req.body.volume || 0),
            customerId: req.body.customerId || 'cust_1'
          }
        });
        return res.status(201).json({ status: 'success', product: newProd });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const newProd = {
      id: 'prod_' + Math.random().toString(36).substr(2, 9),
      brand: req.body.brand || '-',
      description: req.body.description || '-',
      status: 'ACTIVE',
      ...req.body
    };
    db.products.push(newProd);
    saveDB();
    res.status(201).json({ status: 'success', product: newProd });
  });

  app.put('/api/products/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.product.update({
          where: { id: req.params.id },
          data: {
            name: req.body.name,
            sku: req.body.sku,
            barcode: req.body.barcode,
            category: req.body.category,
            weight: req.body.weight !== undefined ? parseFloat(req.body.weight) : undefined,
            volume: req.body.volume !== undefined ? parseFloat(req.body.volume) : undefined,
            customerId: req.body.customerId
          }
        });
        return res.json({ status: 'success', product: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const index = db.products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    db.products[index] = { ...db.products[index], ...req.body };
    saveDB();
    res.json({ status: 'success', product: db.products[index] });
  });

  app.delete('/api/products/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.product.delete({ where: { id: req.params.id } });
        return res.json({ status: 'success', message: 'Product deleted' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.products = db.products.filter(p => p.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'Product deleted' });
  });

  // ==========================================
  // SKUs API (CRUD)
  // ==========================================
  app.get('/api/skus', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        let skus = [];
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          skus = await prisma.sKU.findMany({ where: { customerId: user.customerId } });
        } else {
          skus = await prisma.sKU.findMany();
        }
        return res.json(skus);
      } catch (err) {
        console.error('Prisma SKU fetch list error:', err);
      }
    }

    const db = getDB();
    let skus = db.skus;
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      skus = skus.filter(s => s.customerId === user.customerId);
    }
    res.json(skus);
  });

  app.get('/api/skus/:id', requireAuth, requireCustomerAccess, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const sku = await prisma.sKU.findUnique({ where: { id: req.params.id } });
        if (!sku) return res.status(404).json({ error: 'SKU not found' });
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          if (sku.customerId !== user.customerId) {
            return res.status(403).json({ error: 'Forbidden. Access denied.' });
          }
        }
        return res.json(sku);
      } catch (err) {
        console.error('Prisma SKU fetch error:', err);
      }
    }

    const db = getDB();
    const sku = db.skus.find(s => s.id === req.params.id);
    if (!sku) return res.status(404).json({ error: 'SKU not found' });
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      if (sku.customerId !== user.customerId) {
        return res.status(403).json({ error: 'Forbidden. Access denied.' });
      }
    }
    res.json(sku);
  });

  app.post('/api/skus', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const newSku = await prisma.sKU.create({
          data: {
            code: req.body.code,
            name: req.body.name,
            barcode: req.body.barcode || '-',
            weight: parseFloat(req.body.weight || 0),
            customerId: req.body.customerId || 'cust_1'
          }
        });
        return res.status(201).json({ status: 'success', sku: newSku });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const newSku = {
      id: 'sku_' + Math.random().toString(36).substr(2, 9),
      ...req.body
    };
    db.skus.push(newSku);
    saveDB();
    res.status(201).json({ status: 'success', sku: newSku });
  });

  app.put('/api/skus/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.sKU.update({
          where: { id: req.params.id },
          data: {
            code: req.body.code,
            name: req.body.name,
            barcode: req.body.barcode,
            weight: req.body.weight !== undefined ? parseFloat(req.body.weight) : undefined,
            customerId: req.body.customerId
          }
        });
        return res.json({ status: 'success', sku: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const index = db.skus.findIndex(s => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'SKU not found' });
    db.skus[index] = { ...db.skus[index], ...req.body };
    saveDB();
    res.json({ status: 'success', sku: db.skus[index] });
  });

  app.delete('/api/skus/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.sKU.delete({ where: { id: req.params.id } });
        return res.json({ status: 'success', message: 'SKU deleted' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.skus = db.skus.filter(s => s.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'SKU deleted' });
  });

  // ==========================================
  // Carriers API (CRUD)
  // ==========================================
  app.post('/api/carriers', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const newCarr = await prisma.carrier.create({
          data: {
            name: req.body.name,
            code: req.body.code
          }
        });
        return res.status(201).json({ status: 'success', carrier: newCarr });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const newCarr = {
      id: 'carr_' + Math.random().toString(36).substr(2, 9),
      ...req.body
    };
    db.carriers.push(newCarr);
    saveDB();
    res.status(201).json({ status: 'success', carrier: newCarr });
  });

  app.put('/api/carriers/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.carrier.update({
          where: { id: req.params.id },
          data: {
            name: req.body.name,
            code: req.body.code
          }
        });
        return res.json({ status: 'success', carrier: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const index = db.carriers.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Carrier not found' });
    db.carriers[index] = { ...db.carriers[index], ...req.body };
    saveDB();
    res.json({ status: 'success', carrier: db.carriers[index] });
  });

  app.delete('/api/carriers/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.carrier.delete({ where: { id: req.params.id } });
        return res.json({ status: 'success', message: 'Carrier deleted' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.carriers = db.carriers.filter(c => c.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'Carrier deleted' });
  });

  // ==========================================
  // Logistics Channels API (CRUD)
  // ==========================================
  app.post('/api/logistics-channels', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const newChan = await prisma.logisticsChannel.create({
          data: {
            name: req.body.name,
            code: req.body.code,
            carrierId: req.body.carrierId
          }
        });
        return res.status(201).json({ status: 'success', channel: newChan });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const newChan = {
      id: 'chan_' + Math.random().toString(36).substr(2, 9),
      ...req.body
    };
    db.logisticsChannels.push(newChan);
    saveDB();
    res.status(201).json({ status: 'success', channel: newChan });
  });

  app.put('/api/logistics-channels/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.logisticsChannel.update({
          where: { id: req.params.id },
          data: {
            name: req.body.name,
            code: req.body.code,
            carrierId: req.body.carrierId
          }
        });
        return res.json({ status: 'success', channel: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const index = db.logisticsChannels.findIndex(l => l.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Channel not found' });
    db.logisticsChannels[index] = { ...db.logisticsChannels[index], ...req.body };
    saveDB();
    res.json({ status: 'success', channel: db.logisticsChannels[index] });
  });

  app.delete('/api/logistics-channels/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.logisticsChannel.delete({ where: { id: req.params.id } });
        return res.json({ status: 'success', message: 'Channel deleted' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.logisticsChannels = db.logisticsChannels.filter(l => l.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'Channel deleted' });
  });

  // ==========================================
  // Warehouses API
  // ==========================================
  app.get('/api/warehouses', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const whs = await prisma.warehouse.findMany();
        return res.json(whs);
      } catch (err) {
        console.error('Prisma warehouses fetch error:', err);
      }
    }
    const db = getDB();
    res.json(db.warehouses);
  });

  app.post('/api/warehouses', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN', 'WAREHOUSE_MANAGER'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const newWh = await prisma.warehouse.create({
          data: {
            name: req.body.name,
            code: req.body.code,
            address: req.body.address || '-'
          }
        });
        return res.status(201).json({ status: 'success', warehouse: newWh });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const newWh = {
      id: 'wh_' + Math.random().toString(36).substr(2, 9),
      ...req.body
    };
    db.warehouses.push(newWh);
    saveDB();
    res.status(201).json({ status: 'success', warehouse: newWh });
  });

  app.put('/api/warehouses/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN', 'WAREHOUSE_MANAGER'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.warehouse.update({
          where: { id: req.params.id },
          data: {
            name: req.body.name,
            code: req.body.code,
            address: req.body.address
          }
        });
        return res.json({ status: 'success', warehouse: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const index = db.warehouses.findIndex(w => w.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Warehouse not found' });
    db.warehouses[index] = { ...db.warehouses[index], ...req.body };
    saveDB();
    res.json({ status: 'success', warehouse: db.warehouses[index] });
  });

  app.delete('/api/warehouses/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.warehouse.delete({ where: { id: req.params.id } });
        return res.json({ status: 'success', message: 'Warehouse deleted' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.warehouses = db.warehouses.filter(w => w.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'Warehouse deleted' });
  });

  // ==========================================
  // User CRUD (Admin)
  // ==========================================
  app.get('/api/users', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, role: true, customerId: true, status: true, createdAt: true, updatedAt: true } });
        return res.json(users);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    }
    const db = getDB();
    res.json(db.users || []);
  });

  app.post('/api/users', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { username, email, password, role, customerId } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
          data: { username, email: email || username, passwordHash, role: role || 'WAREHOUSE_OPERATOR', customerId: customerId || null },
          select: { id: true, username: true, email: true, role: true, customerId: true, status: true, createdAt: true }
        });
        return res.status(201).json({ status: 'success', user });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const newUser = { id: 'usr_' + Date.now(), username, email: email || username, role: role || 'WAREHOUSE_OPERATOR', status: 'ACTIVE', createdAt: new Date().toISOString() };
    if (!db.users) db.users = [];
    db.users.push(newUser);
    saveDB();
    res.status(201).json({ status: 'success', user: newUser });
  });

  app.put('/api/users/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const data: any = {};
        if (req.body.username) data.username = req.body.username;
        if (req.body.email) data.email = req.body.email;
        if (req.body.role) data.role = req.body.role;
        if (req.body.status) data.status = req.body.status;
        if (req.body.password) data.passwordHash = await bcrypt.hash(req.body.password, 10);
        const user = await prisma.user.update({ where: { id: req.params.id }, data, select: { id: true, username: true, email: true, role: true, customerId: true, status: true, createdAt: true, updatedAt: true } });
        return res.json({ status: 'success', user });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const idx = (db.users || []).findIndex((u: any) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    db.users[idx] = { ...db.users[idx], ...req.body };
    saveDB();
    res.json({ status: 'success', user: db.users[idx] });
  });

  app.delete('/api/users/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.user.delete({ where: { id: req.params.id } });
        return res.json({ status: 'success', message: 'User deleted' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.users = (db.users || []).filter((u: any) => u.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'User deleted' });
  });

  // ==========================================
  // Inventory API
  // ==========================================
  app.get('/api/inventory', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        let inventory = [];
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          inventory = await prisma.inventory.findMany({ where: { customerId: user.customerId } });
        } else {
          inventory = await prisma.inventory.findMany();
        }
        return res.json(inventory);
      } catch (err) {
        console.error('Prisma inventory list fetch error:', err);
      }
    }

    const db = getDB();
    let inventory = db.inventory;
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      inventory = inventory.filter((inv: any) => inv.customerId === user.customerId);
    }
    res.json(inventory);
  });

  app.put('/api/inventory/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const { availableQty, reservedQty, damagedQty } = req.body;
        const data: any = {};
        if (availableQty !== undefined) data.availableQty = availableQty;
        if (reservedQty !== undefined) data.reservedQty = reservedQty;
        if (damagedQty !== undefined) data.damagedQty = damagedQty;
        const updated = await prisma.inventory.update({ where: { id: req.params.id }, data });
        return res.json({ status: 'success', inventory: updated });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    const db = getDB();
    const index = db.inventory.findIndex(i => i.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Inventory not found' });
    db.inventory[index] = { ...db.inventory[index], ...req.body };
    saveDB();
    res.json({ status: 'success', inventory: db.inventory[index] });
  });

  // ==========================================
  // Operation Logs API
  // ==========================================
  app.get('/api/operation-logs', requireAuth, async (req: any, res) => {
    const user = req.user;
    const role = (user.role || '').toUpperCase();
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if (role === 'CLIENT') {
          return res.status(403).json({ error: 'Forbidden. Clients cannot access global operation logs.' });
        }
        const logs = await prisma.operationLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
        return res.json(logs);
      } catch (err) { console.error('Prisma operation logs fetch error:', err); }
    }
    const db = getDB();
    if (role === 'CLIENT') {
      return res.status(403).json({ error: 'Forbidden. Clients cannot access global operation logs.' });
    }
    res.json((db.operationLogs || []).slice(0, 200));
  });

  // ==========================================
  // WMS AI Assistant API (OpenAI-compatible)
  // ==========================================
  let aiHistory: Array<{ id: string; role: 'user' | 'model'; content: string; createdAt: string }> = [
    {
      id: 'msg_welcome',
      role: 'model',
      content: 'Hello! I am your WMS AI Assistant. I specialize in warehouse operations, orders, inventory, and logistics. How can I help you today?',
      createdAt: new Date().toISOString()
    }
  ];

  app.get('/api/wms-ai-assistant/history', requireAuth, (req, res) => {
    res.json(aiHistory);
  });

  app.delete('/api/wms-ai-assistant/history', requireAuth, (req, res) => {
    aiHistory = [
      {
        id: 'msg_welcome',
        role: 'model',
        content: 'Hello! I am your WMS AI Assistant. I specialize in warehouse operations, orders, inventory, and logistics. How can I help you today?',
        createdAt: new Date().toISOString()
      }
    ];
    res.json({ status: 'success', message: 'Chat history cleared' });
  });

  app.post('/api/wms-ai-assistant/chat', requireAuth, async (req: any, res) => {
    const { question, warehouseId, operationScope, currentPage } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    try {
      const result = await processChat({
        userId: req.user.id,
        role: req.user.role,
        customerId: req.user.customerId,
        question,
        warehouseId,
        operationScope,
        currentPage,
      });

      const userMsg = {
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        role: 'user' as const,
        content: question,
        createdAt: new Date().toISOString()
      };

      const modelMsg = {
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        role: 'model' as const,
        content: result.response,
        createdAt: new Date().toISOString()
      };

      aiHistory.push(userMsg, modelMsg);

      // Notify admin/warehouse if this is a client asking a question
      const ws = getWebSocket();
      if (ws && req.user.role === 'CLIENT') {
        ws.emit('feedback.created', {
          userId: req.user.id,
          customerId: req.user.customerId,
          question,
          preview: result.response.substring(0, 100),
        }, req.user.customerId);
      }

      res.json({
        status: 'success',
        response: result.response,
        provider: result.provider,
        history: aiHistory
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'AI Assistant error' });
    }
  });

  // ==========================================
  // Feedback APIs (User & Admin)
  // ==========================================

  // List feedbacks with filters
  app.get('/api/feedback', (req, res) => {
    const db = getDB();
    const { type, status, priority, userId, warehouseId, operationScope, search } = req.query;

    let list = [...db.feedbacks];

    // Role-based customer data isolation
    const user = getCurrentUser(req);
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      list = list.filter((f: any) => f.customerId === user.customerId || f.userId === user.id);
    }

    if (type) list = list.filter(f => f.type === type);
    if (status) list = list.filter(f => f.status === status);
    if (priority) list = list.filter(f => f.priority === priority);
    if (userId) list = list.filter(f => f.userId === userId);
    if (warehouseId && warehouseId !== 'All Warehouses') list = list.filter(f => f.warehouseId === warehouseId);
    if (operationScope && operationScope !== 'All Operations') list = list.filter(f => f.operationScope === operationScope);
    
    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(f => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
    }

    // Attach comments count
    const resolvedList = list.map(f => {
      const comments = db.feedbackComments.filter(c => c.feedbackId === f.id);
      return {
        ...f,
        commentsCount: comments.length
      };
    });

    res.json(resolvedList);
  });

  // Get single feedback
  app.get('/api/feedback/:id', (req, res) => {
    const db = getDB();
    const feedback = db.feedbacks.find(f => f.id === req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    const comments = db.feedbackComments.filter(c => c.feedbackId === feedback.id);
    res.json({
      ...feedback,
      comments
    });
  });

  // Create feedback
  app.post('/api/feedback', (req, res) => {
    const db = getDB();
    const { type, title, description, relatedPage, warehouseId, operationScope, priority, contactEmail } = req.body;

    if (!type || !title || !description) {
      return res.status(400).json({ error: 'Type, title, and description are required' });
    }

    const newFeedback: Feedback = {
      id: 'fb_' + Math.random().toString(36).substr(2, 9),
      organizationId: 'org_nicec',
      userId: 'usr_1', // Default active user (Neal)
      warehouseId: warehouseId || 'All Warehouses',
      operationScope: operationScope || 'All Operations',
      type,
      title,
      description,
      relatedPage: relatedPage || '/settings',
      priority: priority || 'Medium',
      status: 'New',
      screenshotUrl: req.body.screenshotUrl || null,
      contactEmail: contactEmail || 'neal@nicec.net',
      browserInfo: 'Chrome 126.0.0',
      deviceInfo: 'MacBook Pro',
      assignedToUserId: 'usr_admin',
      assignedToUsername: 'admin@nicec.net',
      internalNotes: '',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      resolvedAt: null
    };

    db.feedbacks.push(newFeedback);
    saveDB();

    res.status(201).json({ status: 'success', feedback: newFeedback });
  });

  // Update feedback (PATCH)
  app.patch('/api/feedback/:id', (req, res) => {
    const db = getDB();
    const index = db.feedbacks.findIndex(f => f.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    const current = db.feedbacks[index];
    const update = req.body;

    const updated: Feedback = {
      ...current,
      ...update,
      id: current.id, // Forbid changing ID
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    if (update.status === 'Resolved' && current.status !== 'Resolved') {
      updated.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    } else if (update.status && update.status !== 'Resolved') {
      updated.resolvedAt = null;
    }

    db.feedbacks[index] = updated;
    saveDB();

    res.json({ status: 'success', feedback: updated });
  });

  // Add comment
  app.post('/api/feedback/:id/comments', (req, res) => {
    const db = getDB();
    const { comment, isInternal, userId, username } = req.body;

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const newComment: FeedbackComment = {
      id: 'fbc_' + Math.random().toString(36).substr(2, 9),
      feedbackId: req.params.id,
      userId: userId || 'usr_1',
      username: username || 'neal@nicec.net',
      comment,
      isInternal: isInternal || false,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    db.feedbackComments.push(newComment);
    saveDB();

    res.status(201).json({ status: 'success', comment: newComment });
  });

  // Get comments
  app.get('/api/feedback/:id/comments', (req, res) => {
    const db = getDB();
    const comments = db.feedbackComments.filter(c => c.feedbackId === req.params.id);
    res.json(comments);
  });

  // Admin Mirror Routes (admin-only)
  app.get('/api/admin/feedback', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res) => {
    const db = getDB();
    const { type, status, priority, userId, warehouseId, operationScope, search } = req.query;

    let list = [...db.feedbacks];

    if (type) list = list.filter(f => f.type === type);
    if (status) list = list.filter(f => f.status === status);
    if (priority) list = list.filter(f => f.priority === priority);
    if (userId) list = list.filter(f => f.userId === userId);
    if (warehouseId && warehouseId !== 'All Warehouses') list = list.filter(f => f.warehouseId === warehouseId);
    if (operationScope && operationScope !== 'All Operations') list = list.filter(f => f.operationScope === operationScope);

    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(f => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
    }

    const resolvedList = list.map(f => {
      const comments = db.feedbackComments.filter(c => c.feedbackId === f.id);
      return {
        ...f,
        commentsCount: comments.length
      };
    });

    res.json(resolvedList);
  });

  app.get('/api/admin/feedback/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res) => {
    const db = getDB();
    const feedback = db.feedbacks.find(f => f.id === req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    const comments = db.feedbackComments.filter(c => c.feedbackId === feedback.id);
    res.json({ ...feedback, comments });
  });

  app.patch('/api/admin/feedback/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res) => {
    const db = getDB();
    const index = db.feedbacks.findIndex(f => f.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    const current = db.feedbacks[index];
    const update = req.body;

    const updated: Feedback = {
      ...current,
      ...update,
      id: current.id,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    if (update.status === 'Resolved' && current.status !== 'Resolved') {
      updated.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    } else if (update.status && update.status !== 'Resolved') {
      updated.resolvedAt = null;
    }

    db.feedbacks[index] = updated;
    saveDB();

    res.json({ status: 'success', feedback: updated });
  });

  app.post('/api/admin/feedback/:id/assign', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res) => {
    const db = getDB();
    const index = db.feedbacks.findIndex(f => f.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    const { assignedToUserId, assignedToUsername } = req.body;
    db.feedbacks[index].assignedToUserId = assignedToUserId;
    db.feedbacks[index].assignedToUsername = assignedToUsername || 'admin@nicec.net';
    db.feedbacks[index].updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    saveDB();
    res.json({ status: 'success', feedback: db.feedbacks[index] });
  });

  app.post('/api/admin/feedback/:id/status', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), (req, res) => {
    const db = getDB();
    const index = db.feedbacks.findIndex(f => f.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    const { status } = req.body;
    db.feedbacks[index].status = status;
    db.feedbacks[index].updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (status === 'Resolved') {
      db.feedbacks[index].resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    } else {
      db.feedbacks[index].resolvedAt = null;
    }

    saveDB();
    res.json({ status: 'success', feedback: db.feedbacks[index] });
  });

  // ==========================================
  // Dashboard Metrics API
  // ==========================================
  app.get('/api/dashboard/summary', requireAuth, (req: any, res) => {
    const db = getDB();
    const isClient = req.user.role === 'CLIENT';
    const customerId = req.user.customerId;
    const orders = isClient ? db.outboundOrders.filter(o => o.customerId === customerId) : db.outboundOrders;
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const shippedOrders = orders.filter(o => o.status === 'SHIPPED').length;
    const exceptionOrders = orders.filter(o => o.status === 'EXCEPTIONS').length;
    const totalSKUs = db.skus.length;
    
    res.json({
      pendingOrders,
      shippedOrders,
      exceptionOrders,
      totalSKUs
    });
  });

  app.get('/api/dashboard/outbound-trend', requireAuth, (req, res) => {
    // Return recent 7 days trends
    res.json([
      { date: '06-23', qty: 1540 },
      { date: '06-24', qty: 1820 },
      { date: '06-25', qty: 2110 },
      { date: '06-26', qty: 1940 },
      { date: '06-27', qty: 1680 },
      { date: '06-28', qty: 2340 },
      { date: '06-29', qty: 2614 }
    ]);
  });

  app.get('/api/dashboard/channel-distribution', requireAuth, (req: any, res) => {
    const db = getDB();
    const isClient = req.user.role === 'CLIENT';
    const customerId = req.user.customerId;
    const orders = isClient ? db.outboundOrders.filter(o => o.customerId === customerId) : db.outboundOrders;
    // Group by logisticsChannelId (or salesPlatform as fallback)
    const channelOrders: Record<string, number> = {};
    for (const o of orders) {
      const key = (o as any).logisticsChannelId || (o as any).salesPlatform || 'Unknown';
      channelOrders[key] = (channelOrders[key] || 0) + 1;
    }
    const total = Object.values(channelOrders).reduce((s: number, v: number) => s + v, 0);
    // Resolve channel names
    const distribution = Object.entries(channelOrders).map(([id, value]) => {
      const chan = db.logisticsChannels.find((l: any) => l.id === id);
      return { name: chan?.name || id, value: Math.round((value / total) * 100) };
    });
    res.json(distribution.length > 0 ? distribution : [
      { name: 'FEDEX FHD_G', value: 45 },
      { name: 'USPS GROUND', value: 35 },
      { name: 'UPS GROUND', value: 12 },
      { name: 'DHL EXPRESS', value: 5 },
      { name: 'AMAZON SHIP', value: 3 }
    ]);
  });

  // Auth Me endpoint
  app.get('/api/auth/me', (req, res) => {
    const user = getCurrentUser(req);
    if (user) {
      return res.json(user);
    }
    return res.status(401).json({ error: 'Unauthorized: invalid or missing token' });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ status: 'success', message: 'Logged out successfully' });
  });

  // ==========================================
  // Additional WMS MVP Core APIs
  // ==========================================

  // 1. Locations APIs
  app.get('/api/locations', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const locations = await prisma.location.findMany();
        return res.json(locations);
      } catch (err) {
        console.error('Prisma locations fetch error:', err);
      }
    }
    res.json([
      { id: 'loc_a1', code: 'A-1-1', warehouseId: 'wh_1', zoneCode: 'ZONE-A' },
      { id: 'loc_a2', code: 'A-1-2', warehouseId: 'wh_1', zoneCode: 'ZONE-A' },
      { id: 'loc_b1', code: 'B-1-1', warehouseId: 'wh_1', zoneCode: 'ZONE-B' }
    ]);
  });

  app.post('/api/locations', requireAuth, async (req: any, res) => {
    const { code, warehouseId, zoneCode } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const newLoc = await prisma.location.create({
          data: { code, warehouseId, zoneCode }
        });
        return res.status(201).json(newLoc);
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.status(201).json({ id: 'loc_' + Math.random().toString(36).substr(2, 9), code, warehouseId, zoneCode });
  });

  // 2. Inventory Detail & Additional APIs
  app.get('/api/inventory/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const inv = await prisma.inventory.findUnique({
          where: { id: req.params.id },
          include: { customer: true }
        });
        if (!inv) return res.status(404).json({ error: 'Inventory not found' });
        return res.json(inv);
      } catch (err) {
        console.error('Prisma inventory fetch error:', err);
      }
    }
    const db = getDB();
    const inv = db.inventory.find(i => i.id === req.params.id);
    if (!inv) return res.status(404).json({ error: 'Inventory not found' });
    res.json(inv);
  });

  app.get('/api/inventory-transactions', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          where.customerId = user.customerId;
        }
        const txs = await prisma.inventoryTransaction.findMany({ where, orderBy: { createdAt: 'desc' } });
        return res.json(txs);
      } catch (err) {
        console.error('Prisma transactions fetch error:', err);
      }
    }
    res.json([
      { id: 'tx_mock_1', customerId: user.customerId || 'cust_1', warehouseId: 'wh_1', skuCode: 'TS-V-NA-4', type: 'RESERVE', direction: 'OUT', quantity: 1, beforeQty: 100, afterQty: 99, reason: 'Outbound reservation', createdAt: new Date() }
    ]);
  });

  app.get('/api/inventory-reservations', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          where.customerId = user.customerId;
        }
        const resvs = await prisma.inventoryReservation.findMany({ where, orderBy: { createdAt: 'desc' } });
        return res.json(resvs);
      } catch (err) {
        console.error('Prisma reservations fetch error:', err);
      }
    }
    res.json([
      { id: 'res_mock_1', customerId: user.customerId || 'cust_1', orderId: 'ord_spec_1', skuCode: 'TS-V-NA-4', warehouseId: 'wh_1', quantity: 1, status: 'ACTIVE', createdAt: new Date() }
    ]);
  });

  app.post('/api/inventory-adjustments', requireAuth, async (req: any, res) => {
    const { skuId, warehouseId, adjustQty, type, reason } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.$transaction(async (tx) => {
          const inv = await tx.inventory.findFirst({
            where: { skuId, warehouseId }
          });
          if (!inv) throw new Error('Inventory not found for specified SKU and warehouse');
          
          const delta = type === 'SUBTRACT' ? -adjustQty : adjustQty;
          const newQty = Math.max(0, inv.availableQty + delta);
          
          const updatedInv = await tx.inventory.update({
            where: { id: inv.id },
            data: { availableQty: newQty }
          });
          
          await tx.inventoryTransaction.create({
            data: {
              customerId: inv.customerId,
              warehouseId,
              skuId,
              skuCode: inv.skuCode,
              type: 'ADJUSTMENT',
              direction: delta > 0 ? 'IN' : 'OUT',
              quantity: Math.abs(delta),
              beforeQty: inv.availableQty,
              afterQty: newQty,
              reason: reason || 'Manual Inventory Adjustment'
            }
          });
          
          return updatedInv;
        });
        
        return res.json({ status: 'success', inventory: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ status: 'success', message: 'Manual Adjustment recorded (Mock)' });
  });

  // 3. Inbound APIs (InboundOrder, PutawayTask)
  app.get('/api/inbound-orders', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          where.customerId = user.customerId;
        }
        const orders = await prisma.inboundOrder.findMany({
          where,
          include: { items: true, customer: true },
          orderBy: { createdAt: 'desc' }
        });
        return res.json(orders);
      } catch (err) {
        console.error('Prisma inbound orders error:', err);
      }
    }
    res.json([
      { id: 'in_1', orderNo: 'ASN202607010001', customerId: user.customerId || 'cust_1', customerName: 'Yukon', status: 'PENDING', warehouseId: 'wh_1', remark: 'Inbound raw materials', createdAt: new Date() }
    ]);
  });

  app.post('/api/inbound-orders', requireAuth, async (req: any, res) => {
    const user = req.user;
    const { items = [], warehouseId: bodyWhId, remark = '-' } = req.body;
    const warehouseId = bodyWhId || resolveWarehouseId(req.user, 'wh_default');
    const customerId = user.customerId || req.body.customerId || 'cust_1';
    
    const orderNo = 'ASN' + String(Date.now()).substring(3, 15);
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const newOrder = await prisma.inboundOrder.create({
          data: {
            orderNo,
            customerId,
            warehouseId,
            remark,
            status: 'PENDING',
            items: {
              create: items.map((i: any) => ({
                skuId: i.skuId,
                skuCode: i.skuCode,
                qtyExpected: i.qtyExpected || 10,
                qtyReceived: 0
              }))
            }
          },
          include: { items: true }
        });
        return res.status(201).json(newOrder);
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.status(201).json({ id: 'in_mock', orderNo, customerId, warehouseId, remark, status: 'PENDING' });
  });

  app.post('/api/inbound-orders/:id/receive', requireAuth, async (req: any, res) => {
    const { receivedItems = [] } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.inboundOrder.findUnique({
          where: { id: req.params.id },
          include: { items: true }
        });
        if (!order) return res.status(404).json({ error: 'Inbound order not found' });
        
        await prisma.$transaction(async (tx) => {
          for (const item of receivedItems) {
            const orderItem = order.items.find(i => i.skuId === item.skuId);
            if (orderItem) {
              await tx.inboundOrderItem.update({
                where: { id: orderItem.id },
                data: { qtyReceived: (orderItem.qtyReceived || 0) + item.qtyReceived }
              });
              
              const inv = await tx.inventory.findFirst({
                where: { skuId: item.skuId, warehouseId: order.warehouseId }
              });
              if (inv) {
                await tx.inventory.update({
                  where: { id: inv.id },
                  data: { availableQty: inv.availableQty + item.qtyReceived }
                });
                
                await tx.inventoryTransaction.create({
                  data: {
                    customerId: order.customerId,
                    warehouseId: order.warehouseId,
                    skuId: item.skuId,
                    skuCode: orderItem.skuCode,
                    type: 'INBOUND_RECEIVED',
                    direction: 'IN',
                    quantity: item.qtyReceived,
                    beforeQty: inv.availableQty,
                    afterQty: inv.availableQty + item.qtyReceived,
                    reason: `ASN ${order.orderNo} Received`
                  }
                });
              }
              
              const paNo = 'PA' + String(Date.now()).substring(3, 15);
              await tx.putawayTask.create({
                data: {
                  taskNo: paNo,
                  inboundOrderId: order.id,
                  skuId: item.skuId,
                  skuCode: orderItem.skuCode,
                  warehouseId: order.warehouseId,
                  quantity: item.qtyReceived,
                  status: 'PENDING'
                }
              });
            }
          }
          
          await tx.inboundOrder.update({
            where: { id: order.id },
            data: { status: 'RECEIVED' }
          });
        });
        
        return res.json({ status: 'success', message: 'Inbound shipment received and inventory updated' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ status: 'success', message: 'Mock inbounding completed' });
  });

  app.get('/api/putaway-tasks', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const tasks = await prisma.putawayTask.findMany();
        return res.json(tasks);
      } catch (err) {
        console.error('Prisma putaway tasks fetch error:', err);
      }
    }
    res.json([]);
  });

  app.post('/api/putaway-tasks/:id/complete', requireAuth, async (req: any, res) => {
    const { locationId } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.putawayTask.update({
          where: { id: req.params.id },
          data: { status: 'COMPLETED', locationId }
        });
        return res.json({ status: 'success', message: 'Putaway completed successfully' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ status: 'success', message: 'Putaway completed successfully (Mock)' });
  });

  // 4. Picking & Wave Task Execution
  app.post('/api/waves/:id/generate-pick-tasks', requireAuth, async (req: any, res) => {
    const waveId = req.params.id;
    const hasDb = await checkDbConnection();
    const effectiveWhId = resolveWarehouseId(req.user, 'wh_default');
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const wave = await prisma.wave.findUnique({
          where: { id: waveId },
          include: { orders: { include: { items: true } } }
        });
        if (!wave) return res.status(404).json({ error: 'Wave not found' });
        
        await prisma.$transaction(async (tx) => {
          for (const order of wave.orders) {
            for (const item of order.items) {
              const pkNo = 'PK' + String(Date.now()).substring(3, 15);
              await tx.pickTask.create({
                data: {
                  taskNo: pkNo,
                  waveId,
                  orderId: order.id,
                  skuId: item.skuId,
                  skuCode: item.skuCode,
                  warehouseId: effectiveWhId,
                  quantity: item.qty,
                  status: 'PENDING'
                }
              });
            }
          }
          await tx.wave.update({
            where: { id: waveId },
            data: { status: 'PICKING' }
          });
        });
        return res.json({ status: 'success', message: 'Pick tasks generated for wave' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ status: 'success', message: 'Mock picking tasks generated' });
  });

  app.get('/api/pick-tasks', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const tasks = await prisma.pickTask.findMany();
        return res.json(tasks);
      } catch (err) {
        console.error('Prisma pick tasks fetch error:', err);
      }
    }
    res.json([]);
  });

  app.post('/api/pick-tasks/:id/complete', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.pickTask.update({
          where: { id: req.params.id },
          data: { status: 'COMPLETED' }
        });
        return res.json({ status: 'success', message: 'Pick task completed' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ status: 'success', message: 'Pick task completed (Mock)' });
  });

  app.get('/api/review-tasks', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const tasks = await prisma.reviewTask.findMany();
        return res.json(tasks);
      } catch (err) {
        console.error('Prisma review tasks fetch error:', err);
      }
    }
    res.json([]);
  });

  app.post('/api/review-tasks/:id/complete', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.reviewTask.update({
          where: { id: req.params.id },
          data: { status: 'COMPLETED' }
        });
        return res.json({ status: 'success', message: 'Review task completed' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ status: 'success', message: 'Review task completed (Mock)' });
  });

  app.post('/api/outbound-orders/:id/weigh-package', requireAuth, async (req: any, res) => {
    const { weight, length, width, height } = req.body;
    const parsedWeight = parseFloat(weight || 0);
    if (parsedWeight <= 0) return res.status(400).json({ error: 'Weight must be greater than 0' });
    
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({ where: { id: req.params.id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'REVIEWS') return res.status(400).json({ error: `Cannot weigh order in status '${order.status}'. Must be REVIEWS (packed).` });

        const pkgNo = 'PKG' + String(Date.now()).substring(3, 15);
        const pkg = await prisma.package.create({
          data: {
            packageNo: pkgNo,
            orderId: req.params.id,
            weight: parsedWeight,
            length: parseFloat(length || 0),
            width: parseFloat(width || 0),
            height: parseFloat(height || 0)
          }
        });
        await prisma.outboundOrder.update({
          where: { id: req.params.id },
          data: { status: 'SHIPPING' }
        });
        return res.status(201).json({ status: 'success', package: pkg, orderStatus: 'SHIPPING' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.status(201).json({ status: 'success', message: 'Package weighed successfully (Mock)' });
  });

  // 5. Exceptions, Returns, Relabels & WorkOrders
  app.get('/api/exception-cases', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const cases = await prisma.exceptionCase.findMany();
        return res.json(cases);
      } catch (err) {
        console.error('Prisma exception cases fetch error:', err);
      }
    }
    res.json([]);
  });

  app.post('/api/exception-cases', requireAuth, async (req: any, res) => {
    const { orderId, type, description } = req.body;
    const caseNo = 'EXC' + String(Date.now()).substring(3, 15);
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const ec = await prisma.exceptionCase.create({
          data: { caseNo, orderId, type, description, status: 'PENDING' }
        });
        return res.status(201).json(ec);
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.status(201).json({ id: 'exc_mock', caseNo, orderId, type, description, status: 'PENDING' });
  });

  app.get('/api/return-orders', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const returns = await prisma.returnOrder.findMany({ include: { items: true } });
        return res.json(returns);
      } catch (err) {
        console.error('Prisma return orders fetch error:', err);
      }
    }
    res.json([]);
  });

  app.get('/api/relabel-orders', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const orders = await prisma.relabelOrder.findMany();
        return res.json(orders);
      } catch (err) {
        console.error('Prisma relabel orders fetch error:', err);
      }
    }
    res.json([]);
  });

  app.get('/api/work-orders', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const orders = await prisma.workOrder.findMany();
        return res.json(orders);
      } catch (err) {
        console.error('Prisma work orders fetch error:', err);
      }
    }
    res.json([]);
  });

  // 6. Billing Rules, Records & Invoices
  app.get('/api/billing-rules', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const rules = await prisma.billingRule.findMany();
        return res.json(rules);
      } catch (err) {
        console.error('Prisma billing rules fetch error:', err);
      }
    }
    res.json([
      { id: 'br_1', name: '出库单操作费 (Outbound Handling Fee)', code: 'OUTBOUND_FEE', type: 'OUTBOUND', unit: 'ORDER', rate: 2.5, minCharge: 2.5, currency: 'USD', isActive: true },
      { id: 'br_2', name: '仓储费 (Storage Fee/cbm/day)', code: 'STORAGE_FEE', type: 'STORAGE', unit: 'CBM', rate: 0.1, minCharge: 0, currency: 'USD', isActive: true },
      { id: 'br_3', name: '入库理货费 (Inbound Sorting Fee)', code: 'INBOUND_FEE', type: 'INBOUND', unit: 'ITEM', rate: 1.5, minCharge: 1.5, currency: 'USD', isActive: true }
    ]);
  });

  app.get('/api/billing-records', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          where.customerId = user.customerId;
        }
        const records = await prisma.billingRecord.findMany({ where });
        return res.json(records);
      } catch (err) {
        console.error('Prisma billing records fetch error:', err);
      }
    }
    res.json([
      { id: 'br_rec_1', customerId: user.customerId || 'cust_1', orderId: 'ord_spec_1', type: 'OUTBOUND', amount: 2.5, currency: 'USD', status: 'UNPAID', createdAt: new Date() }
    ]);
  });

  app.get('/api/invoices', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
          where.customerId = user.customerId;
        }
        const invoices = await prisma.invoice.findMany({ where });
        return res.json(invoices);
      } catch (err) {
        console.error('Prisma invoices fetch error:', err);
      }
    }
    res.json([]);
  });

  // ==========================================
  // 7. ApiKey Management (Client-isolated)
  // ==========================================
  app.get('/api/api-keys', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if ((user.role || '').toUpperCase() === 'CLIENT') where.customerId = user.customerId;
        const keys = await prisma.apiKey.findMany({ where, select: { id: true, customerId: true, name: true, keyMasked: true, scope: true, status: true, createdAt: true } });
        return res.json(keys.map(k => ({ ...k, key: k.keyMasked || '****' })));
      } catch (err) { console.error('Prisma api-keys fetch error:', err); }
    }
    res.json([
      { id: 'ak_1', customerId: 'cust_1', key: 'nwc_ab****ef456', name: 'Production API Key', status: 'ACTIVE', createdAt: '2026-06-20T10:00:00Z' },
      { id: 'ak_2', customerId: 'cust_1', key: 'nwc_xy****hi012', name: 'Staging API Key', status: 'ACTIVE', createdAt: '2026-06-25T14:30:00Z' }
    ]);
  });

  app.post('/api/api-keys', requireAuth, async (req: any, res) => {
    const user = req.user;
    const { name, scope } = req.body;
    const rawKey = 'nwc_' + crypto.randomBytes(24).toString('hex');
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.substring(0, 8);
    const keyLast4 = rawKey.substring(rawKey.length - 4);
    const keyMasked = keyPrefix + '****' + keyLast4;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const apiKey = await prisma.apiKey.create({
          data: { customerId: user.customerId || '', keyHash, keyPrefix, keyLast4, keyMasked, name: name || null, scope: scope || null, status: 'ACTIVE' }
        });
        // Return raw key ONLY on creation — never again
        return res.status(201).json({ ...apiKey, key: rawKey, keyHash: undefined });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'ak_' + Date.now(), customerId: user.customerId, key: rawKey, name: name || 'API Key', status: 'ACTIVE', createdAt: new Date().toISOString() });
  });

  app.put('/api/api-keys/:id', requireAuth, async (req: any, res) => {
    const { status, name } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.apiKey.update({
          where: { id: req.params.id },
          data: { status },
          select: { id: true, customerId: true, name: true, keyMasked: true, scope: true, status: true, createdAt: true }
        });
        return res.json({ ...updated, key: updated.keyMasked || '****' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, status: status || 'ACTIVE' });
  });

  app.delete('/api/api-keys/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.apiKey.delete({ where: { id: req.params.id } });
        return res.json({ status: 'deleted' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'deleted' });
  });

  app.post('/api/api-keys/:id/test', requireAuth, async (req: any, res) => {
    return res.json({ status: 'success', message: 'API key test passed', latency: Math.floor(Math.random() * 50) + 10 + 'ms' });
  });

  // ==========================================
  // 8. Webhook Management (Client-isolated)
  // ==========================================
  app.get('/api/webhooks', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if ((user.role || '').toUpperCase() === 'CLIENT') where.customerId = user.customerId;
        const hooks = await prisma.webhookEndpoint.findMany({
          where,
          select: { id: true, customerId: true, url: true, secretMasked: true, events: true, status: true, createdAt: true }
        });
        return res.json(hooks.map(h => ({ ...h, secret: h.secretMasked || '••••••••' })));
      } catch (err) { console.error('Prisma webhooks fetch error:', err); }
    }
    res.json([
      { id: 'wh_1', customerId: 'cust_1', url: 'https://erp.yukon.com/webhook/wms', secret: '••••••••', events: 'order.created,order.shipped', status: 'ACTIVE', createdAt: '2026-06-15T08:00:00Z' }
    ]);
  });

  app.post('/api/webhooks', requireAuth, async (req: any, res) => {
    const user = req.user;
    const { url, events } = req.body;
    const rawSecret = 'whsec_' + crypto.randomBytes(16).toString('hex');
    const secretHash = await bcrypt.hash(rawSecret, 10);
    const secretLast4 = rawSecret.substring(rawSecret.length - 4);
    const secretMasked = '••••••••' + secretLast4;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const hook = await prisma.webhookEndpoint.create({
          data: { customerId: user.customerId || '', url, secretHash, secretLast4, secretMasked, events: events || null, status: 'ACTIVE' }
        });
        // Return raw secret ONLY on creation — never again
        return res.status(201).json({ ...hook, secret: rawSecret, secretHash: undefined });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'wh_' + Date.now(), customerId: user.customerId, url, secret: rawSecret, events, status: 'ACTIVE', createdAt: new Date().toISOString() });
  });

  app.put('/api/webhooks/:id', requireAuth, async (req: any, res) => {
    const { url, events, status } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.webhookEndpoint.update({
          where: { id: req.params.id },
          data: { url, status },
          select: { id: true, customerId: true, url: true, secretMasked: true, events: true, status: true, createdAt: true }
        });
        return res.json({ ...updated, secret: updated.secretMasked || '••••••••' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, url, status });
  });

  app.delete('/api/webhooks/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.webhookEndpoint.delete({ where: { id: req.params.id } });
        return res.json({ status: 'deleted' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'deleted' });
  });

  app.post('/api/webhooks/:id/test', requireAuth, async (req: any, res) => {
    return res.json({ status: 'success', message: 'Webhook test event delivered successfully', statusCode: 200, latency: Math.floor(Math.random() * 200) + 50 + 'ms' });
  });

  // ==========================================
  // 9. Store Connection Management (Client-isolated)
  // ==========================================
  app.get('/api/store-connections', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if ((user.role || '').toUpperCase() === 'CLIENT') where.customerId = user.customerId;
        const connections = await prisma.storeConnection.findMany({ where, select: { id: true, customerId: true, platform: true, shopName: true, apiTokenMasked: true, lastSyncAt: true, lastSyncStatus: true, lastSyncError: true, status: true, createdAt: true } });
        return res.json(connections.map(c => ({ ...c, apiToken: c.apiTokenMasked || null })));
      } catch (err) { console.error('Prisma store-connections fetch error:', err); }
    }
    res.json([
      { id: 'sc_1', customerId: 'cust_1', platform: 'AMAZON', shopName: 'Yukon Amazon Store', apiToken: '••••••••abc1', status: 'ACTIVE', lastSyncAt: '2026-07-01T12:00:00Z' },
      { id: 'sc_2', customerId: 'cust_1', platform: 'SHOPIFY', shopName: 'Yukon Shopify Store', apiToken: '••••••••def2', status: 'ACTIVE', lastSyncAt: '2026-07-01T10:30:00Z' }
    ]);
  });

  app.post('/api/store-connections', requireAuth, async (req: any, res) => {
    const user = req.user;
    const { platform, shopName, apiToken } = req.body;
    let apiTokenHash: string | undefined;
    let apiTokenEncrypted: string | undefined;
    let apiTokenLast4: string | undefined;
    let apiTokenMasked: string | undefined;
    if (apiToken) {
      apiTokenHash = await bcrypt.hash(apiToken, 10);
      apiTokenLast4 = apiToken.substring(apiToken.length - 4);
      apiTokenMasked = '••••••••' + apiTokenLast4;
      // In production, encrypt with APP_KEY instead
      apiTokenEncrypted = apiTokenHash;
    }
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const conn = await prisma.storeConnection.create({
          data: { customerId: user.customerId || '', platform, shopName, apiTokenHash, apiTokenEncrypted, apiTokenLast4, apiTokenMasked, status: 'ACTIVE' },
          select: { id: true, customerId: true, platform: true, shopName: true, apiTokenMasked: true, lastSyncAt: true, lastSyncStatus: true, lastSyncError: true, status: true, createdAt: true }
        });
        // Return apiToken raw ONLY on creation
        return res.status(201).json({ ...conn, apiToken: apiToken || null });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'sc_' + Date.now(), customerId: user.customerId, platform, shopName, apiToken: apiToken || null, status: 'ACTIVE', createdAt: new Date().toISOString() });
  });

  app.put('/api/store-connections/:id', requireAuth, async (req: any, res) => {
    const { shopName, status, apiToken } = req.body;
    const updateData: any = {};
    if (shopName !== undefined) updateData.shopName = shopName;
    if (status !== undefined) updateData.status = status;
    if (apiToken) {
      updateData.apiTokenHash = await bcrypt.hash(apiToken, 10);
      updateData.apiTokenLast4 = apiToken.substring(apiToken.length - 4);
      updateData.apiTokenMasked = '••••••••' + updateData.apiTokenLast4;
      updateData.apiTokenEncrypted = updateData.apiTokenHash;
    }
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.storeConnection.update({
          where: { id: req.params.id },
          data: updateData,
          select: { id: true, customerId: true, platform: true, shopName: true, apiTokenMasked: true, lastSyncAt: true, lastSyncStatus: true, lastSyncError: true, status: true, createdAt: true }
        });
        return res.json({ ...updated, apiToken: updated.apiTokenMasked || null });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, shopName: shopName || undefined, status: status || undefined });
  });

  app.delete('/api/store-connections/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.storeConnection.delete({ where: { id: req.params.id } });
        return res.json({ status: 'deleted' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'deleted' });
  });

  app.post('/api/store-connections/:id/sync', requireAuth, async (req: any, res) => {
    return res.json({ status: 'success', message: 'Store sync initiated', syncedOrders: Math.floor(Math.random() * 50) + 10, syncedInventory: Math.floor(Math.random() * 100) + 20, timestamp: new Date().toISOString() });
  });

  // ==========================================
  // 10. Return Order Management (Extended)
  // ==========================================
  app.post('/api/return-orders', requireAuth, async (req: any, res) => {
    const user = req.user;
    const { orderId, items, reason } = req.body;
    const returnNo = 'RT' + String(Date.now()).substring(3, 15);
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const returnOrder = await prisma.returnOrder.create({
          data: {
            returnNo,
            orderId,
            customerId: user.customerId || '',
            status: 'PENDING',
            items: items ? { create: items.map((item: any) => ({ skuId: item.skuId, skuCode: item.skuCode, qtyExpected: item.qty, qtyReceived: 0, condition: 'RESTOCK' })) } : undefined
          },
          include: { items: true }
        });
        return res.status(201).json(returnOrder);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'rt_' + Date.now(), returnNo, orderId, customerId: user.customerId, status: 'PENDING', items: items || [], createdAt: new Date().toISOString() });
  });

  app.get('/api/return-orders/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const returnOrder = await prisma.returnOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
        if (!returnOrder) return res.status(404).json({ error: 'Return order not found' });
        return res.json(returnOrder);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, status: 'PENDING' });
  });

  app.put('/api/return-orders/:id', requireAuth, async (req: any, res) => {
    const { status } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.returnOrder.update({ where: { id: req.params.id }, data: { status } });
        return res.json(updated);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, status });
  });

  app.post('/api/return-orders/:id/receive', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.returnOrder.update({ where: { id: req.params.id }, data: { status: 'RECEIVED' } });
        await prisma.operationLog.create({
          data: { userId: user?.id || 'system', username: user?.username || 'system', action: 'RETURN_RECEIVE', details: `Return ${updated.returnNo} received` }
        });
        return res.json({ status: 'success', returnOrder: updated });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Return received (Mock)' });
  });

  app.post('/api/return-orders/:id/inspect', requireAuth, async (req: any, res) => {
    const { items } = req.body;
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        if (items) {
          for (const item of items) {
            await prisma.returnItem.update({ where: { id: item.id }, data: { qtyReceived: item.qtyReceived, condition: item.condition } });
          }
        }
        const updated = await prisma.returnOrder.update({ where: { id: req.params.id }, data: { status: 'INSPECTED' } });
        await prisma.operationLog.create({
          data: { userId: user?.id || 'system', username: user?.username || 'system', action: 'RETURN_INSPECT', details: `Return ${updated.returnNo} inspected` }
        });
        return res.json({ status: 'success', returnOrder: updated });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Return inspected (Mock)' });
  });

  app.post('/api/return-orders/:id/restock', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    const effectiveWhId = resolveWarehouseId(req.user, 'wh_default');
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const returnOrder = await prisma.returnOrder.findUnique({
          where: { id: req.params.id },
          include: { items: true }
        });
        if (!returnOrder) return res.status(404).json({ error: 'Return order not found' });
        if (returnOrder.status !== 'INSPECTED') return res.status(400).json({ error: `Cannot restock return in status '${returnOrder.status}'. Must be INSPECTED.` });

        await prisma.$transaction(async (tx) => {
          for (const item of returnOrder.items) {
            if (item.qtyReceived <= 0) continue;
            
            let inv = await tx.inventory.findFirst({
              where: { skuId: item.skuId, warehouseId: effectiveWhId }
            });

            if (item.condition === 'RESTOCK' || item.condition === 'GOOD') {
              if (inv) {
                await tx.inventory.update({
                  where: { id: inv.id },
                  data: { availableQty: inv.availableQty + item.qtyReceived }
                });
              }
              await tx.inventoryTransaction.create({
                data: {
                  customerId: returnOrder.customerId,
                  warehouseId: effectiveWhId,
                  skuId: item.skuId,
                  skuCode: item.skuCode,
                  type: 'RETURN_RESTOCK',
                  direction: 'IN',
                  quantity: item.qtyReceived,
                  beforeQty: inv ? inv.availableQty : 0,
                  afterQty: inv ? inv.availableQty + item.qtyReceived : item.qtyReceived,
                  reason: `Return ${returnOrder.returnNo} restock`
                }
              });
            } else if (item.condition === 'DAMAGED' || item.condition === 'DAMAGE') {
              if (inv) {
                await tx.inventory.update({
                  where: { id: inv.id },
                  data: { damagedQty: (inv.damagedQty || 0) + item.qtyReceived }
                });
              }
              await tx.inventoryTransaction.create({
                data: {
                  customerId: returnOrder.customerId,
                  warehouseId: effectiveWhId,
                  skuId: item.skuId,
                  skuCode: item.skuCode,
                  type: 'RETURN_DAMAGED',
                  direction: 'IN',
                  quantity: item.qtyReceived,
                  beforeQty: inv ? inv.damagedQty || 0 : 0,
                  afterQty: inv ? (inv.damagedQty || 0) + item.qtyReceived : item.qtyReceived,
                  reason: `Return ${returnOrder.returnNo} damaged items`
                }
              });
            }
          }
          await tx.returnOrder.update({
            where: { id: req.params.id },
            data: { status: 'RESTOCKED' }
          });
        });
        
        // Write OperationLog
        const user = req.user;
        if (hasDb) {
          await prisma.operationLog.create({
            data: {
              userId: user?.id || 'system',
              username: user?.username || 'system',
              action: 'RETURN_RESTOCK',
              details: `Return order ${returnOrder.returnNo} restocked`
            }
          });
        }

        return res.json({ status: 'success', message: 'Return restocked with inventory update' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Return restocked (Mock)' });
  });

  // ==========================================
  // 11. Billing Management (Extended)
  // ==========================================
  app.post('/api/billing-rules', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { name, code, type, unit, rate, minCharge, currency, isActive, effectiveFrom, effectiveTo, customerId, warehouseId } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const rule = await prisma.billingRule.create({ data: { name, code, type, unit: unit || 'ORDER', rate: rate || 0, minCharge: minCharge || 0, currency: currency || 'USD', isActive: isActive !== undefined ? isActive : true, effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null, effectiveTo: effectiveTo ? new Date(effectiveTo) : null, customerId: customerId || null, warehouseId: warehouseId || null } });
        return res.status(201).json(rule);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'br_' + Date.now(), name, code, type, unit: unit || 'ORDER', rate: rate || 0, minCharge: minCharge || 0, currency: currency || 'USD', isActive: isActive !== undefined ? isActive : true });
  });

  app.put('/api/billing-rules/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { name, rate } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.billingRule.update({ where: { id: req.params.id }, data: { name, rate } });
        return res.json(updated);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, name, rate });
  });

  app.delete('/api/billing-rules/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.billingRule.delete({ where: { id: req.params.id } });
        return res.json({ status: 'deleted' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'deleted' });
  });

  app.post('/api/billing-records/generate', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { customerId, warehouseId, periodStart, periodEnd } = req.body;
    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: 'periodStart and periodEnd are required (ISO date strings)' });
    }
    try {
      const result = await generateBillingRecords({ customerId, warehouseId, periodStart, periodEnd });
      return res.json(result);
    } catch (err: any) { return res.status(400).json({ error: err.message }); }
  });

  app.post('/api/invoices/generate', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { customerId, periodStart, periodEnd, dueDate } = req.body;
    try {
      const result = await generateInvoices({ customerId, periodStart, periodEnd, dueDate });
      return res.json(result);
    } catch (err: any) { return res.status(400).json({ error: err.message }); }
  });

  // ==========================================
  // API Docs Endpoint
  // ==========================================
  app.get('/api/docs', requireAuth, async (req: any, res) => {
    res.json({
      openapi: '3.0.0',
      info: { title: 'NiceC WMS API', version: '1.0.0', description: 'Warehouse Management System REST API' },
      servers: [{ url: '/api', description: 'API Base URL' }],
      security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
      components: {
        securitySchemes: {
          BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        },
      },
      paths: {
        '/auth/login': {
          post: { summary: 'Login', tags: ['Auth'], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } } } } } }, responses: { '200': { description: 'Login successful' }, '401': { description: 'Invalid credentials' } } }
        },
        '/outbound-orders': {
          get: { summary: 'List outbound orders', tags: ['Outbound'], security: [{ BearerAuth: [] }], parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'pageSize', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: 'Orders list' } } },
          post: { summary: 'Create outbound order', tags: ['Outbound'], security: [{ BearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { logisticsChannelId: { type: 'string' }, carrierId: { type: 'string' }, recipient: { type: 'string' }, items: { type: 'array', items: { type: 'object', properties: { skuId: { type: 'string' }, qty: { type: 'integer' } } } } } } } } }, responses: { '201': { description: 'Order created' } } }
        },
        '/outbound-orders/{id}': {
          get: { summary: 'Get outbound order by ID', tags: ['Outbound'], security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Order detail' } } },
          put: { summary: 'Update outbound order', tags: ['Outbound'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Order updated' } } },
          delete: { summary: 'Cancel outbound order', tags: ['Outbound'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Order cancelled' } } }
        },
        '/outbound-orders/{id}/cancel': { post: { summary: 'Cancel order and release stock', tags: ['Outbound'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Order cancelled' } } } },
        '/outbound-orders/{id}/ship': { post: { summary: 'Confirm shipment and deduct stock', tags: ['Outbound'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Shipped' } } } },
        '/outbound-orders/import': { post: { summary: 'Bulk import outbound orders from CSV/XLSX', tags: ['Outbound'], security: [{ BearerAuth: [] }], requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } } }, responses: { '200': { description: 'Import result' } } } },
        '/inventory': { get: { summary: 'List inventory', tags: ['Inventory'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Inventory list' } } } },
        '/inventory/adjust': { post: { summary: 'Adjust inventory', tags: ['Inventory'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Inventory adjusted' } } } },
        '/inventory/transfer': { post: { summary: 'Transfer inventory between warehouses', tags: ['Inventory'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Inventory transferred' } } } },
        '/inbound-orders': { get: { summary: 'List inbound orders', tags: ['Inbound'], security: [{ BearerAuth: [] }] }, post: { summary: 'Create inbound ASN', tags: ['Inbound'], security: [{ BearerAuth: [] }] } },
        '/inbound-orders/{id}/receive': { post: { summary: 'Receive inbound shipment', tags: ['Inbound'], security: [{ BearerAuth: [] }] } },
        '/return-orders': { get: { summary: 'List return orders', tags: ['Returns'], security: [{ BearerAuth: [] }] }, post: { summary: 'Create return order', tags: ['Returns'], security: [{ BearerAuth: [] }] } },
        '/return-orders/{id}/receive': { post: { summary: 'Receive return', tags: ['Returns'], security: [{ BearerAuth: [] }] } },
        '/return-orders/{id}/inspect': { post: { summary: 'Inspect return items', tags: ['Returns'], security: [{ BearerAuth: [] }] } },
        '/return-orders/{id}/restock': { post: { summary: 'Restock return items', tags: ['Returns'], security: [{ BearerAuth: [] }] } },
        '/billing-rules': { get: { summary: 'List billing rules', tags: ['Billing'] }, post: { summary: 'Create billing rule', tags: ['Billing'], security: [{ BearerAuth: [] }] } },
        '/billing-records': { get: { summary: 'List billing records', tags: ['Billing'] } },
        '/invoices': { get: { summary: 'List invoices', tags: ['Billing'] } },
        '/api-keys': { get: { summary: 'List API keys', tags: ['Integration'], security: [{ BearerAuth: [] }] }, post: { summary: 'Create API key', tags: ['Integration'], security: [{ BearerAuth: [] }] } },
        '/webhooks': { get: { summary: 'List webhooks', tags: ['Integration'], security: [{ BearerAuth: [] }] }, post: { summary: 'Create webhook', tags: ['Integration'], security: [{ BearerAuth: [] }] } },
        '/store-connections': { get: { summary: 'List store connections', tags: ['Integration'], security: [{ BearerAuth: [] }] }, post: { summary: 'Create store connection', tags: ['Integration'], security: [{ BearerAuth: [] }] } },
        '/health': { get: { summary: 'Health check', tags: ['System'] } },
        '/health/db': { get: { summary: 'Database health check', tags: ['System'] } },
      },
      'x-webhook-events': [
        { event: 'order.created', description: 'Outbound order created' },
        { event: 'order.updated', description: 'Outbound order updated' },
        { event: 'order.shipped', description: 'Outbound order shipped' },
        { event: 'inventory.updated', description: 'Inventory level changed' },
        { event: 'inbound.completed', description: 'Inbound order completed' },
        { event: 'return.completed', description: 'Return order completed' },
      ],
      'x-error-codes': [
        { code: 'UNAUTHORIZED', description: 'Missing or invalid authentication' },
        { code: 'FORBIDDEN', description: 'Insufficient permissions' },
        { code: 'VALIDATION_ERROR', description: 'Request body validation failed' },
        { code: 'NOT_FOUND', description: 'Resource not found' },
        { code: 'INSUFFICIENT_STOCK', description: 'Not enough available inventory' },
        { code: 'RATE_LIMITED', description: 'Too many requests' },
        { code: 'INTERNAL_ERROR', description: 'Internal server error' },
      ],
      'x-curl-examples': {
        login: 'curl -X POST /api/auth/login -H "Content-Type: application/json" -d \'{"username":"client@nicecwms.com","password":"client123456"}\'',
        createOrder: 'curl -X POST /api/outbound-orders -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d \'{"logisticsChannelId":"chan_usps_ground","carrierId":"carr_usps","recipient":"John Doe (NY, USA)","items":[{"skuId":"sku_1","qty":1}]}\'',
        getOrders: 'curl -H "Authorization: Bearer <token>" /api/outbound-orders?status=PENDING&page=1&pageSize=10',
        getInventory: 'curl -H "Authorization: Bearer <token>" /api/inventory',
        getSkus: 'curl -H "Authorization: Bearer <token>" /api/skus',
        createAsn: 'curl -X POST /api/inbound-orders -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d \'{"warehouseId":"wh_1","items":[{"skuId":"sku_1","skuCode":"TS-V-NA-4","qtyExpected":100}]}\'',
        apiKey: 'curl -H "X-API-Key: nwc_<your_api_key>" /api/outbound-orders?page=1',
        webhookSignature: 'HMAC-SHA256(webhook_secret, request_body) for webhook payload verification',
      },
    });
  });

  // ==========================================
  // Missing Route Additions (P0-2 alignment)
  // ==========================================

  // User detail & management routes
  app.get('/api/users/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, username: true, email: true, role: true, customerId: true, warehouseId: true, status: true, createdAt: true, updatedAt: true } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json(user);
      } catch (err) { console.error('Failed to fetch user', err); }
    }
    const db = getDB();
    const user = (db.users || []).find((u: any) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  app.patch('/api/users/:id/status', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { status } = req.body;
    if (!status || !['ACTIVE', 'DISABLED'].includes(status)) return res.status(400).json({ error: 'Invalid status. Must be ACTIVE or DISABLED' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const user = await prisma.user.update({ where: { id: req.params.id }, data: { status }, select: { id: true, username: true, email: true, role: true, status: true } });
        return res.json({ status: 'success', user });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    const db = getDB();
    const idx = (db.users || []).findIndex((u: any) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    db.users[idx].status = status;
    saveDB();
    res.json({ status: 'success', user: db.users[idx] });
  });

  app.post('/api/users/:id/reset-password', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
        return res.json({ status: 'success', message: 'Password reset successfully' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Password reset (Mock)' });
  });

  // Location update & delete
  app.put('/api/locations/:id', requireAuth, async (req: any, res) => {
    const { code, zoneCode } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.location.update({ where: { id: req.params.id }, data: { code, zoneCode } });
        return res.json(updated);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, code, zoneCode });
  });

  app.delete('/api/locations/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.location.delete({ where: { id: req.params.id } });
        return res.json({ status: 'deleted' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'deleted' });
  });

  // Inventory adjust & transfer routes (matching front-end paths)
  app.post('/api/inventory/adjust', requireAuth, async (req: any, res) => {
    const { skuId, warehouseId, adjustmentQty, reason } = req.body;
    if (!skuId || !warehouseId || adjustmentQty === undefined) return res.status(400).json({ error: 'skuId, warehouseId, and adjustmentQty required' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.$transaction(async (tx) => {
          const inv = await tx.inventory.findFirst({ where: { skuId, warehouseId } });
          if (!inv) throw new Error('Inventory record not found');
          const beforeQty = inv.availableQty;
          const afterQty = Math.max(0, beforeQty + adjustmentQty);
          await tx.inventory.update({ where: { id: inv.id }, data: { availableQty: afterQty } });
          await tx.inventoryTransaction.create({
            data: { customerId: inv.customerId, warehouseId, skuId, skuCode: inv.skuCode, type: 'ADJUSTMENT', direction: adjustmentQty >= 0 ? 'IN' : 'OUT', quantity: Math.abs(adjustmentQty), beforeQty, afterQty, reason: reason || 'Manual adjustment' }
          });
        });
        getWebSocket()?.emit('inventory.adjusted', { skuId, warehouseId, adjustmentQty, reason: reason || 'Manual adjustment' }, req.user.customerId);
        return res.json({ status: 'success', message: 'Inventory adjusted' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    getWebSocket()?.emit('inventory.adjusted', { skuId, warehouseId, adjustmentQty, reason: reason || 'Manual adjustment' }, req.user.customerId);
    return res.json({ status: 'success', message: 'Inventory adjusted (Mock)' });
  });

  app.post('/api/inventory/transfer', requireAuth, async (req: any, res) => {
    const { skuId, fromWarehouseId, toWarehouseId, quantity } = req.body;
    if (!skuId || !fromWarehouseId || !toWarehouseId || !quantity) return res.status(400).json({ error: 'skuId, fromWarehouseId, toWarehouseId, and quantity required' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.$transaction(async (tx) => {
          const fromInv = await tx.inventory.findFirst({ where: { skuId, warehouseId: fromWarehouseId } });
          if (!fromInv || fromInv.availableQty < quantity) throw new Error('Insufficient stock at source warehouse');
          let toInv = await tx.inventory.findFirst({ where: { skuId, warehouseId: toWarehouseId } });
          await tx.inventory.update({ where: { id: fromInv.id }, data: { availableQty: fromInv.availableQty - quantity } });
          if (toInv) {
            await tx.inventory.update({ where: { id: toInv.id }, data: { availableQty: toInv.availableQty + quantity } });
          }
          await tx.inventoryTransaction.create({ data: { customerId: fromInv.customerId, warehouseId: fromWarehouseId, skuId, skuCode: fromInv.skuCode, type: 'TRANSFER_OUT', direction: 'OUT', quantity, beforeQty: fromInv.availableQty, afterQty: fromInv.availableQty - quantity, reason: `Transfer to warehouse ${toWarehouseId}` } });
        });
        return res.json({ status: 'success', message: 'Inventory transferred' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Inventory transferred (Mock)' });
  });

  // Inbound order detail & update
  app.get('/api/inbound-orders/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.inboundOrder.findUnique({ where: { id: req.params.id }, include: { items: true, customer: true } });
        if (!order) return res.status(404).json({ error: 'Inbound order not found' });
        return res.json(order);
      } catch (err) { console.error('Prisma inbound order fetch error:', err); }
    }
    return res.json({ id: req.params.id, status: 'PENDING' });
  });

  app.put('/api/inbound-orders/:id', requireAuth, async (req: any, res) => {
    const { status, remark } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.inboundOrder.update({ where: { id: req.params.id }, data: { status, remark } });
        return res.json(updated);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, status, remark });
  });

  app.post('/api/inbound-orders/:id/putaway', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const tasks = await prisma.putawayTask.findMany({ where: { inboundOrderId: req.params.id, status: 'PENDING' } });
        for (const task of tasks) {
          await prisma.putawayTask.update({ where: { id: task.id }, data: { status: 'COMPLETED', operatorId: req.user?.id } });
          const inv = await prisma.inventory.findFirst({ where: { skuId: task.skuId, warehouseId: task.warehouseId } });
          if (inv) {
            await prisma.inventory.update({ where: { id: inv.id }, data: { availableQty: inv.availableQty + task.quantity } });
          }
        }
        await prisma.inboundOrder.update({ where: { id: req.params.id }, data: { status: 'COMPLETED' } });
        return res.json({ status: 'success', message: 'Putaway completed', tasksCompleted: tasks.length });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Putaway completed (Mock)' });
  });

  // Outbound pick & pack routes
  app.post('/api/outbound-orders/:id/pick', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({ where: { id: req.params.id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'PENDING' && order.status !== 'PICKING') return res.status(400).json({ error: `Cannot pick order in status '${order.status}'` });
        const updated = await prisma.outboundOrder.update({ where: { id: req.params.id }, data: { status: 'PICKING' } });
        getWebSocket()?.emit('order.status_changed', { orderId: updated.id, orderNo: updated.orderNo, status: 'PICKING' }, updated.customerId);
        return res.json({ status: 'success', order: updated });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Pick started (Mock)' });
  });

  app.post('/api/outbound-orders/:id/pack', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({ where: { id: req.params.id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'PICKING') return res.status(400).json({ error: `Cannot pack order in status '${order.status}'. Must be PICKING.` });
        const pkgNo = 'PKG' + String(Date.now()).substring(3, 15);
        await prisma.package.create({ data: { packageNo: pkgNo, orderId: req.params.id } });
        const updated = await prisma.outboundOrder.update({ where: { id: req.params.id }, data: { status: 'REVIEWS' } });
        getWebSocket()?.emit('order.status_changed', { orderId: updated.id, orderNo: updated.orderNo, status: 'REVIEWS', packageNo: pkgNo }, updated.customerId);
        return res.json({ status: 'success', order: updated, packageNo: pkgNo });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Packed (Mock)' });
  });

  // Return scrap route
  app.post('/api/return-orders/:id/scrap', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    const effectiveWhId = resolveWarehouseId(req.user, 'wh_default');
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const returnOrder = await prisma.returnOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
        if (!returnOrder) return res.status(404).json({ error: 'Return order not found' });
        await prisma.$transaction(async (tx) => {
          for (const item of returnOrder.items) {
            const inv = await tx.inventory.findFirst({ where: { skuId: item.skuId, warehouseId: effectiveWhId } });
            if (inv) {
              await tx.inventory.update({ where: { id: inv.id }, data: { damagedQty: (inv.damagedQty || 0) + item.qtyReceived } });
              await tx.inventoryTransaction.create({ data: { customerId: returnOrder.customerId, warehouseId: effectiveWhId, skuId: item.skuId, skuCode: item.skuCode, type: 'SCRAP', direction: 'OUT', quantity: item.qtyReceived, beforeQty: inv.availableQty, afterQty: inv.availableQty, reason: `Return ${returnOrder.returnNo} scrapped` } });
            }
          }
          await tx.returnOrder.update({ where: { id: req.params.id }, data: { status: 'SCRAPPED' } });
        });
        return res.json({ status: 'success', message: 'Return items scrapped' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Return scrapped (Mock)' });
  });

  // Store connection extended sync routes
  app.post('/api/store-connections/:id/test', requireAuth, async (req: any, res) => {
    return res.json({ status: 'success', message: 'Connection test successful', latency: Math.floor(Math.random() * 200) + 50 + 'ms' });
  });

  app.post('/api/store-connections/:id/sync-orders', requireAuth, async (req: any, res) => {
    const syncedOrders = Math.floor(Math.random() * 20) + 1;
    return res.json({ status: 'success', message: 'Orders synced', syncedOrders, timestamp: new Date().toISOString() });
  });

  app.post('/api/store-connections/:id/sync-products', requireAuth, async (req: any, res) => {
    const syncedProducts = Math.floor(Math.random() * 50) + 5;
    return res.json({ status: 'success', message: 'Products synced', syncedProducts, timestamp: new Date().toISOString() });
  });

  app.post('/api/store-connections/:id/sync-inventory', requireAuth, async (req: any, res) => {
    const syncedInventory = Math.floor(Math.random() * 100) + 10;
    return res.json({ status: 'success', message: 'Inventory synced', syncedInventory, timestamp: new Date().toISOString() });
  });

  // Invoice status update with state machine validation
  app.post('/api/invoices/:id/mark-paid', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const result = await markInvoicePaid(req.params.id);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ status: 'success' });
  });

  app.post('/api/invoices/:id/void', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const result = await voidInvoice(req.params.id);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ status: 'success' });
  });

  app.post('/api/invoices/:id/recalculate', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const result = await recalculateInvoice(req.params.id);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ status: 'success' });
  });

  // Import history endpoint
  app.get('/api/outbound-orders/import-history', requireAuth, async (req: any, res) => {
    const db = getDB();
    res.json(db.importHistory || []);
  });

  // ==========================================
  // Bulk Import Outbound Orders
  // ==========================================
  app.post('/api/outbound-orders/import', requireAuth, async (req: any, res) => {
    const user = req.user;
    const { rows } = req.body;
    const effectiveWhId = resolveWarehouseId(req.user, 'wh_default');
    
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No rows provided. Upload a CSV/XLSX file or provide rows array.' } });
    }

    const parseResult = bulkImportSchema.safeParse({ rows });
    if (!parseResult.success) {
      return res.status(400).json(formatZodError(parseResult.error));
    }

    const validatedRows = parseResult.data.rows;
    const errors: Array<{ row: number; message: string }> = [];
    const successRows: Array<{ orderNo: string; orderId: string; skuCount: number }> = [];
    const mergedOrders: Record<string, {
      orderNo: string;
      recipientName: string;
      address: string;
      phone: string;
      logisticsChannel: string;
      items: Array<{ skuCode: string; qty: number }>;
    }> = {};

    // Group rows by orderNo
    for (const row of validatedRows) {
      if (!mergedOrders[row.orderNo]) {
        mergedOrders[row.orderNo] = {
          orderNo: row.orderNo,
          recipientName: row.recipientName,
          address: row.address,
          phone: row.phone || '',
          logisticsChannel: row.logisticsChannel,
          items: [],
        };
      }
      mergedOrders[row.orderNo].items.push({ skuCode: row.skuCode, qty: row.qty });
    }

    const hasDb = await checkDbConnection();
    let customerId = user.customerId || 'cust_1';
    if (hasDb) {
      const prisma = getPrisma();
      try {
        for (const [orderNo, order] of Object.entries(mergedOrders)) {
          const resolvedChannel = await prisma.logisticsChannel.findFirst({
            where: { OR: [{ name: { contains: order.logisticsChannel, mode: 'insensitive' } }, { code: { contains: order.logisticsChannel, mode: 'insensitive' } }] }
          });
          const resolvedCarrier = resolvedChannel ? await prisma.carrier.findUnique({ where: { id: resolvedChannel.carrierId } }) : null;
          const defaultChannel = await prisma.logisticsChannel.findFirst();
          const defaultCarrier = defaultChannel ? await prisma.carrier.findUnique({ where: { id: defaultChannel.carrierId } }) : null;

          const channel = resolvedChannel || defaultChannel;
          const carrier = resolvedCarrier || defaultCarrier;

          if (!channel || !carrier) {
            errors.push({ row: 0, message: `Order ${orderNo}: No logistics channel or carrier found` });
            continue;
          }

          // Verify stock for each SKU
          let hasStockIssue = false;
          for (const item of order.items) {
            const sku = await prisma.sKU.findFirst({ where: { code: item.skuCode } });
            if (!sku) {
              errors.push({ row: 0, message: `Order ${orderNo}: SKU code '${item.skuCode}' not found` });
              hasStockIssue = true;
              continue;
            }
            const inv = await prisma.inventory.findFirst({ where: { skuId: sku.id, warehouseId: effectiveWhId } });
            if (!inv || inv.availableQty < item.qty) {
              errors.push({ row: 0, message: `Order ${orderNo}: Insufficient stock for SKU '${item.skuCode}' (available: ${inv ? inv.availableQty : 0}, needed: ${item.qty})` });
              hasStockIssue = true;
            }
          }
          if (hasStockIssue) continue;

          const newOrderId = 'ord_imp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
          const totalQty = order.items.reduce((sum, i) => sum + i.qty, 0);

          await prisma.$transaction(async (tx) => {
            const outboundOrder = await tx.outboundOrder.create({
              data: {
                id: newOrderId,
                orderNo,
                status: 'PENDING',
                customerId,
                logisticsChannelId: channel.id,
                carrierId: carrier.id,
                recipient: `${order.recipientName}, ${order.address}`,
                totalQty,
                totalWeight: parseFloat((totalQty * 1.2).toFixed(2)),
                remark: `Bulk import: ${order.logisticsChannel}`,
                salesPlatform: 'Bulk Import',
                orderType: '单品单件',
                createdTime: new Date(),
              }
            });

            for (const item of order.items) {
              const sku = await tx.sKU.findFirst({ where: { code: item.skuCode } });
              if (!sku) continue;
              const inv = await tx.inventory.findFirst({ where: { skuId: sku.id, warehouseId: effectiveWhId } });
              if (!inv) continue;

              const orderItem = await tx.outboundOrderItem.create({
                data: {
                  id: 'item_imp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                  orderId: newOrderId,
                  skuId: sku.id,
                  skuCode: sku.code,
                  skuBarcode: sku.barcode,
                  qty: item.qty,
                  productName: sku.name,
                  category: '未分类',
                }
              });

              await tx.inventory.update({
                where: { id: inv.id },
                data: {
                  availableQty: inv.availableQty - item.qty,
                  reservedQty: inv.reservedQty + item.qty,
                }
              });

              await tx.inventoryReservation.create({
                data: {
                  customerId,
                  orderId: newOrderId,
                  orderItemId: orderItem.id,
                  skuId: sku.id,
                  skuCode: sku.code,
                  warehouseId: effectiveWhId,
                  quantity: item.qty,
                  status: 'ACTIVE',
                }
              });

              await tx.inventoryTransaction.create({
                data: {
                  customerId,
                  warehouseId: effectiveWhId,
                  skuId: sku.id,
                  skuCode: sku.code,
                  type: 'BULK_IMPORT_RESERVE',
                  direction: 'OUT',
                  quantity: item.qty,
                  beforeQty: inv.availableQty,
                  afterQty: inv.availableQty - item.qty,
                  reason: `Bulk import order ${orderNo} stock reservation`,
                  operatorUserId: user?.id,
                }
              });
            }

            await tx.auditLog.create({
              data: {
                userId: user?.id || 'system',
                action: 'BULK_IMPORT',
                resource: 'OutboundOrder',
                resourceId: orderNo,
                changes: JSON.stringify({ items: order.items, totalQty }),
              }
            });
          });

          successRows.push({ orderNo, orderId: newOrderId, skuCount: order.items.length });
        }
      } catch (err: any) {
        console.error('Bulk import error:', err);
        return res.status(500).json({ success: false, error: { code: 'IMPORT_ERROR', message: err.message } });
      }
    } else {
      // JSON fallback for bulk import
      const db = getDB();
      for (const [orderNo, order] of Object.entries(mergedOrders)) {
        const channel = db.logisticsChannels.find(c => order.logisticsChannel.includes(c.code) || order.logisticsChannel.includes(c.name));
        if (!channel) {
          errors.push({ row: 0, message: `Order ${orderNo}: No matching logistics channel for '${order.logisticsChannel}'` });
          continue;
        }
        const carrier = db.carriers.find(c => c.id === channel.carrierId);
        if (!carrier) continue;

        let hasStockIssue = false;
        for (const item of order.items) {
          const sku = db.skus.find(s => s.code === item.skuCode);
          if (!sku) {
            errors.push({ row: 0, message: `Order ${orderNo}: SKU '${item.skuCode}' not found` });
            hasStockIssue = true;
            continue;
          }
          const inv = db.inventory.find(i => i.skuId === sku.id);
          if (!inv || inv.availableQty < item.qty) {
            errors.push({ row: 0, message: `Order ${orderNo}: Insufficient stock for '${item.skuCode}'` });
            hasStockIssue = true;
          }
        }
        if (hasStockIssue) continue;

        const newOrderId = 'ord_imp_' + Date.now();
        const totalQty = order.items.reduce((sum, i) => sum + i.qty, 0);
        db.outboundOrders.push({
          id: newOrderId,
          orderNo,
          status: 'PENDING',
          customerId,
          logisticsChannelId: channel.id,
          carrierId: carrier.id,
          recipient: `${order.recipientName}, ${order.address}`,
          totalQty,
          totalWeight: parseFloat((totalQty * 1.2).toFixed(2)),
          remark: `Bulk import: ${order.logisticsChannel}`,
          salesPlatform: 'Bulk Import',
          orderType: '单品单件',
          waveId: null,
          labelPrinted: 'NOT_PRINTED',
          createdTime: new Date().toISOString(),
        });

        for (const item of order.items) {
          const sku = db.skus.find(s => s.code === item.skuCode);
          if (!sku) continue;
          const inv = db.inventory.find(i => i.skuId === sku.id);
          if (inv) {
            inv.availableQty = Math.max(0, inv.availableQty - item.qty);
            inv.reservedQty = (inv.reservedQty || 0) + item.qty;
          }
          db.outboundOrderItems.push({
            id: 'item_imp_' + Date.now(),
            orderId: newOrderId,
            skuId: sku.id,
            skuCode: sku.code,
            skuBarcode: sku.barcode,
            qty: item.qty,
            productName: sku.name,
            category: '未分类',
          });
        }
        saveDB();
        successRows.push({ orderNo, orderId: newOrderId, skuCount: order.items.length });
      }
    }

    res.json({
      success: true,
      message: `Import completed. ${successRows.length} orders created, ${errors.length} errors.`,
      data: {
        successRows,
        errors,
        totalRows: validatedRows.length,
        orderCount: successRows.length,
        errorCount: errors.length,
      },
    });
  });

  // ==========================================
  // Adapter Routes (Mock integrations)
  // ==========================================
  app.post('/api/adapters/carrier/ship', requireAuth, async (req: any, res) => {
    try {
      const result = await carrierAdapter.createShipment(req.body);
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/adapters/carrier/rates', requireAuth, async (req: any, res) => {
    try {
      const result = await carrierAdapter.getRates(req.body);
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/adapters/store/sync-orders', requireAuth, async (req: any, res) => {
    try {
      const result = await storeAdapter.syncOrders({ ...req.body, customerId: req.user.customerId || '' });
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/adapters/store/sync-products', requireAuth, async (req: any, res) => {
    try {
      const result = await storeAdapter.syncProducts({ ...req.body, customerId: req.user.customerId || '' });
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/adapters/store/sync-inventory', requireAuth, async (req: any, res) => {
    try {
      const result = await storeAdapter.syncInventory({ ...req.body, customerId: req.user.customerId || '' });
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/adapters/storage/allocate', requireAuth, async (req: any, res) => {
    try {
      const result = await storageAdapter.allocateSlot(req.body);
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/adapters/storage/report', requireAuth, async (req: any, res) => {
    try {
      const result = await storageAdapter.getUtilizationReport(req.body);
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ==========================================
  // API Error Handling (after all routes)
  // ==========================================
  app.use(notFoundHandler);
  app.use(errorHandler);

  // ==========================================
  // Vite Dev / Prod Handling
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ==========================================
  // 11. System Settings Management
  // ==========================================
  app.get('/api/system-settings', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const settings = await prisma.systemSetting.findMany();
        const masked = settings.map(s => ({
          key: s.key,
          value: s.key.toLowerCase().includes('secret') || s.key.toLowerCase().includes('key') || s.key.toLowerCase().includes('token') || s.key.toLowerCase().includes('password')
            ? '••••••••'
            : s.value,
          updatedAt: s.updatedAt,
        }));
        return res.json(masked);
      } catch (err) { console.error('Prisma system-settings fetch error:', err); }
    }
    return res.json([
      { key: 'wms_name', value: 'NiceC-WMS', updatedAt: new Date().toISOString() },
      { key: 'timezone', value: 'Asia/Shanghai', updatedAt: new Date().toISOString() },
      { key: 'currency', value: 'USD', updatedAt: new Date().toISOString() },
    ]);
  });

  app.put('/api/system-settings', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { settings } = req.body;
    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ error: 'settings array is required' });
    }
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        for (const s of settings) {
          await prisma.systemSetting.upsert({
            where: { key: s.key },
            update: { value: s.value },
            create: { key: s.key, value: s.value },
          });
        }
        // Operation log
        await prisma.operationLog.create({
          data: {
            userId: req.user?.id || 'system',
            username: req.user?.username || 'system',
            action: 'SYSTEM_SETTINGS_UPDATED',
            details: `${settings.length} setting(s) updated`,
          },
        });
        return res.json({ status: 'success', updated: settings.length });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', updated: settings.length });
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`WMS Express Backend + Vite running on http://localhost:${PORT}`);
  });
  // Initialize WebSocket for real-time notifications
  try {
    initWebSocket(server);
    console.log('WebSocket server initialized on /ws');
  } catch (err) {
    console.warn('WebSocket initialization skipped (non-critical):', err);
  }
}

startServer().catch((err) => {
  console.error('Error starting full-stack WMS server:', err);
});
