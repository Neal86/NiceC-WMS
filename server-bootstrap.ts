import fs from 'fs';
import path from 'path';

const sourcePath = path.join(process.cwd(), 'server.ts');
const runtimeDir = path.join(process.cwd(), '.wms-runtime');
const runtimeServerPath = path.join(runtimeDir, 'server.ts');

const injectionMarker = `  // ==========================================\n  // Vite Dev / Prod Handling`;

const completionRoutes = String.raw`
  // ==========================================
  // Runtime Completion APIs injected by server-bootstrap.ts
  // ==========================================
  const isAdminLike = (user: any) => {
    const role = (user?.role || '').toUpperCase();
    return ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'WAREHOUSE_MANAGER'].includes(role);
  };

  const mapRoleForPrisma = (role: string) => {
    const normalized = (role || 'WAREHOUSE_OPERATOR').toUpperCase();
    if (normalized === 'MANAGER') return 'WAREHOUSE_MANAGER';
    if (normalized === 'OPERATOR') return 'WAREHOUSE_OPERATOR';
    if (normalized === 'CUSTOMER') return 'CLIENT';
    if (['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_OPERATOR', 'CLIENT'].includes(normalized)) return normalized;
    return 'WAREHOUSE_OPERATOR';
  };

  const publicUser = (user: any) => {
    if (!user) return user;
    const { passwordHash, password, ...safe } = user;
    return safe;
  };

  const runtimeLog = (user: any, action: string, details?: string) => {
    try {
      const db = getDB();
      db.operationLogs = db.operationLogs || [];
      db.operationLogs.unshift({
        id: 'log_' + Math.random().toString(36).slice(2, 11),
        userId: user?.id || 'system',
        username: user?.username || user?.email || 'system',
        module: '系统管理',
        action,
        targetId: '',
        detail: details || action,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
      saveDB();
    } catch (err) {
      console.warn('Runtime log failed:', err);
    }
  };

  app.get('/api/auth/me', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      try {
        const prisma = getPrisma();
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (user) return res.json({ status: 'success', user: publicUser(user) });
      } catch (err) {
        console.error('Prisma auth/me failed:', err);
      }
    }
    const db = getDB();
    const user = (db.users || []).find((u: any) => u.id === req.user.id || u.username === req.user.username || u.email === req.user.email);
    return res.json({ status: 'success', user: publicUser(user || req.user) });
  });

  app.get('/api/users', requireAuth, async (req: any, res) => {
    if (!isAdminLike(req.user)) return res.status(403).json({ error: 'Forbidden. Admin or manager role required.' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      try {
        const prisma = getPrisma();
        const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
        return res.json(users.map(publicUser));
      } catch (err) {
        console.error('Prisma users list failed:', err);
      }
    }
    const db = getDB();
    return res.json((db.users || []).map(publicUser));
  });

  app.post('/api/users', requireAuth, async (req: any, res) => {
    if (!isAdminLike(req.user)) return res.status(403).json({ error: 'Forbidden. Admin or manager role required.' });
    const { username, email, name, role = 'OPERATOR', password = 'NiceC123!', customerId, warehouseId, status = 'ACTIVE' } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });

    const hasDb = await checkDbConnection();
    if (hasDb) {
      try {
        const prisma = getPrisma();
        const created = await prisma.user.create({
          data: {
            username,
            email: email || username,
            passwordHash: bcrypt.hashSync(password, 10),
            role: mapRoleForPrisma(role),
            customerId: customerId || null,
            warehouseId: warehouseId || null,
            status
          }
        });
        runtimeLog(req.user, '新增用户', username);
        return res.status(201).json({ status: 'success', user: publicUser({ ...created, name: name || username }) });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }

    const db = getDB();
    db.users = db.users || [];
    if (db.users.some((u: any) => u.username === username || u.email === (email || username))) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const created = {
      id: 'usr_' + Math.random().toString(36).slice(2, 11),
      username,
      email: email || username,
      name: name || username,
      role,
      customerId: customerId || null,
      warehouseId: warehouseId || null,
      status,
      createdAt: new Date().toISOString()
    };
    db.users.push(created);
    saveDB();
    runtimeLog(req.user, '新增用户', username);
    return res.status(201).json({ status: 'success', user: created, temporaryPassword: password });
  });

  app.put('/api/users/:id', requireAuth, async (req: any, res) => {
    if (!isAdminLike(req.user)) return res.status(403).json({ error: 'Forbidden. Admin or manager role required.' });
    const { role, password, ...rest } = req.body || {};
    const hasDb = await checkDbConnection();
    if (hasDb) {
      try {
        const prisma = getPrisma();
        const data: any = { ...rest };
        if (role !== undefined) data.role = mapRoleForPrisma(role);
        if (password) data.passwordHash = bcrypt.hashSync(password, 10);
        const updated = await prisma.user.update({ where: { id: req.params.id }, data });
        runtimeLog(req.user, '更新用户', req.params.id);
        return res.json({ status: 'success', user: publicUser(updated) });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const index = (db.users || []).findIndex((u: any) => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    db.users[index] = { ...db.users[index], ...rest, ...(role !== undefined ? { role } : {}) };
    saveDB();
    runtimeLog(req.user, '更新用户', req.params.id);
    return res.json({ status: 'success', user: publicUser(db.users[index]) });
  });

  app.post('/api/users/:id/reset-password', requireAuth, async (req: any, res) => {
    if (!isAdminLike(req.user)) return res.status(403).json({ error: 'Forbidden. Admin or manager role required.' });
    const password = req.body?.password || 'NiceC123!';
    const hasDb = await checkDbConnection();
    if (hasDb) {
      try {
        const prisma = getPrisma();
        await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash: bcrypt.hashSync(password, 10) } });
        runtimeLog(req.user, '重置密码', req.params.id);
        return res.json({ status: 'success', message: 'Password reset successfully' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    runtimeLog(req.user, '重置密码', req.params.id);
    return res.json({ status: 'success', message: 'Password reset recorded in fallback mode', temporaryPassword: password });
  });

  app.delete('/api/users/:id', requireAuth, async (req: any, res) => {
    if (!isAdminLike(req.user)) return res.status(403).json({ error: 'Forbidden. Admin or manager role required.' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      try {
        const prisma = getPrisma();
        await prisma.user.update({ where: { id: req.params.id }, data: { status: 'DISABLED' } });
        runtimeLog(req.user, '禁用用户', req.params.id);
        return res.json({ status: 'success', message: 'User disabled' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.users = (db.users || []).map((u: any) => u.id === req.params.id ? { ...u, status: 'DISABLED' } : u);
    saveDB();
    runtimeLog(req.user, '禁用用户', req.params.id);
    return res.json({ status: 'success', message: 'User disabled' });
  });

  app.post('/api/billing-rules', requireAuth, async (req: any, res) => {
    if (!isAdminLike(req.user)) return res.status(403).json({ error: 'Forbidden. Admin or manager role required.' });
    const { name, code, type = 'OUTBOUND', rate = 0 } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'name and code are required' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      try {
        const prisma = getPrisma();
        const rule = await prisma.billingRule.create({ data: { name, code, type, rate: parseFloat(rate) } });
        runtimeLog(req.user, '新增计费规则', code);
        return res.status(201).json({ status: 'success', rule });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.billingRules = db.billingRules || [];
    const rule = { id: 'bill_' + Math.random().toString(36).slice(2, 11), name, code, type, rate: parseFloat(rate), createdAt: new Date().toISOString() };
    db.billingRules.push(rule);
    saveDB();
    runtimeLog(req.user, '新增计费规则', code);
    return res.status(201).json({ status: 'success', rule });
  });

  app.put('/api/billing-rules/:id', requireAuth, async (req: any, res) => {
    if (!isAdminLike(req.user)) return res.status(403).json({ error: 'Forbidden. Admin or manager role required.' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      try {
        const prisma = getPrisma();
        const data = { ...req.body, ...(req.body.rate !== undefined ? { rate: parseFloat(req.body.rate) } : {}) };
        const rule = await prisma.billingRule.update({ where: { id: req.params.id }, data });
        runtimeLog(req.user, '更新计费规则', req.params.id);
        return res.json({ status: 'success', rule });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.billingRules = db.billingRules || [];
    const index = db.billingRules.findIndex((r: any) => r.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Billing rule not found' });
    db.billingRules[index] = { ...db.billingRules[index], ...req.body };
    saveDB();
    runtimeLog(req.user, '更新计费规则', req.params.id);
    return res.json({ status: 'success', rule: db.billingRules[index] });
  });

  app.delete('/api/billing-rules/:id', requireAuth, async (req: any, res) => {
    if (!isAdminLike(req.user)) return res.status(403).json({ error: 'Forbidden. Admin or manager role required.' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      try {
        const prisma = getPrisma();
        await prisma.billingRule.delete({ where: { id: req.params.id } });
        runtimeLog(req.user, '删除计费规则', req.params.id);
        return res.json({ status: 'success', message: 'Billing rule deleted' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.billingRules = (db.billingRules || []).filter((r: any) => r.id !== req.params.id);
    saveDB();
    runtimeLog(req.user, '删除计费规则', req.params.id);
    return res.json({ status: 'success', message: 'Billing rule deleted' });
  });

  app.post('/api/inventory/adjust', requireAuth, async (req: any, res) => {
    const { inventoryId, skuId, warehouseId, quantity, adjustQty, type = 'ADD', reason = 'Manual adjustment' } = req.body;
    const deltaRaw = Number(adjustQty ?? quantity ?? 0);
    if (!inventoryId && (!skuId || !warehouseId)) return res.status(400).json({ error: 'inventoryId or skuId + warehouseId is required' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      try {
        const prisma = getPrisma();
        const inv = inventoryId
          ? await prisma.inventory.findUnique({ where: { id: inventoryId } })
          : await prisma.inventory.findFirst({ where: { skuId, warehouseId } });
        if (!inv) return res.status(404).json({ error: 'Inventory not found' });
        const delta = type === 'SUBTRACT' || type === 'OUT' ? -Math.abs(deltaRaw) : Math.abs(deltaRaw);
        const afterQty = Math.max(0, inv.availableQty + delta);
        const updated = await prisma.inventory.update({ where: { id: inv.id }, data: { availableQty: afterQty } });
        await prisma.inventoryTransaction.create({
          data: {
            customerId: inv.customerId,
            warehouseId: inv.warehouseId,
            skuId: inv.skuId,
            skuCode: inv.skuCode,
            type: 'ADJUSTMENT',
            direction: delta >= 0 ? 'IN' : 'OUT',
            quantity: Math.abs(delta),
            beforeQty: inv.availableQty,
            afterQty,
            reason,
            operatorUserId: req.user?.id
          }
        });
        runtimeLog(req.user, '库存调整', `${inv.skuCode}: ${delta}`);
        return res.json({ status: 'success', inventory: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const inv = (db.inventory || []).find((i: any) => inventoryId ? i.id === inventoryId : i.skuId === skuId && i.warehouseId === warehouseId);
    if (!inv) return res.status(404).json({ error: 'Inventory not found' });
    const delta = type === 'SUBTRACT' || type === 'OUT' ? -Math.abs(deltaRaw) : Math.abs(deltaRaw);
    inv.availableQty = Math.max(0, (inv.availableQty || 0) + delta);
    saveDB();
    runtimeLog(req.user, '库存调整', `${inv.skuCode}: ${delta}`);
    return res.json({ status: 'success', inventory: inv });
  });

  app.post('/api/inventory/transfer', requireAuth, async (req: any, res) => {
    const { skuId, fromWarehouseId, toWarehouseId, quantity = 0, reason = 'Inventory transfer' } = req.body;
    const qty = Number(quantity);
    if (!skuId || !fromWarehouseId || !toWarehouseId || qty <= 0) return res.status(400).json({ error: 'skuId, fromWarehouseId, toWarehouseId and positive quantity are required' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      try {
        const prisma = getPrisma();
        const result = await prisma.$transaction(async (tx) => {
          const fromInv = await tx.inventory.findFirst({ where: { skuId, warehouseId: fromWarehouseId } });
          if (!fromInv || fromInv.availableQty < qty) throw new Error('Source warehouse inventory is insufficient');
          let toInv = await tx.inventory.findFirst({ where: { skuId, warehouseId: toWarehouseId } });
          await tx.inventory.update({ where: { id: fromInv.id }, data: { availableQty: fromInv.availableQty - qty } });
          if (toInv) {
            toInv = await tx.inventory.update({ where: { id: toInv.id }, data: { availableQty: toInv.availableQty + qty } });
          } else {
            toInv = await tx.inventory.create({ data: { customerId: fromInv.customerId, skuId, skuCode: fromInv.skuCode, warehouseId: toWarehouseId, availableQty: qty, reservedQty: 0, damagedQty: 0 } });
          }
          await tx.inventoryTransaction.create({ data: { customerId: fromInv.customerId, warehouseId: fromWarehouseId, skuId, skuCode: fromInv.skuCode, type: 'TRANSFER_OUT', direction: 'OUT', quantity: qty, beforeQty: fromInv.availableQty, afterQty: fromInv.availableQty - qty, reason, operatorUserId: req.user?.id } });
          await tx.inventoryTransaction.create({ data: { customerId: fromInv.customerId, warehouseId: toWarehouseId, skuId, skuCode: fromInv.skuCode, type: 'TRANSFER_IN', direction: 'IN', quantity: qty, beforeQty: toInv.availableQty - qty, afterQty: toInv.availableQty, reason, operatorUserId: req.user?.id } });
          return toInv;
        });
        runtimeLog(req.user, '库存转移', `${skuId}: ${fromWarehouseId} -> ${toWarehouseId} x ${qty}`);
        return res.json({ status: 'success', inventory: result });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const fromInv = (db.inventory || []).find((i: any) => i.skuId === skuId && i.warehouseId === fromWarehouseId);
    if (!fromInv || fromInv.availableQty < qty) return res.status(400).json({ error: 'Source warehouse inventory is insufficient' });
    let toInv = (db.inventory || []).find((i: any) => i.skuId === skuId && i.warehouseId === toWarehouseId);
    fromInv.availableQty -= qty;
    if (toInv) {
      toInv.availableQty = (toInv.availableQty || 0) + qty;
    } else {
      toInv = { ...fromInv, id: 'inv_' + Math.random().toString(36).slice(2, 11), warehouseId: toWarehouseId, availableQty: qty, reservedQty: 0, damagedQty: 0 };
      db.inventory.push(toInv);
    }
    saveDB();
    runtimeLog(req.user, '库存转移', `${skuId}: ${fromWarehouseId} -> ${toWarehouseId} x ${qty}`);
    return res.json({ status: 'success', inventory: toInv });
  });

  app.get('/api/feedback', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      try {
        const prisma = getPrisma();
        const where: any = {};
        if (!isAdminLike(req.user)) where.userId = req.user.id;
        const feedback = await prisma.feedback.findMany({ where, include: { comments: true }, orderBy: { createdAt: 'desc' } });
        return res.json(feedback);
      } catch (err) {
        console.error('Prisma feedback list failed:', err);
      }
    }
    const db = getDB();
    const rows = db.feedbacks || db.feedback || [];
    return res.json(isAdminLike(req.user) ? rows : rows.filter((f: any) => f.userId === req.user.id));
  });

`;

function main() {
  const source = fs.readFileSync(sourcePath, 'utf8');
  if (!source.includes(injectionMarker)) {
    throw new Error('Unable to find Vite handling marker in server.ts; completion routes were not injected.');
  }

  fs.mkdirSync(runtimeDir, { recursive: true });
  const generated = source.replace(injectionMarker, `${completionRoutes}\n${injectionMarker}`);
  fs.writeFileSync(runtimeServerPath, generated, 'utf8');
  import(`./.wms-runtime/server.ts`);
}

main();
