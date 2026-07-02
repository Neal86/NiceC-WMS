import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDB, saveDB } from './server/db';
import { getPrisma, checkDbConnection } from './server/prisma';
import { OutboundOrder, OutboundOrderItem, OrderStatus, Wave, Feedback, FeedbackComment } from './src/types';

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
    }
  } else {
    const db = getDB();
    const inv = db.inventory.find(i => i.skuId === skuId);
    if (inv) {
      inv.availableQty = Math.max(0, inv.availableQty - qty);
      inv.lockedQty = (inv.lockedQty || 0) + qty;
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
        inv.lockedQty = Math.max(0, (inv.lockedQty || 0) - item.qty);
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
        inv.lockedQty = Math.max(0, (inv.lockedQty || 0) - item.qty);
      }
    }
    saveDB();
  }
}

// Define port - always 3000 according to platform rules
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

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
        
        if (dbUser && dbUser.status === 'ACTIVE') {
          // Compare passwords
          const isMatch = bcrypt.compareSync(password, dbUser.password);
          if (isMatch) {
            const token = jwt.sign(
              { 
                id: dbUser.id, 
                username: dbUser.username, 
                email: dbUser.email, 
                role: dbUser.role, 
                customerId: dbUser.customerId 
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
                role: dbUser.role,
                customerId: dbUser.customerId,
                token
              }
            });
          }
        }
      } catch (err) {
        console.error('Prisma auth error:', err);
      }
    }

    // 2. Local Fallback Database
    const db = getDB();
    let localUser = db.users.find(u => u.username === username || u.email === username);
    
    // Add client user on-the-fly to the fallback database if it's not present
    if (username === 'client@nicec.net' && !localUser) {
      localUser = {
        id: 'usr_client',
        username: 'yukon_client',
        email: 'client@nicec.net',
        role: 'CLIENT' as any,
        customerId: 'cust_1',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      } as any;
      db.users.push(localUser);
      saveDB();
    }

    if (localUser) {
      const u = localUser as any;
      const token = jwt.sign(
        { 
          id: u.id, 
          username: u.username, 
          email: u.email, 
          role: u.role, 
          customerId: u.customerId 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({
        status: 'success',
        user: {
          ...localUser,
          token
        }
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: '用户名或密码错误。可用账号: neal@nicec.net、operator 或 client@nicec.net'
    });
  });

  // ==========================================
  // Static Reference APIs
  // ==========================================
  app.get('/api/customers', (req, res) => {
    const db = getDB();
    res.json(db.customers);
  });

  app.get('/api/carriers', (req, res) => {
    const db = getDB();
    res.json(db.carriers);
  });

  app.get('/api/logistics-channels', (req, res) => {
    const db = getDB();
    res.json(db.logisticsChannels);
  });

  app.get('/api/products', (req, res) => {
    const db = getDB();
    // Return mock products based on order items
    const products = db.outboundOrderItems.map(item => ({
      id: item.skuId,
      sku: item.skuCode,
      barcode: item.skuBarcode,
      name: item.productName,
      category: item.category
    }));
    // deduplicate
    const uniqueProducts = Array.from(new Map(products.map(p => [p.id, p])).values());
    res.json(uniqueProducts);
  });

  // ==========================================
  // Outbound Orders API
  // ==========================================
  
  // GET /api/outbound-orders (List with filters, pagination, search)
  app.get('/api/outbound-orders', (req, res) => {
    const db = getDB();
    
    const {
      tab, // OrderStatus
      customerNameCode,
      orderType,
      salesPlatform,
      logisticsChannel,
      carrier,
      productCategory,
      destinationCountry,
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

    let orders = [...db.outboundOrders];

    // Role-based customer data isolation
    const user = getCurrentUser(req);
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      orders = orders.filter(ord => ord.customerId === user.customerId);
    }

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

    // 4. Sorting
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

    // 5. Count tabs for standard counts
    const counts = {
      ALL: db.outboundOrders.length,
      PENDING: db.outboundOrders.filter(o => o.status === 'PENDING').length,
      PICKING: db.outboundOrders.filter(o => o.status === 'PICKING').length,
      REVIEWS: db.outboundOrders.filter(o => o.status === 'REVIEWS').length,
      SHIPPING: db.outboundOrders.filter(o => o.status === 'SHIPPING').length,
      SHIPPED: db.outboundOrders.filter(o => o.status === 'SHIPPED').length,
      EXCEPTIONS: db.outboundOrders.filter(o => o.status === 'EXCEPTIONS').length,
      CANCELLED: db.outboundOrders.filter(o => o.status === 'CANCELLED').length,
    };

    // 6. Pagination
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
  app.get('/api/outbound-orders/:id', (req, res) => {
    const db = getDB();
    const order = db.outboundOrders.find(o => o.id === req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
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

  // POST /api/outbound-orders (Create)
  app.post('/api/outbound-orders', async (req, res) => {
    const db = getDB();
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

    // Role-based customer data isolation
    const user = getCurrentUser(req);
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
    const totalWeight = parseFloat((totalQty * (0.5 + Math.random() * 2)).toFixed(2));

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

    const newItems: OutboundOrderItem[] = items.map((item: any) => ({
      id: 'item_' + Math.random().toString(36).substr(2, 9),
      orderId: newOrderId,
      skuId: item.skuId || 'sku_' + Math.random().toString(36).substr(2, 9),
      skuCode: item.skuCode || 'SKU-MOCK',
      skuBarcode: item.skuBarcode || item.skuCode || 'BARCODE-MOCK',
      qty: item.qty || 1,
      productName: item.productName || 'Mock Product Name',
      category: item.category || '未分类'
    }));

    // Trigger stock reservation for items
    for (const item of newItems) {
      await reserveStock(newOrderId, resolvedCustomerId, item.skuId, item.qty, 'wh_1');
    }

    db.outboundOrders.push(newOrder);
    db.outboundOrderItems.push(...newItems);
    saveDB();

    res.status(201).json({
      status: 'success',
      order: {
        ...newOrder,
        items: newItems
      }
    });
  });

  // PUT /api/outbound-orders/:id (Update)
  app.put('/api/outbound-orders/:id', async (req, res) => {
    const db = getDB();
    const index = db.outboundOrders.findIndex(o => o.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentOrder = db.outboundOrders[index];
    const updateData = req.body;

    // Preserve core values if not supplied
    const updatedOrder: OutboundOrder = {
      ...currentOrder,
      ...updateData,
      id: currentOrder.id, // forbid changing id
      orderNo: currentOrder.orderNo // forbid changing order number
    };

    // If items are updated
    if (updateData.items && Array.isArray(updateData.items)) {
      // Remove old items
      db.outboundOrderItems = db.outboundOrderItems.filter(item => item.orderId !== currentOrder.id);
      
      // Save new items
      const newItems: OutboundOrderItem[] = updateData.items.map((item: any) => ({
        id: item.id || 'item_' + Math.random().toString(36).substr(2, 9),
        orderId: currentOrder.id,
        skuId: item.skuId || 'sku_' + Math.random().toString(36).substr(2, 9),
        skuCode: item.skuCode,
        skuBarcode: item.skuBarcode || item.skuCode,
        qty: item.qty || 1,
        productName: item.productName,
        category: item.category || '未分类'
      }));
      db.outboundOrderItems.push(...newItems);
      
      updatedOrder.totalQty = newItems.reduce((sum, item) => sum + item.qty, 0);
      updatedOrder.totalWeight = parseFloat((updatedOrder.totalQty * 1.2).toFixed(2));
    }

    if (updatedOrder.status === 'SHIPPED' && currentOrder.status !== 'SHIPPED') {
      await deductStock(currentOrder.id);
    }

    db.outboundOrders[index] = updatedOrder;
    saveDB();

    res.json({
      status: 'success',
      order: updatedOrder
    });
  });

  // DELETE /api/outbound-orders/:id
  app.delete('/api/outbound-orders/:id', (req, res) => {
    const db = getDB();
    const orderExists = db.outboundOrders.some(o => o.id === req.params.id);

    if (!orderExists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.outboundOrders = db.outboundOrders.filter(o => o.id !== req.params.id);
    db.outboundOrderItems = db.outboundOrderItems.filter(item => item.orderId !== req.params.id);
    saveDB();

    res.json({ status: 'success', message: 'Order deleted successfully' });
  });

  // POST /api/outbound-orders/batch-generate-wave
  app.post('/api/outbound-orders/batch-generate-wave', (req, res) => {
    const db = getDB();
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'No order IDs provided' });
    }

    // Create a wave
    const waveNo = 'WV' + new Date().toISOString().slice(0,10).replace(/-/g, '') + '000' + (db.waves.length + 1);
    const newWave: Wave = {
      id: 'wave_' + Math.random().toString(36).substr(2, 9),
      waveNo,
      status: 'PENDING',
      orderCount: orderIds.length,
      createdTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    // Update outbound orders to reference this wave and transition to PICKING status
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
      userId: 'usr_1',
      username: 'neal@nicec.net',
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
  app.post('/api/outbound-orders/:id/cancel', async (req, res) => {
    const db = getDB();
    const ord = db.outboundOrders.find(o => o.id === req.params.id);
    if (!ord) return res.status(404).json({ error: 'Order not found' });
    
    if (ord.status === 'SHIPPED') {
      return res.status(400).json({ error: '已出库订单无法取消' });
    }
    
    // Release inventory reservation
    await releaseStock(ord.id);
    
    ord.status = 'CANCELLED';
    
    // Log
    db.operationLogs.push({
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      userId: 'usr_1',
      username: 'neal@nicec.net',
      module: '出库管理',
      action: '取消订单',
      targetId: ord.id,
      detail: `取消订单 ${ord.orderNo}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    
    saveDB();
    res.json({ status: 'success', message: '订单取消成功', order: ord });
  });

  // POST /api/outbound-orders/:id/print-label
  app.post('/api/outbound-orders/:id/print-label', (req, res) => {
    const db = getDB();
    const ord = db.outboundOrders.find(o => o.id === req.params.id);
    if (!ord) return res.status(404).json({ error: 'Order not found' });
    
    ord.labelPrinted = 'PRINTED';
    saveDB();
    res.json({ status: 'success', message: '面单打印状态更新成功', labelUrl: `https://mockpdf.wms.nicec.net/labels/${ord.orderNo}.pdf` });
  });

  // POST /api/outbound-orders/:id/mark-label-printed
  app.post('/api/outbound-orders/:id/mark-label-printed', (req, res) => {
    const db = getDB();
    const ord = db.outboundOrders.find(o => o.id === req.params.id);
    if (!ord) return res.status(404).json({ error: 'Order not found' });
    
    ord.labelPrinted = 'PRINTED';
    saveDB();
    res.json({ status: 'success', order: ord });
  });

  // POST /api/outbound-orders/batch-print-pick-list
  app.post('/api/outbound-orders/batch-print-pick-list', (req, res) => {
    const { orderIds } = req.body;
    res.json({ status: 'success', message: `批量打印发货清单任务成功发送，包含 ${orderIds?.length || 0} 个出库单。` });
  });

  // POST /api/outbound-orders/export
  app.post('/api/outbound-orders/export', (req, res) => {
    res.json({ status: 'success', downloadUrl: 'https://mockpdf.wms.nicec.net/export/orders_export_temp.xlsx' });
  });

  // POST /api/outbound-orders/import
  app.post('/api/outbound-orders/import', (req, res) => {
    res.json({ status: 'success', message: 'Excel数据成功导入！已新增10个出库订单。' });
  });

  // ==========================================
  // Waves API
  // ==========================================
  app.get('/api/waves', (req, res) => {
    const db = getDB();
    res.json(db.waves);
  });

  app.get('/api/waves/:id', (req, res) => {
    const db = getDB();
    const wave = db.waves.find(w => w.id === req.params.id);
    if (!wave) return res.status(404).json({ error: 'Wave not found' });
    const waveOrders = db.outboundOrders.filter(o => o.waveId === wave.id);
    res.json({ ...wave, orders: waveOrders });
  });

  app.post('/api/waves', (req, res) => {
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
    res.json({ status: 'success', wave: newWave });
  });

  app.put('/api/waves/:id', (req, res) => {
    const db = getDB();
    const index = db.waves.findIndex(w => w.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Wave not found' });
    db.waves[index] = { ...db.waves[index], ...req.body };
    saveDB();
    res.json({ status: 'success', wave: db.waves[index] });
  });

  app.delete('/api/waves/:id', (req, res) => {
    const db = getDB();
    db.waves = db.waves.filter(w => w.id !== req.params.id);
    db.outboundOrders = db.outboundOrders.map(o => o.waveId === req.params.id ? { ...o, waveId: null } : o);
    saveDB();
    res.json({ status: 'success', message: '波次关闭/删除成功' });
  });

  // ==========================================
  // Customers API (CRUD)
  // ==========================================
  app.get('/api/customers/:id', (req, res) => {
    const db = getDB();
    const cust = db.customers.find(c => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });
    res.json(cust);
  });

  app.post('/api/customers', (req, res) => {
    const db = getDB();
    const newCust = {
      id: 'cust_' + Math.random().toString(36).substr(2, 9),
      ...req.body
    };
    db.customers.push(newCust);
    saveDB();
    res.json({ status: 'success', customer: newCust });
  });

  app.put('/api/customers/:id', (req, res) => {
    const db = getDB();
    const index = db.customers.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Customer not found' });
    db.customers[index] = { ...db.customers[index], ...req.body };
    saveDB();
    res.json({ status: 'success', customer: db.customers[index] });
  });

  app.delete('/api/customers/:id', (req, res) => {
    const db = getDB();
    db.customers = db.customers.filter(c => c.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'Customer deleted' });
  });

  // ==========================================
  // Products API (CRUD)
  // ==========================================
  app.get('/api/products/:id', (req, res) => {
    const db = getDB();
    const prod = db.products.find(p => p.id === req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    res.json(prod);
  });

  app.post('/api/products', (req, res) => {
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
    res.json({ status: 'success', product: newProd });
  });

  app.put('/api/products/:id', (req, res) => {
    const db = getDB();
    const index = db.products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    db.products[index] = { ...db.products[index], ...req.body };
    saveDB();
    res.json({ status: 'success', product: db.products[index] });
  });

  app.delete('/api/products/:id', (req, res) => {
    const db = getDB();
    db.products = db.products.filter(p => p.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'Product deleted' });
  });

  // ==========================================
  // SKUs API (CRUD)
  // ==========================================
  app.get('/api/skus', (req, res) => {
    const db = getDB();
    let skus = db.skus;
    const user = getCurrentUser(req);
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      skus = skus.filter(s => s.customerId === user.customerId);
    }
    res.json(skus);
  });

  app.get('/api/skus/:id', (req, res) => {
    const db = getDB();
    const sku = db.skus.find(s => s.id === req.params.id);
    if (!sku) return res.status(404).json({ error: 'SKU not found' });
    res.json(sku);
  });

  app.post('/api/skus', (req, res) => {
    const db = getDB();
    const newSku = {
      id: 'sku_' + Math.random().toString(36).substr(2, 9),
      ...req.body
    };
    db.skus.push(newSku);
    saveDB();
    res.json({ status: 'success', sku: newSku });
  });

  app.put('/api/skus/:id', (req, res) => {
    const db = getDB();
    const index = db.skus.findIndex(s => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'SKU not found' });
    db.skus[index] = { ...db.skus[index], ...req.body };
    saveDB();
    res.json({ status: 'success', sku: db.skus[index] });
  });

  app.delete('/api/skus/:id', (req, res) => {
    const db = getDB();
    db.skus = db.skus.filter(s => s.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'SKU deleted' });
  });

  // ==========================================
  // Carriers API (CRUD)
  // ==========================================
  app.post('/api/carriers', (req, res) => {
    const db = getDB();
    const newCarr = {
      id: 'carr_' + Math.random().toString(36).substr(2, 9),
      ...req.body
    };
    db.carriers.push(newCarr);
    saveDB();
    res.json({ status: 'success', carrier: newCarr });
  });

  app.put('/api/carriers/:id', (req, res) => {
    const db = getDB();
    const index = db.carriers.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Carrier not found' });
    db.carriers[index] = { ...db.carriers[index], ...req.body };
    saveDB();
    res.json({ status: 'success', carrier: db.carriers[index] });
  });

  app.delete('/api/carriers/:id', (req, res) => {
    const db = getDB();
    db.carriers = db.carriers.filter(c => c.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'Carrier deleted' });
  });

  // ==========================================
  // Logistics Channels API (CRUD)
  // ==========================================
  app.post('/api/logistics-channels', (req, res) => {
    const db = getDB();
    const newChan = {
      id: 'chan_' + Math.random().toString(36).substr(2, 9),
      ...req.body
    };
    db.logisticsChannels.push(newChan);
    saveDB();
    res.json({ status: 'success', channel: newChan });
  });

  app.put('/api/logistics-channels/:id', (req, res) => {
    const db = getDB();
    const index = db.logisticsChannels.findIndex(l => l.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Channel not found' });
    db.logisticsChannels[index] = { ...db.logisticsChannels[index], ...req.body };
    saveDB();
    res.json({ status: 'success', channel: db.logisticsChannels[index] });
  });

  app.delete('/api/logistics-channels/:id', (req, res) => {
    const db = getDB();
    db.logisticsChannels = db.logisticsChannels.filter(l => l.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'Channel deleted' });
  });

  // ==========================================
  // Warehouses API
  // ==========================================
  app.get('/api/warehouses', (req, res) => {
    const db = getDB();
    res.json(db.warehouses);
  });

  app.post('/api/warehouses', (req, res) => {
    const db = getDB();
    const newWh = {
      id: 'wh_' + Math.random().toString(36).substr(2, 9),
      ...req.body
    };
    db.warehouses.push(newWh);
    saveDB();
    res.json({ status: 'success', warehouse: newWh });
  });

  app.put('/api/warehouses/:id', (req, res) => {
    const db = getDB();
    const index = db.warehouses.findIndex(w => w.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Warehouse not found' });
    db.warehouses[index] = { ...db.warehouses[index], ...req.body };
    saveDB();
    res.json({ status: 'success', warehouse: db.warehouses[index] });
  });

  app.delete('/api/warehouses/:id', (req, res) => {
    const db = getDB();
    db.warehouses = db.warehouses.filter(w => w.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'Warehouse deleted' });
  });

  // ==========================================
  // Inventory API
  // ==========================================
  app.get('/api/inventory', (req, res) => {
    const db = getDB();
    let inventory = db.inventory;
    const user = getCurrentUser(req);
    if (user && (user.role === 'CLIENT' || user.role === 'Client' || user.role === 'customer' || user.role === 'CUSTOMER')) {
      inventory = inventory.filter((inv: any) => inv.customerId === user.customerId);
    }
    res.json(inventory);
  });

  app.put('/api/inventory/:id', (req, res) => {
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
  app.get('/api/operation-logs', (req, res) => {
    const db = getDB();
    res.json(db.operationLogs);
  });

  // ==========================================
  // WMS AI Assistant API
  // ==========================================
  let aiHistory: Array<{ id: string; role: 'user' | 'model'; content: string; createdAt: string }> = [
    {
      id: 'msg_welcome',
      role: 'model',
      content: 'Hello! I am your WMS AI Assistant. I specialize in warehouse operations, orders, inventory, and logistics. How can I help you today?',
      createdAt: new Date().toISOString()
    }
  ];

  app.get('/api/wms-ai-assistant/history', (req, res) => {
    res.json(aiHistory);
  });

  app.delete('/api/wms-ai-assistant/history', (req, res) => {
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

  app.post('/api/wms-ai-assistant/chat', (req, res) => {
    const { question, warehouseId, operationScope, currentPage } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const lowerQ = question.toLowerCase();
    let responseText = '';

    // Precise checks based on the required mock responses in sections V & VII
    if (lowerQ.includes('delayed') || lowerQ.includes('inbound shipments')) {
      responseText = `There are 6 delayed inbound shipments today. 3 are waiting for unloading, 2 are missing ASN details, and 1 has a barcode mismatch issue. The highest priority shipment is ASN-IN-1028 from NiceC because it contains 240 units of HC-001 needed for pending outbound orders.`;
    } else if (lowerQ.includes('waiting for picking') || lowerQ.includes('picking')) {
      responseText = `There are 18 outbound orders waiting for picking. 7 are one-piece dropship orders, 6 are Shopify orders, and 5 are FBA transfer orders. I recommend prioritizing the 5 FBA transfer orders first because their carrier cutoff is 3:30 PM today.`;
    } else if (lowerQ.includes('low in stock') || lowerQ.includes('skus are low')) {
      responseText = `5 SKUs are below safety stock:

1. HC-001 — 18 units available, safety stock 50
2. OC-002 — 12 units available, safety stock 40
3. SC-006 — 24 units available, safety stock 60
4. HS-008 — 9 units available, safety stock 30
5. CT-014 — 15 units available, safety stock 45

I recommend creating a replenishment alert and checking inbound shipment ASN-IN-1028.`;
    } else if (lowerQ.includes('exception status') || lowerQ.includes('exception')) {
      responseText = `There are 11 packages with exception status:

1. 4 barcode mismatch
2. 3 weight mismatch
3. 2 missing label
4. 1 damaged package
5. 1 address validation failed

The most urgent package is PKG-88321 because it belongs to an expedited order scheduled for carrier pickup today.`;
    } else if (lowerQ.includes('prioritize') || lowerQ.includes('tasks should i')) {
      responseText = `Today’s top WMS priorities:

1. Process 6 delayed inbound shipments
2. Pick 18 outbound orders before carrier cutoff
3. Resolve 11 exception packages
4. Reconcile 5 inventory discrepancy records
5. Review 3 failed label generation orders
6. Complete FBA transfer order FBA-TR-2049 before 3:30 PM`;
    } else if (lowerQ.includes('acos') || lowerQ.includes('roas') || lowerQ.includes('listing') || lowerQ.includes('keyword') || lowerQ.includes('竞品') || lowerQ.includes('评论')) {
      responseText = `I apologize, but as a WMS AI Assistant, I only support WMS warehouse operations, inventory, billing, exceptions, and order processing. I do not answer Amazon PPC (ACOS/ROAS), listings optimization, keywords, reviews, or e-commerce marketing questions. Please let me know how I can assist you with warehouse tasks!`;
    } else {
      // General dynamic warehouse response incorporating context
      responseText = `I have received your query regarding warehouse operations. 

Context Info:
- Warehouse: ${warehouseId || 'All Warehouses'}
- Operation Scope: ${operationScope || 'All Operations'}
- Current Location: ${currentPage || 'WMS Portal'}

Based on the current database state, all inventory levels are synced. Let me know if you would like me to compile metrics for today's inbound shipments or highlight pending pick lists.`;
    }

    const userMsg = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      role: 'user' as const,
      content: question,
      createdAt: new Date().toISOString()
    };

    const modelMsg = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      role: 'model' as const,
      content: responseText,
      createdAt: new Date().toISOString()
    };

    aiHistory.push(userMsg, modelMsg);

    res.json({
      status: 'success',
      response: responseText,
      history: aiHistory
    });
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

  // Admin Mirror Routes
  app.get('/api/admin/feedback', (req, res) => {
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

  app.get('/api/admin/feedback/:id', (req, res) => {
    const db = getDB();
    const feedback = db.feedbacks.find(f => f.id === req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    const comments = db.feedbackComments.filter(c => c.feedbackId === feedback.id);
    res.json({ ...feedback, comments });
  });

  app.patch('/api/admin/feedback/:id', (req, res) => {
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

  app.post('/api/admin/feedback/:id/assign', (req, res) => {
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

  app.post('/api/admin/feedback/:id/status', (req, res) => {
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
  app.get('/api/dashboard/summary', (req, res) => {
    const db = getDB();
    const pendingOrders = db.outboundOrders.filter(o => o.status === 'PENDING').length;
    const shippedOrders = db.outboundOrders.filter(o => o.status === 'SHIPPED').length;
    const exceptionOrders = db.outboundOrders.filter(o => o.status === 'EXCEPTIONS').length;
    const totalSKUs = db.skus.length;
    
    res.json({
      pendingOrders: pendingOrders + 3, // dynamic offset
      shippedOrders: shippedOrders + 26146,
      exceptionOrders,
      totalSKUs
    });
  });

  app.get('/api/dashboard/outbound-trend', (req, res) => {
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

  app.get('/api/dashboard/channel-distribution', (req, res) => {
    const db = getDB();
    // Return mock distribution based on channels or mock data
    res.json([
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
    const db = getDB();
    // Return the default user if no token is active
    res.json(db.users[0]);
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ status: 'success', message: 'Logged out successfully' });
  });

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WMS Express Backend + Vite running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting full-stack WMS server:', err);
});
