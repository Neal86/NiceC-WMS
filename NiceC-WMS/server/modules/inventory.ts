import { Router } from 'express';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB, saveDB } from '../db';
import { getWebSocket } from '../websocket';
import { requireAuth } from '../middleware';
import { inventoryAdjustSchema, inventoryTransferSchema } from '../validation';

export function registerInventoryRoutes(router: Router): void {
  router.get('/inventory', requireAuth, async (req: any, res) => {
    const user = req.user;
    const isClient = (user.role || '').toUpperCase() === 'CLIENT';
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where = isClient && user.customerId ? { customerId: user.customerId } : {};
        const inventory = await prisma.inventory.findMany({ where });
        return res.json(inventory);
      } catch (err) {
        console.error('Prisma inventory list error:', err);
      }
    }
    const db = getDB();
    let inventory = db.inventory;
    if (isClient && user.customerId) {
      inventory = inventory.filter((inv: any) => inv.customerId === user.customerId);
    }
    res.json(inventory);
  });

  router.get('/inventory/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const inv = await prisma.inventory.findUnique({ where: { id: req.params.id }, include: { customer: true } });
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

  router.put('/inventory/:id', requireAuth, async (req: any, res) => {
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
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const index = db.inventory.findIndex(i => i.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Inventory not found' });
    db.inventory[index] = { ...db.inventory[index], ...req.body };
    saveDB();
    res.json({ status: 'success', inventory: db.inventory[index] });
  });

  router.post('/inventory/adjust', requireAuth, async (req: any, res) => {
    const { skuId, warehouseId, adjustmentQty, reason } = req.body;
    if (!skuId || !warehouseId || adjustmentQty === undefined) {
      return res.status(400).json({ error: 'skuId, warehouseId, and adjustmentQty required' });
    }
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
            data: {
              customerId: inv.customerId, warehouseId, skuId, skuCode: inv.skuCode,
              type: 'ADJUSTMENT', direction: adjustmentQty >= 0 ? 'IN' : 'OUT',
              quantity: Math.abs(adjustmentQty), beforeQty, afterQty, reason: reason || 'Manual adjustment'
            }
          });
        });
        getWebSocket()?.emit('inventory.adjusted', { skuId, warehouseId, adjustmentQty, reason: reason || 'Manual adjustment' }, req.user.customerId);
        return res.json({ status: 'success', message: 'Inventory adjusted' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    getWebSocket()?.emit('inventory.adjusted', { skuId, warehouseId, adjustmentQty, reason: reason || 'Manual adjustment' }, req.user.customerId);
    return res.json({ status: 'success', message: 'Inventory adjusted (Mock)' });
  });

  router.post('/inventory/transfer', requireAuth, async (req: any, res) => {
    const { skuId, fromWarehouseId, toWarehouseId, quantity } = req.body;
    if (!skuId || !fromWarehouseId || !toWarehouseId || !quantity) {
      return res.status(400).json({ error: 'skuId, fromWarehouseId, toWarehouseId, and quantity required' });
    }
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
          await tx.inventoryTransaction.create({
            data: {
              customerId: fromInv.customerId, warehouseId: fromWarehouseId, skuId, skuCode: fromInv.skuCode,
              type: 'TRANSFER_OUT', direction: 'OUT', quantity,
              beforeQty: fromInv.availableQty, afterQty: fromInv.availableQty - quantity,
              reason: `Transfer to warehouse ${toWarehouseId}`
            }
          });
        });
        return res.json({ status: 'success', message: 'Inventory transferred' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ status: 'success', message: 'Inventory transferred (Mock)' });
  });

  router.get('/inventory-transactions', requireAuth, async (req: any, res) => {
    const user = req.user;
    const isClient = (user.role || '').toUpperCase() === 'CLIENT';
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where = isClient && user.customerId ? { customerId: user.customerId } : {};
        const txs = await prisma.inventoryTransaction.findMany({ where, orderBy: { createdAt: 'desc' } });
        return res.json(txs);
      } catch (err) {
        console.error('Prisma transactions fetch error:', err);
      }
    }
    const db = getDB();
    res.json(db.inventory || []);
  });

  router.get('/inventory-reservations', requireAuth, async (req: any, res) => {
    const user = req.user;
    const isClient = (user.role || '').toUpperCase() === 'CLIENT';
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where = isClient && user.customerId ? { customerId: user.customerId } : {};
        const resvs = await prisma.inventoryReservation.findMany({ where, orderBy: { createdAt: 'desc' } });
        return res.json(resvs);
      } catch (err) {
        console.error('Prisma reservations fetch error:', err);
      }
    }
    res.json([]);
  });

  router.post('/inventory-adjustments', requireAuth, async (req: any, res) => {
    const { skuId, warehouseId, adjustQty, type, reason } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.$transaction(async (tx) => {
          const inv = await tx.inventory.findFirst({ where: { skuId, warehouseId } });
          if (!inv) throw new Error('Inventory not found');
          const delta = type === 'SUBTRACT' ? -adjustQty : adjustQty;
          const newQty = Math.max(0, inv.availableQty + delta);
          const updatedInv = await tx.inventory.update({ where: { id: inv.id }, data: { availableQty: newQty } });
          await tx.inventoryTransaction.create({
            data: {
              customerId: inv.customerId, warehouseId, skuId, skuCode: inv.skuCode,
              type: 'ADJUSTMENT', direction: delta > 0 ? 'IN' : 'OUT',
              quantity: Math.abs(delta), beforeQty: inv.availableQty, afterQty: newQty,
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
}
