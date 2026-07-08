import { Router } from 'express';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB, saveDB } from '../db';
import { requireAuth, requireRole, requireCustomerAccess } from '../middleware';

export function registerCustomerRoutes(router: Router): void {
  router.get('/customers', requireAuth, requireCustomerAccess, async (req: any, res) => {
    const user = req.user;
    const isClient = (user.role || '').toUpperCase() === 'CLIENT';
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where = isClient && user.customerId ? { id: user.customerId } : {};
        const customers = await prisma.customer.findMany({ where });
        return res.json(customers);
      } catch (err) {
        console.error('Prisma customers fetch error:', err);
      }
    }
    const db = getDB();
    if (isClient && user.customerId) {
      return res.json(db.customers.filter(c => c.id === user.customerId));
    }
    res.json(db.customers);
  });

  router.get('/customers/:id', requireAuth, requireCustomerAccess, async (req: any, res) => {
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

  router.post('/customers', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const newCust = await prisma.customer.create({
          data: { name: req.body.name, code: req.body.code, contact: req.body.contactName || req.body.contact || '-', email: req.body.email || '-' }
        });
        return res.status(201).json({ status: 'success', customer: newCust });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const newCust = { id: 'cust_' + Date.now(), ...req.body };
    db.customers.push(newCust);
    saveDB();
    res.status(201).json({ status: 'success', customer: newCust });
  });

  router.put('/customers/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.customer.update({
          where: { id: req.params.id },
          data: { name: req.body.name, code: req.body.code, contact: req.body.contactName !== undefined ? req.body.contactName : req.body.contact, email: req.body.email }
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

  router.delete('/customers/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
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
}
