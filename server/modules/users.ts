import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB, saveDB } from '../db';
import { requireAuth, requireRole } from '../middleware';

const safeUserSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
  role: true,
  customerId: true,
  warehouseId: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

export function registerUserRoutes(router: Router): void {
  router.get('/users', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const users = await prisma.user.findMany({
          select: safeUserSelect
        });
        return res.json(users);
      } catch (err) { console.error('Prisma users fetch error:', err); }
    }
    const db = getDB();
    res.json(db.users || []);
  });

  router.get('/users/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.params.id },
          select: safeUserSelect
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json(user);
      } catch (err) { console.error('Failed to fetch user', err); }
    }
    const db = getDB();
    const user = (db.users || []).find((u: any) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  router.post('/users', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { username, email, password, role, customerId, warehouseId } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const user = await prisma.user.create({
          data: {
            username,
            email,
            passwordHash,
            role: role || 'WAREHOUSE_OPERATOR',
            customerId: customerId || null,
            warehouseId: warehouseId || null,
            status: 'ACTIVE'
          },
          select: safeUserSelect
        });
        return res.status(201).json(user);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'user_' + Date.now(), username, email, role: role || 'WAREHOUSE_OPERATOR', customerId, warehouseId, status: 'ACTIVE' });
  });

  router.put('/users/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { email, name, role, customerId, warehouseId, status } = req.body;
    const data: any = {};
    if (email !== undefined) data.email = email;
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (customerId !== undefined) data.customerId = customerId || null;
    if (warehouseId !== undefined) data.warehouseId = warehouseId || null;
    if (status !== undefined) data.status = status;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const user = await prisma.user.update({ where: { id: req.params.id }, data, select: safeUserSelect });
        return res.json(user);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, email, role, customerId, warehouseId, status });
  });

  router.delete('/users/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.user.delete({ where: { id: req.params.id } });
        return res.json({ status: 'deleted' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'deleted' });
  });

  router.patch('/users/:id/status', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { status } = req.body;
    if (!status || !['ACTIVE', 'DISABLED'].includes(status)) return res.status(400).json({ error: 'Invalid status. Must be ACTIVE or DISABLED' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const user = await prisma.user.update({ where: { id: req.params.id }, data: { status }, select: safeUserSelect });
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

  router.post('/users/:id/reset-password', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
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
}
