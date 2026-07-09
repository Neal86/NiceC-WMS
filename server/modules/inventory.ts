import { Router } from 'express';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB, saveDB } from '../db';
import { getWebSocket } from '../websocket';
import { requireAuth, isClientUser, isWarehouseUser, assertWarehouseScope } from '../middleware';
import { inventoryAdjustSchema, inventoryTransferSchema } from '../validation';

export function registerInventoryRoutes(router: Router): void {
  router.get('/inventory', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if (isClientUser(user) && user.customerId) where.customerId = user.customerId;
        if (isWarehouseUser(user) && user.warehouseId) where.warehouseId = user.warehouseId;
        const inventory = await prisma.inventory.findMany({ where });
        return res.json(inventory);
      } catch (err) {
        console.error('Prisma inventory list error:', err);
      }
    }
    const db = getDB();
    let inventory = db.inventory;
    if (isClientUser(user) && user.customerId) {
      inventory = inventory.filter((inv: any) => inv.customerId === user.customerId);
    }
    if (isWarehouseUser(user) && user.warehouseId) {
      inventory = inventory.filter((inv: any) => inv.warehouseId === user.warehouseId);
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
        if (isClientUser(req.user) && req.user.customerId && inv.customerId !== req.user.customerId) {
          return res.status(403).json({ error: 'Forbidden. Access denied.' });
        }
        if (isWarehouseUser(req.user) && req.user.warehouseId && inv.warehouseId !== req.user.warehouseId) {
          return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
        }
        return res.json(inv);
      } catch (err) {
        console.error('Prisma inventory fetch error:', err);
      }
    }
    const db = getDB();
    const inv = db.inventory.find(i => i.id === req.params.id);
    if (!inv) return res.status(404).json({ error: 'Inventory not found' });
    if (isClientUser(req.user) && req.user.customerId && (inv as any).customerId !== req.user.customerId) {
      return res.status(403).json({ error: 'Forbidden. Access denied.' });
    }
    if (isWarehouseUser(req.user) && req.user.warehouseId && (inv as any).warehouseId !== req.user.warehouseId) {
      return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
    }
    res.json(inv);
  });

  router.put('/inventory/:id', requireAuth, async (req: any, res) => {
    if (isClientUser(req.user)) {
      return res.status(403).json({ error: 'Forbidden. Client cannot update inventory.' });
    }
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const current = await prisma.inventory.findUnique({ where: { id: req.params.id } });
        if (!current) return res.status(404).json({ error: 'Inventory not found' });
        if (!assertWarehouseScope(req.user, current.warehouseId)) {
          return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
        }
        const { availableQty, reservedQty, damagedQty } = req.body;
        if (availableQty !== undefined && Number(availableQty) < 0) return res.status(400).json({ error: 'availableQty cannot be negative' });
        if (reservedQty !== undefined && Number(reservedQty) < 0) return res.status(400).json({ error: 'reservedQty cannot be negative' });
        if (damagedQty !== undefined && Number(damagedQty) < 0) return res.status(400).json({ error: 'damagedQty cannot be negative' });
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
    const inv = db.inventory[index] as any;
    if (!assertWarehouseScope(req.user, inv.warehouseId)) {
      return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
    }
    db.inventory[index] = { ...db.inventory[index], ...req.body };
    saveDB();
    res.json({ status: 'success', inventory: db.inventory[index] });
  });

  router.post('/inventory/adjust', requireAuth, async (req: any, res) => {
    if (isClientUser(req.user)) {
      return res.status(403).json({ error: 'Forbidden. Client cannot adjust inventory.' });
    }
    const { skuId, warehouseId, adjustmentQty, reason } = req.body;
    if (!skuId || !warehouseId || adjustmentQty === undefined) {
      return res.status(400).json({ error: 'skuId, warehouseId, and adjustmentQty required' });
    }
    if (!assertWarehouseScope(req.user, warehouseId)) {
      return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
    }
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.$transaction(async (tx) => {
          const inv = await tx.inventory.findFirst({ where: { skuId, warehouseId } });
          if (!inv) throw new Error('Inventory record not found');
          const qty = Number(adjustmentQty);
          const beforeQty = inv.availableQty;
          const afterQty = beforeQty + qty;
          if (afterQty < 0) throw new Error('Adjustment would make availableQty negative');
          const beforeOnHand = inv.onHand || 0;
          const afterOnHand = beforeOnHand + qty;
          if (afterOnHand < 0) throw new Error('Adjustment would make onHand negative');
          await tx.inventory.update({
            where: { id: inv.id },
            data: { availableQty: afterQty, onHand: afterOnHand }
          });
          await tx.inventoryTransaction.create({
            data: {
              customerId: inv.customerId, warehouseId, skuId, skuCode: inv.skuCode,
              type: 'ADJUSTMENT', direction: qty >= 0 ? 'IN' : 'OUT',
              quantity: Math.abs(qty), beforeQty, afterQty, reason: reason || 'Manual adjustment'
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
    if (isClientUser(req.user)) {
      return res.status(403).json({ error: 'Forbidden. Client cannot transfer inventory.' });
    }
    const { skuId, fromWarehouseId, toWarehouseId, quantity } = req.body;
    if (!skuId || !fromWarehouseId || !toWarehouseId || !quantity) {
      return res.status(400).json({ error: 'skuId, fromWarehouseId, toWarehouseId, and quantity required' });
    }
    if (!assertWarehouseScope(req.user, fromWarehouseId)) {
      return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
    }
    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be positive' });
    }
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.$transaction(async (tx) => {
          const fromInv = await tx.inventory.findFirst({ where: { skuId, warehouseId: fromWarehouseId } });
          if (!fromInv || fromInv.availableQty < quantity) throw new Error('Insufficient stock at source warehouse');
          const fromOnHand = fromInv.onHand || 0;
          await tx.inventory.update({
            where: { id: fromInv.id },
            data: {
              availableQty: fromInv.availableQty - quantity,
              onHand: Math.max(0, fromOnHand - quantity)
            }
          });
          const toInv = await tx.inventory.findFirst({ where: { skuId, warehouseId: toWarehouseId } });
          if (toInv) {
            await tx.inventory.update({
              where: { id: toInv.id },
              data: {
                availableQty: toInv.availableQty + quantity,
                onHand: (toInv.onHand || 0) + quantity
              }
            });
          }
          await tx.inventoryTransaction.create({
            data: {
              customerId: fromInv.customerId, warehouseId: fromWarehouseId, skuId, skuCode: fromInv.skuCode,
              type: 'TRANSFER_OUT', direction: 'OUT', quantity,
              beforeQty: fromInv.availableQty, afterQty: fromInv.availableQty - quantity,
              reason: `Transfer to warehouse ${toWarehouseId}`
            }
          });
          await tx.inventoryTransaction.create({
            data: {
              customerId: fromInv.customerId, warehouseId: toWarehouseId, skuId, skuCode: fromInv.skuCode,
              type: 'TRANSFER_IN', direction: 'IN', quantity,
              beforeQty: toInv ? toInv.availableQty : 0, afterQty: toInv ? toInv.availableQty + quantity : quantity,
              reason: `Transfer from warehouse ${fromWarehouseId}`
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
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if (isClientUser(user) && user.customerId) where.customerId = user.customerId;
        if (isWarehouseUser(user) && user.warehouseId) where.warehouseId = user.warehouseId;
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
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if (isClientUser(user) && user.customerId) where.customerId = user.customerId;
        if (isWarehouseUser(user) && user.warehouseId) where.warehouseId = user.warehouseId;
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
