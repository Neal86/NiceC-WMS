import { Router } from 'express';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB, saveDB } from '../db';
import { getWebSocket } from '../websocket';
import { resolveWarehouseId } from './warehouse';
import { requireAuth } from '../middleware';

export function registerInboundRoutes(router: Router): void {
  router.get('/inbound-orders', requireAuth, async (req: any, res) => {
    const user = req.user;
    const isClient = (user.role || '').toUpperCase() === 'CLIENT';
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where = isClient && user.customerId ? { customerId: user.customerId } : {};
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
        return res.json(order);
      } catch (err) {
        console.error('Prisma inbound order fetch error:', err);
      }
    }
    return res.json({ id: req.params.id, status: 'PENDING' });
  });

  router.post('/inbound-orders', requireAuth, async (req: any, res) => {
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
        await prisma.inboundOrder.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
        return res.json({ status: 'success', message: 'Inbound order cancelled' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ status: 'success', message: 'Inbound order cancelled (Mock)' });
  });

  router.post('/inbound-orders/:id/receive', requireAuth, async (req: any, res) => {
    const { receivedItems = [] } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.inboundOrder.findUnique({
          where: { id: req.params.id }, include: { items: true }
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

              let inv = await tx.inventory.findFirst({
                where: { skuId: item.skuId, warehouseId: order.warehouseId }
              });
              if (inv) {
                await tx.inventory.update({
                  where: { id: inv.id },
                  data: { availableQty: inv.availableQty + item.qtyReceived }
                });
              }
              await tx.inventoryTransaction.create({
                data: {
                  customerId: order.customerId, warehouseId: order.warehouseId,
                  skuId: item.skuId, skuCode: orderItem.skuCode,
                  type: 'INBOUND_RECEIVED', direction: 'IN',
                  quantity: item.qtyReceived, beforeQty: inv ? inv.availableQty : 0,
                  afterQty: inv ? inv.availableQty + item.qtyReceived : item.qtyReceived,
                  reason: `ASN ${order.orderNo} Received`
                }
              });

              const paNo = 'PA' + String(Date.now()).substring(3, 15);
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
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ status: 'success', message: 'Putaway completed (Mock)' });
  });
}
