import { Router } from 'express';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB, saveDB } from '../db';
import { getWebSocket } from '../websocket';
import { resolveWarehouseId } from './warehouse';
import { requireAuth, requireRole, isClientUser, isWarehouseUser, assertCustomerScope, assertWarehouseScope } from '../middleware';

export function registerWarehouseOperationsRoutes(router: Router): void {
  router.get('/putaway-tasks', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if (isWarehouseUser(user) && user.warehouseId) where.warehouseId = user.warehouseId;
        if (isClientUser(user)) return res.json([]);
        const tasks = await prisma.putawayTask.findMany({ where, orderBy: { createdAt: 'desc' } });
        return res.json(tasks);
      } catch (err) { console.error('Prisma putaway-tasks error:', err); }
    }
    res.json([]);
  });

  router.post('/putaway-tasks/:id/complete', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const task = await prisma.putawayTask.findUnique({ where: { id: req.params.id } });
        if (!task) return res.status(404).json({ error: 'Putaway task not found' });
        if (!assertWarehouseScope(user, task.warehouseId)) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
        if (task.status === 'COMPLETED') return res.status(400).json({ error: 'Putaway task already completed' });
        await prisma.$transaction(async (tx) => {
          await tx.putawayTask.update({ where: { id: req.params.id }, data: { status: 'COMPLETED', operatorId: req.user?.id } });
          const inv = await tx.inventory.findFirst({ where: { skuId: task.skuId, warehouseId: task.warehouseId } });
          if (inv) {
            await tx.inventory.update({ where: { id: inv.id }, data: { availableQty: inv.availableQty + task.quantity } });
          }
        });
        return res.json({ status: 'success', message: 'Putaway task completed' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Putaway completed (Mock)' });
  });

  router.get('/pick-tasks', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
          if (isWarehouseUser(user) && user.warehouseId) where.warehouseId = user.warehouseId;
          if (isClientUser(user)) return res.json([]);
          const tasks = await prisma.pickTask.findMany({ where, orderBy: { createdAt: 'desc' } });
        return res.json(tasks);
      } catch (err) { console.error('Prisma pick-tasks error:', err); }
    }
    res.json([]);
  });

  router.post('/pick-tasks/:id/complete', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const task = await prisma.pickTask.findUnique({ where: { id: req.params.id } });
        if (!task) return res.status(404).json({ error: 'Pick task not found' });
        await prisma.pickTask.update({ where: { id: req.params.id }, data: { status: 'COMPLETED', operatorId: req.user?.id } });
        return res.json({ status: 'success', message: 'Pick task completed' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Pick completed (Mock)' });
  });

  router.get('/review-tasks', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
          if (isWarehouseUser(user) && user.warehouseId) where.warehouseId = user.warehouseId;
          if (isClientUser(user)) return res.json([]);
          const tasks = await prisma.reviewTask.findMany({ where, orderBy: { createdAt: 'desc' } });
        return res.json(tasks);
      } catch (err) { console.error('Prisma review-tasks error:', err); }
    }
    res.json([]);
  });

  router.post('/review-tasks/:id/complete', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const task = await prisma.reviewTask.findUnique({ where: { id: req.params.id } });
        if (!task) return res.status(404).json({ error: 'Review task not found' });
        await prisma.reviewTask.update({ where: { id: req.params.id }, data: { status: 'COMPLETED', operatorId: req.user?.id } });
        return res.json({ status: 'success', message: 'Review task completed' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Review completed (Mock)' });
  });

  router.get('/exception-cases', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const ecWhere: any = {};
          if (isClientUser(user) && user.customerId) ecWhere.customerId = user.customerId;
          if (isWarehouseUser(user) && user.warehouseId) ecWhere.warehouseId = user.warehouseId;
          const cases = await prisma.exceptionCase.findMany({ where: ecWhere, orderBy: { createdAt: 'desc' } });
        return res.json(cases);
      } catch (err) { console.error('Prisma exception-cases error:', err); }
    }
    res.json([]);
  });

  router.post('/exception-cases', requireAuth, async (req: any, res) => {
    const { orderId, type, description } = req.body;
    const caseNo = 'EXC' + String(Date.now()).substring(3, 15);
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const ec = await prisma.exceptionCase.create({ data: { caseNo, orderId, type, description, status: 'PENDING' } });
        return res.status(201).json(ec);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'exc_mock', caseNo, orderId, type, description, status: 'PENDING' });
  });

  router.get('/return-orders', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const retWhere: any = {};
          if (isClientUser(user) && user.customerId) retWhere.customerId = user.customerId;
          if (isWarehouseUser(user) && user.warehouseId) retWhere.warehouseId = user.warehouseId;
          const returns = await prisma.returnOrder.findMany({ where: retWhere, include: { items: true }, orderBy: { createdAt: 'desc' } });
        return res.json(returns);
      } catch (err) { console.error('Prisma return orders fetch error:', err); }
    }
    res.json([]);
  });

  router.get('/return-orders/:id', requireAuth, async (req: any, res) => {
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

  router.post('/return-orders', requireAuth, async (req: any, res) => {
    const user = req.user;
    const { orderId, items, reason } = req.body;
    const returnNo = 'RT' + String(Date.now()).substring(3, 15);
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const returnOrder = await prisma.returnOrder.create({
          data: {
            returnNo, orderId, customerId: user.customerId || '', status: 'PENDING',
            items: items ? { create: items.map((item: any) => ({ skuId: item.skuId, skuCode: item.skuCode, qtyExpected: item.qty, qtyReceived: 0, condition: 'RESTOCK' })) } : undefined
          },
          include: { items: true }
        });
        return res.status(201).json(returnOrder);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'rt_' + Date.now(), returnNo, orderId, customerId: user.customerId, status: 'PENDING', items: items || [], createdAt: new Date().toISOString() });
  });

  router.put('/return-orders/:id', requireAuth, async (req: any, res) => {
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

  router.post('/return-orders/:id/receive', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.returnOrder.update({ where: { id: req.params.id }, data: { status: 'RECEIVED' } });
        await prisma.operationLog.create({ data: { userId: user?.id || 'system', username: user?.username || 'system', action: 'RETURN_RECEIVE', details: `Return ${updated.returnNo} received` } });
        return res.json({ status: 'success', returnOrder: updated });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Return received (Mock)' });
  });

  router.post('/return-orders/:id/inspect', requireAuth, async (req: any, res) => {
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
        await prisma.operationLog.create({ data: { userId: user?.id || 'system', username: user?.username || 'system', action: 'RETURN_INSPECT', details: `Return ${updated.returnNo} inspected` } });
        return res.json({ status: 'success', returnOrder: updated });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Return inspected (Mock)' });
  });

  router.post('/return-orders/:id/restock', requireAuth, async (req: any, res) => {
    const user = req.user;
    const effectiveWhId = resolveWarehouseId(req.user, 'wh_default');
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const returnOrder = await prisma.returnOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
        if (!returnOrder) return res.status(404).json({ error: 'Return order not found' });
        if (isClientUser(user) && user.customerId && returnOrder.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        if (isWarehouseUser(user) && user.warehouseId && (returnOrder as any).warehouseId !== user.warehouseId) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
        if (returnOrder.status !== 'INSPECTED') return res.status(400).json({ error: `Cannot restock return in status '${returnOrder.status}'. Must be INSPECTED.` });

        await prisma.$transaction(async (tx) => {
          for (const item of returnOrder.items) {
            if (item.qtyReceived <= 0) continue;
            let inv = await tx.inventory.findFirst({ where: { skuId: item.skuId, warehouseId: effectiveWhId } });

            if (item.condition === 'RESTOCK' || item.condition === 'GOOD') {
              if (inv) {
                await tx.inventory.update({ where: { id: inv.id }, data: { availableQty: inv.availableQty + item.qtyReceived, onHand: (inv.onHand || 0) + item.qtyReceived } });
              } else {
                inv = await tx.inventory.create({ data: { customerId: returnOrder.customerId, skuId: item.skuId, skuCode: item.skuCode, warehouseId: effectiveWhId, onHand: item.qtyReceived, availableQty: item.qtyReceived, reservedQty: 0, damagedQty: 0 } });
              }
              await tx.inventoryTransaction.create({ data: { customerId: returnOrder.customerId, warehouseId: effectiveWhId, skuId: item.skuId, skuCode: item.skuCode, type: 'RETURN_RESTOCK', direction: 'IN', quantity: item.qtyReceived, beforeQty: inv ? inv.availableQty : 0, afterQty: inv ? inv.availableQty + item.qtyReceived : item.qtyReceived, reason: `Return ${returnOrder.returnNo} restock` } });
            } else if (item.condition === 'DAMAGED' || item.condition === 'DAMAGE') {
              if (inv) {
                await tx.inventory.update({ where: { id: inv.id }, data: { damagedQty: (inv.damagedQty || 0) + item.qtyReceived, onHand: (inv.onHand || 0) + item.qtyReceived } });
              } else {
                inv = await tx.inventory.create({ data: { customerId: returnOrder.customerId, skuId: item.skuId, skuCode: item.skuCode, warehouseId: effectiveWhId, onHand: item.qtyReceived, availableQty: 0, reservedQty: 0, damagedQty: item.qtyReceived } });
              }
              await tx.inventoryTransaction.create({ data: { customerId: returnOrder.customerId, warehouseId: effectiveWhId, skuId: item.skuId, skuCode: item.skuCode, type: 'RETURN_DAMAGED', direction: 'IN', quantity: item.qtyReceived, beforeQty: inv ? inv.damagedQty || 0 : 0, afterQty: inv ? (inv.damagedQty || 0) + item.qtyReceived : item.qtyReceived, reason: `Return ${returnOrder.returnNo} damaged items` } });
            }
          }
          await tx.returnOrder.update({ where: { id: req.params.id }, data: { status: 'RESTOCKED' } });
        });

        await prisma.operationLog.create({ data: { userId: user?.id || 'system', username: user?.username || 'system', action: 'RETURN_RESTOCK', details: `Return order ${returnOrder.returnNo} restocked` } });

        return res.json({ status: 'success', message: 'Return restocked with inventory update' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Return restocked (Mock)' });
  });

  router.post('/return-orders/:id/scrap', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    const effectiveWhId = resolveWarehouseId(req.user, 'wh_default');
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const returnOrder = await prisma.returnOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
        if (!returnOrder) return res.status(404).json({ error: 'Return order not found' });
        if (isClientUser(user)) return res.status(403).json({ error: 'Forbidden. Client cannot scrap.' });
        if (isClientUser(user) && user.customerId && returnOrder.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        if (isWarehouseUser(user) && user.warehouseId && (returnOrder as any).warehouseId !== user.warehouseId) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
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

  router.get('/relabel-orders', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const rlWhere: any = {};
          if (isClientUser(user) && user.customerId) rlWhere.customerId = user.customerId;
          if (isWarehouseUser(user) && user.warehouseId) rlWhere.warehouseId = user.warehouseId;
          const orders = await prisma.relabelOrder.findMany({ where: rlWhere, orderBy: { createdAt: 'desc' } });
        return res.json(orders);
      } catch (err) { console.error('Prisma relabel orders fetch error:', err); }
    }
    res.json([]);
  });

  router.get('/work-orders', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const woWhere: any = {};
          if (isClientUser(user) && user.customerId) woWhere.customerId = user.customerId;
          if (isWarehouseUser(user) && user.warehouseId) woWhere.warehouseId = user.warehouseId;
          const orders = await prisma.workOrder.findMany({ where: woWhere, orderBy: { createdAt: 'desc' } });
        return res.json(orders);
      } catch (err) { console.error('Prisma work orders fetch error:', err); }
    }
    res.json([]);
  });

  router.get('/locations', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const locWhere: any = {};
          if (isClientUser(user)) return res.json([]);
          if (isWarehouseUser(user) && user.warehouseId) locWhere.warehouseId = user.warehouseId;
          const locations = await prisma.location.findMany({ where: locWhere, orderBy: { code: 'asc' } });
        return res.json(locations);
      } catch (err) { console.error('Prisma locations error:', err); }
    }
    res.json([]);
  });

  router.post('/locations', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN', 'WAREHOUSE', 'WAREHOUSE_MANAGER', 'WAREHOUSE_OPERATOR'), async (req: any, res) => {
    const user = req.user;
    const { code, zoneCode, warehouseId } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        if (isClientUser(user)) return res.status(403).json({ error: 'Forbidden.' });
          const locWhId = isWarehouseUser(user) && user.warehouseId ? user.warehouseId : warehouseId;
          if (isWarehouseUser(user) && !assertWarehouseScope(user, warehouseId)) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
          const location = await prisma.location.create({ data: { code, zoneCode, warehouseId: locWhId } });
        return res.status(201).json(location);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'loc_' + Date.now(), code, zoneCode, warehouseId });
  });

  router.put('/locations/:id', requireAuth, async (req: any, res) => {
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

  router.delete('/locations/:id', requireAuth, async (req: any, res) => {
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

  router.get('/waves', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        if (isClientUser(user)) return res.json([]);
          const waves = await prisma.wave.findMany({ orderBy: { createdTime: 'desc' } });
        return res.json(waves);
      } catch (err) { console.error('Prisma waves error:', err); }
    }
    res.json([]);
  });

  router.get('/waves/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const wave = await prisma.wave.findUnique({ where: { id: req.params.id } });
        if (!wave) return res.status(404).json({ error: 'Wave not found' });
        return res.json(wave);
      } catch (err) { console.error('Prisma wave error:', err); }
    }
    return res.json({ id: req.params.id });
  });

  router.post('/waves', requireAuth, async (req: any, res) => {
    const waveNo = 'WV' + String(Date.now()).substring(3, 15);
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const wave = await prisma.wave.create({ data: { waveNo, status: 'PENDING' } });
        return res.status(201).json(wave);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'wv_' + Date.now(), waveNo, status: 'PENDING' });
  });

  router.put('/waves/:id', requireAuth, async (req: any, res) => {
    const { status } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.wave.update({ where: { id: req.params.id }, data: { status } });
        return res.json(updated);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, status });
  });

  router.delete('/waves/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.wave.delete({ where: { id: req.params.id } });
        return res.json({ status: 'deleted' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'deleted' });
  });

  router.post('/waves/:id/generate-pick-tasks', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const orders = await prisma.outboundOrder.findMany({ where: { waveId: req.params.id, status: 'PENDING' }, include: { items: true } });
        const effectiveWhId = resolveWarehouseId(req.user, 'wh_default');
        let tasksCreated = 0;
        for (const order of orders) {
          for (const item of order.items) {
            const ptNo = 'PT' + String(Date.now()).substring(3, 15) + tasksCreated;
            await prisma.pickTask.create({ data: { taskNo: ptNo, orderId: order.id, skuId: item.skuId, skuCode: item.skuCode, warehouseId: effectiveWhId, quantity: item.qty, status: 'PENDING' } });
            tasksCreated++;
          }
        }
        return res.json({ status: 'success', tasksCreated });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', tasksCreated: 0 });
  });
}
