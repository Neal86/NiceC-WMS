import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB, saveDB } from '../db';
import { requireAuth } from '../middleware';
import { loginSchema } from '../validation';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'NiceC-WMS-Secret-Token-Key-2026!');

export function registerAuthRoutes(router: Router): void {
  router.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;

    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      return res.status(400).json({ status: 'error', message: 'Invalid credentials' });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const enableDemoLogin = process.env.ENABLE_DEMO_LOGIN === 'true';

    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const dbUser = await prisma.user.findFirst({
          where: { OR: [{ username }, { email: username }] }
        });

        if (dbUser) {
          if (dbUser.status !== 'ACTIVE') {
            return res.status(401).json({ status: 'error', message: 'Account is disabled' });
          }
          const isMatch = bcrypt.compareSync(password, dbUser.passwordHash);
          if (isMatch) {
            const token = jwt.sign(
              { id: dbUser.id, username: dbUser.username, email: dbUser.email, role: dbUser.role, customerId: dbUser.customerId, warehouseId: dbUser.warehouseId },
              JWT_SECRET,
              { expiresIn: '24h' }
            );
            return res.json({
              status: 'success',
              user: {
                id: dbUser.id,
                username: dbUser.username,
                email: dbUser.email,
                name: dbUser.name || dbUser.username,
                role: dbUser.role,
                customerId: dbUser.customerId,
                warehouseId: dbUser.warehouseId,
                token
              }
            });
          }
          return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }
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

    if (!enableDemoLogin && isProduction) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const db = getDB();
    let localUser = db.users.find(u => u.username === username || u.email === username);

    if (localUser) {
      if ((localUser as any).passwordHash) {
        const isMatch = bcrypt.compareSync(password, (localUser as any).passwordHash);
        if (!isMatch) {
          return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }
      } else {
        const expectedPassword = (process.env.DEMO_PASSWORDS || '').split(',').reduce((acc: Record<string, string>, pair: string) => {
          const [k, v] = pair.split(':');
          if (k) acc[k.trim()] = v?.trim() || '';
          return acc;
        }, {});
        if (expectedPassword[username] && password !== expectedPassword[username]) {
          return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }
      }

      const u = localUser as any;
      const token = jwt.sign(
        { id: u.id, username: u.username, email: u.email, role: u.role, customerId: u.customerId, warehouseId: u.warehouseId },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({
        status: 'success',
        user: {
          id: u.id,
          username: u.username,
          name: u.name || u.username,
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

  router.get('/auth/me', requireAuth, (req: any, res) => {
    return res.json({
      status: 'success',
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        name: req.user.name || req.user.username,
        role: req.user.role,
        customerId: req.user.customerId,
        warehouseId: req.user.warehouseId
      }
    });
  });

  router.post('/auth/logout', (req, res) => {
    res.json({ status: 'success', message: 'Logged out successfully' });
  });

  router.post('/auth/change-password', requireAuth, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Current password and new password (min 6 chars) required' });
    }
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
        if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
        return res.json({ status: 'success', message: 'Password changed successfully' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    return res.json({ status: 'success', message: 'Password changed (Mock)' });
  });
}
