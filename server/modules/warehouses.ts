import { Router } from 'express';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB, saveDB } from '../db';
import { requireAuth, requireRole } from '../middleware';

export function registerWarehouseRoutes(router: Router): void {
  router.get('/warehouses', requireAuth, async (req: any, res) => {
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

  router.post('/warehouses', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN', 'WAREHOUSE_MANAGER'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const newWh = await prisma.warehouse.create({ data: { name: req.body.name, code: req.body.code, address: req.body.address || '-' } });
        return res.status(201).json({ status: 'success', warehouse: newWh });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const newWh = { id: 'wh_' + Date.now(), ...req.body };
    db.warehouses.push(newWh);
    saveDB();
    res.status(201).json({ status: 'success', warehouse: newWh });
  });

  router.put('/warehouses/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN', 'WAREHOUSE_MANAGER'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.warehouse.update({
          where: { id: req.params.id },
          data: { name: req.body.name, code: req.body.code, address: req.body.address }
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

  router.delete('/warehouses/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
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
}
