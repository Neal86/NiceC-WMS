import { Router } from 'express';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB, saveDB } from '../db';
import { getWebSocket } from '../websocket';
import { resolveWarehouseId } from './warehouse';
import { requireAuth, isClientUser, isWarehouseUser, assertCustomerScope, assertWarehouseScope } from '../middleware';

export function registerInboundRoutes(router: Router): void {
  router.get('/inbound-orders', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if (isClientUser(user) && user.customerId) where.customerId = user.customerId;
        if (isWarehouseUser(user) && user.warehouseId) where.warehouseId = user.warehouseId;
        const orders = await prisma.inboundOrder.findMany({
          where, include: { items: true, customer: true }, orderBy: { createdAt: 'desc' }
        });
        return res.json(orders);
      } catch (err) {
        console.error('Prisma inbound orders error:', err);
      }
    }
    res.json([]);
  });

  router.get('/inbound-orders/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.inboundOrder.findUnique({
          where: { id: req.params.id }, include: { items: true, customer: true }
        });
        if (!order) return res.status(404).json({ error: 'Inbound order not found' });
        if (isClientUser(req.user) && req.user.customerId && order.customerId !== req.user.customerId) {
          return res.status(403).json({ error: 'Forbidden. Access denied.' });
        }
        if (isWarehouseUser(req.user) && req.user.warehouseId && order.warehouseId !== req.user.warehouseId) {
          return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
        }
        return res.json(order);
      } catch (err) {
        console.error('Prisma inbound order fetch error:', err);
      }
    }
    return res.json({ id: req.params.id, status: 'PENDING' });
  });

  router.post('/inbound-orders', requireAuth, async (req: any, res) => {
    const { items = [], warehouseId: bodyWhId, remark = '-' } = req.body;
    const warehouseId = req.user.warehouseId || bodyWhId;
    const customerId = req.user.customerId || req.body.customerId;
    if (!customerId) return res.status(400).json({ error: 'customerId is required' });
    if (!warehouseId) return res.status(400).json({ error: 'warehouseId is required' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items are required' });
    if (!assertCustomerScope(req.user, customerId)) return res.status(403).json({ error: 'Forbidden. Customer access denied.' });
    if (!assertWarehouseScope(req.user, warehouseId)) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
    const orderNo = 'ASN' + String(Date.now()).substring(3, 15);
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const newOrder = await prisma.inboundOrder.create({
          data: {
            orderNo, customerId, warehouseId, remark, status: 'PENDING',
            items: { create: items.map((i: any) => ({ skuId: i.skuId, skuCode: i.skuCode, qtyExpected: i.qtyExpected || 10, qtyReceived: 0 })) }
          },
          include: { items: true }
        });
        return res.status(201).json(newOrder);
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.status(201).json({ id: 'in_' + Date.now(), orderNo, customerId, warehouseId, remark, status: 'PENDING' });
  });

  router.put('/inbound-orders/:id', requireAuth, async (req: any, res) => {
    const { status, remark } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.inboundOrder.findUnique({ where: { id: req.params.id } });
        if (!order) return res.status(404).json({ error: 'Inbound order not found' });
        if (isClientUser(req.user) && req.user.customerId && order.customerId !== req.user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        if (isWarehouseUser(req.user) && req.user.warehouseId && order.warehouseId !== req.user.warehouseId) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
        const updated = await prisma.inboundOrder.update({ where: { id: req.params.id }, data: { status, remark } });
        return res.json(updated);
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ id: req.params.id, status, remark });
  });

  router.delete('/inbound-orders/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.inboundOrder.findUnique({ where: { id: req.params.id } });
        if (!order) return res.status(404).json({ error: 'Inbound order not found' });
        if (isClientUser(req.user) && req.user.customerId && order.customerId !== req.user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        if (isWarehouseUser(req.user) && req.user.warehouseId && order.warehouseId !== req.user.warehouseId) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
        await prisma.inboundOrder.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
        return res.json({ status: 'success', message: 'Inbound order cancelled' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ status: 'success', message: 'Inbound order cancelled (Mock)' });
  });

  router.post('/inbound-orders/:id/receive', requireAuth, async (req: any, res) => {
    const receivedItems = req.body.receivedItems || req.body.items || [];
    if (!Array.isArray(receivedItems) || receivedItems.length === 0) return res.status(400).json({ error: 'receivedItems must be a non-empty array' });
    for (const item of receivedItems) {
      if (item.qtyReceived !== undefined && (!Number.isFinite(Number(item.qtyReceived)) || Number(item.qtyReceived) <= 0)) {
        return res.status(400).json({ error: `Invalid qtyReceived for item ${item.skuId || item.skuCode}` });
      }
    }
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.inboundOrder.findUnique({
          where: { id: req.params.id }, include: { items: true }
        });
        if (!order) return res.status(404).json({ error: 'Inbound order not found' });
        if (isClientUser(req.user) && req.user.customerId && order.customerId !== req.user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        if (isWarehouseUser(req.user) && req.user.warehouseId && order.warehouseId !== req.user.warehouseId) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
        if (order.status === 'CANCELLED' || order.status === 'COMPLETED') return res.status(400).json({ error: 'Inbound order is already cancelled or completed' });

        await prisma.$transaction(async (tx) => {
          for (const item of receivedItems) {
            const orderItem = order.items.find(i => i.skuId === item.skuId);
            if (orderItem) {
              await tx.inboundOrderItem.update({
                where: { id: orderItem.id },
                data: { qtyReceived: (orderItem.qtyReceived || 0) + item.qtyReceived }
              });

              let inv = await tx.inventory.findFirst({
                where: { skuId: item.skuId, warehouseId: order.warehouseId }
              });
              const beforeOnHand = inv ? (inv.onHand || 0) : 0;
              if (inv) {
                inv = await tx.inventory.update({
                  where: { id: inv.id },
                  data: { onHand: beforeOnHand + item.qtyReceived }
                });
              } else {
                inv = await tx.inventory.create({
                  data: {
                    customerId: order.customerId,
                    warehouseId: order.warehouseId,
                    skuId: item.skuId,
                    skuCode: orderItem.skuCode,
                    onHand: item.qtyReceived,
                    availableQty: 0,
                    reservedQty: 0,
                    damagedQty: 0
                  }
                });
              }
              await tx.inventoryTransaction.create({
                data: {
                  customerId: order.customerId, warehouseId: order.warehouseId,
                  skuId: item.skuId, skuCode: orderItem.skuCode,
                  type: 'INBOUND_RECEIVED', direction: 'IN',
                  quantity: item.qtyReceived,
                  beforeQty: beforeOnHand,
                  afterQty: beforeOnHand + item.qtyReceived,
                  reason: `ASN ${order.orderNo} Received`
                }
              });

              const paNo = 'PA' + String(Date.now()).substring(3, 15) + '_' + Math.random().toString(36).slice(2, 6);
              await tx.putawayTask.create({
                data: {
                  taskNo: paNo, inboundOrderId: order.id, skuId: item.skuId,
                  skuCode: orderItem.skuCode, warehouseId: order.warehouseId,
                  quantity: item.qtyReceived, status: 'PENDING'
                }
              });
            }
          }
          await tx.inboundOrder.update({
            where: { id: order.id }, data: { status: 'RECEIVED' }
          });
          await tx.operationLog.create({
            data: {
              userId: req.user?.id || 'system', username: req.user?.username || 'system',
              action: 'INBOUND_RECEIVE', details: `ASN ${order.orderNo} received`
            }
          });
        });
        getWebSocket()?.emit('inbound.received', { orderId: order.id, orderNo: order.orderNo }, order.customerId);
        return res.json({ status: 'success', message: 'Inbound shipment received and inventory updated' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ status: 'success', message: 'Mock inbounding completed' });
  });

  router.post('/inbound-orders/:id/putaway', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.inboundOrder.findUnique({ where: { id: req.params.id } });
        if (!order) return res.status(404).json({ error: 'Inbound order not found' });
        if (isClientUser(req.user) && req.user.customerId && order.customerId !== req.user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        if (isWarehouseUser(req.user) && req.user.warehouseId && order.warehouseId !== req.user.warehouseId) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
        if (order.status === 'CANCELLED') return res.status(400).json({ error: 'Inbound order is cancelled' });
        const result = await prisma.$transaction(async (tx) => {
          const tasks = await tx.putawayTask.findMany({ where: { inboundOrderId: req.params.id, status: 'PENDING' } });
          for (const task of tasks) {
            await tx.putawayTask.update({ where: { id: task.id }, data: { status: 'COMPLETED', operatorId: req.user?.id } });
            const inv = await tx.inventory.findFirst({ where: { skuId: task.skuId, warehouseId: task.warehouseId } });
            if (inv) {
              await tx.inventory.update({
                where: { id: inv.id },
                data: { availableQty: inv.availableQty + task.quantity }
              });
            }
          }
          await tx.inboundOrder.update({ where: { id: req.params.id }, data: { status: 'COMPLETED' } });
          return tasks.length;
        });
        return res.json({ status: 'success', message: 'Putaway completed', tasksCompleted: result });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ status: 'success', message: 'Putaway completed (Mock)' });
  });
}
