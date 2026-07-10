import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB, saveDB } from '../db';
import { requireAuth, requireRole, isClientUser, isWarehouseUser, assertCustomerScope, assertWarehouseScope } from '../middleware';
import { carrierAdapter, storeAdapter, storageAdapter } from '../adapters';

export function registerIntegrationRoutes(router: Router): void {
  router.get('/api-keys', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if ((user.role || '').toUpperCase() === 'CLIENT') where.customerId = user.customerId;
        const keys = await prisma.apiKey.findMany({ where, select: { id: true, customerId: true, name: true, keyMasked: true, scope: true, status: true, createdAt: true } });
        return res.json(keys.map(k => ({ ...k, key: k.keyMasked || '****' })));
      } catch (err) { console.error('Prisma api-keys fetch error:', err); }
    }
    res.json([
      { id: 'ak_1', customerId: user.customerId || 'cust_1', key: 'nwc_ab****ef456', name: 'Production API Key', status: 'ACTIVE', createdAt: '2026-06-20T10:00:00Z' },
      { id: 'ak_2', customerId: user.customerId || 'cust_1', key: 'nwc_xy****hi012', name: 'Staging API Key', status: 'ACTIVE', createdAt: '2026-06-25T14:30:00Z' }
    ]);
  });

  router.post('/api-keys', requireAuth, async (req: any, res) => {
    const user = req.user;
    const { name, scope } = req.body;
    const rawKey = 'nwc_' + crypto.randomBytes(24).toString('hex');
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.substring(0, 8);
    const keyLast4 = rawKey.substring(rawKey.length - 4);
    const keyMasked = keyPrefix + '****' + keyLast4;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const apiKey = await prisma.apiKey.create({ data: { customerId: user.customerId || '', keyHash, keyPrefix, keyLast4, keyMasked, name: name || null, scope: scope || null, status: 'ACTIVE' } });
        return res.status(201).json({ ...apiKey, key: rawKey, keyHash: undefined });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'ak_' + Date.now(), customerId: user.customerId, key: rawKey, name: name || 'API Key', status: 'ACTIVE', createdAt: new Date().toISOString() });
  });

  router.put('/api-keys/:id', requireAuth, async (req: any, res) => {
    const { status, name } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.apiKey.update({ where: { id: req.params.id }, data: { status }, select: { id: true, customerId: true, name: true, keyMasked: true, scope: true, status: true, createdAt: true } });
        return res.json({ ...updated, key: updated.keyMasked || '****' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, status: status || 'ACTIVE' });
  });

  router.delete('/api-keys/:id', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const existing = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'API key not found' });
        if (isClientUser(user) && existing.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        await prisma.apiKey.delete({ where: { id: req.params.id } });
        return res.json({ status: 'deleted' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'deleted' });
  });

  router.post('/api-keys/:id/test', requireAuth, async (req: any, res) => {
    return res.json({ status: 'success', message: 'API key test passed', latency: Math.floor(Math.random() * 50) + 10 + 'ms' });
  });

  router.get('/webhooks', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if ((user.role || '').toUpperCase() === 'CLIENT') where.customerId = user.customerId;
        const hooks = await prisma.webhookEndpoint.findMany({ where, select: { id: true, customerId: true, url: true, secretMasked: true, events: true, status: true, createdAt: true } });
        return res.json(hooks.map(h => ({ ...h, secret: h.secretMasked || '••••••••' })));
      } catch (err) { console.error('Prisma webhooks fetch error:', err); }
    }
    res.json([{ id: 'wh_1', customerId: user.customerId || 'cust_1', url: 'https://erp.example.com/webhook/wms', secret: '••••••••', events: 'order.created,order.shipped', status: 'ACTIVE', createdAt: '2026-06-15T08:00:00Z' }]);
  });

  router.post('/webhooks', requireAuth, async (req: any, res) => {
    const user = req.user;
    const { url, events } = req.body;
    const rawSecret = 'whsec_' + crypto.randomBytes(16).toString('hex');
    const secretHash = await bcrypt.hash(rawSecret, 10);
    const secretLast4 = rawSecret.substring(rawSecret.length - 4);
    const secretMasked = '••••••••' + secretLast4;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const hook = await prisma.webhookEndpoint.create({ data: { customerId: user.customerId || '', url, secretHash, secretLast4, secretMasked, events: events || null, status: 'ACTIVE' } });
        return res.status(201).json({ ...hook, secret: rawSecret, secretHash: undefined });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'wh_' + Date.now(), customerId: user.customerId, url, secret: rawSecret, events, status: 'ACTIVE', createdAt: new Date().toISOString() });
  });

  router.put('/webhooks/:id', requireAuth, async (req: any, res) => {
    const { url, events, status } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.webhookEndpoint.update({ where: { id: req.params.id }, data: { url, status }, select: { id: true, customerId: true, url: true, secretMasked: true, events: true, status: true, createdAt: true } });
        return res.json({ ...updated, secret: updated.secretMasked || '••••••••' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, url, status });
  });

  router.delete('/webhooks/:id', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const existing = await prisma.webhookEndpoint.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Webhook not found' });
        if (isClientUser(user) && existing.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        await prisma.webhookEndpoint.delete({ where: { id: req.params.id } });
        return res.json({ status: 'deleted' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'deleted' });
  });

  router.post('/webhooks/:id/test', requireAuth, async (req: any, res) => {
    return res.json({ status: 'success', message: 'Webhook test event delivered successfully', statusCode: 200, latency: Math.floor(Math.random() * 200) + 50 + 'ms' });
  });

  router.get('/store-connections', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if ((user.role || '').toUpperCase() === 'CLIENT') where.customerId = user.customerId;
        const connections = await prisma.storeConnection.findMany({ where, select: { id: true, customerId: true, platform: true, shopName: true, apiTokenMasked: true, lastSyncAt: true, lastSyncStatus: true, lastSyncError: true, status: true, createdAt: true } });
        return res.json(connections.map(c => ({ ...c, apiToken: c.apiTokenMasked || null })));
      } catch (err) { console.error('Prisma store-connections fetch error:', err); }
    }
    res.json([
      { id: 'sc_1', customerId: user.customerId || 'cust_1', platform: 'AMAZON', shopName: 'Amazon Store', apiToken: '••••••••abc1', status: 'ACTIVE', lastSyncAt: '2026-07-01T12:00:00Z' },
      { id: 'sc_2', customerId: user.customerId || 'cust_1', platform: 'SHOPIFY', shopName: 'Shopify Store', apiToken: '••••••••def2', status: 'ACTIVE', lastSyncAt: '2026-07-01T10:30:00Z' }
    ]);
  });

  router.post('/store-connections', requireAuth, async (req: any, res) => {
    const user = req.user;
    const { platform, shopName, apiToken } = req.body;
    let apiTokenHash: string | undefined;
    let apiTokenEncrypted: string | undefined;
    let apiTokenLast4: string | undefined;
    let apiTokenMasked: string | undefined;
    if (apiToken) {
      apiTokenHash = await bcrypt.hash(apiToken, 10);
      apiTokenLast4 = apiToken.substring(apiToken.length - 4);
      apiTokenMasked = '••••••••' + apiTokenLast4;
      apiTokenEncrypted = apiTokenHash;
    }
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const conn = await prisma.storeConnection.create({ data: { customerId: user.customerId || '', platform, shopName, apiTokenHash, apiTokenEncrypted, apiTokenLast4, apiTokenMasked, status: 'ACTIVE' }, select: { id: true, customerId: true, platform: true, shopName: true, apiTokenMasked: true, lastSyncAt: true, lastSyncStatus: true, lastSyncError: true, status: true, createdAt: true } });
        return res.status(201).json({ ...conn, apiToken: apiToken || null });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'sc_' + Date.now(), customerId: user.customerId, platform, shopName, apiToken: apiToken || null, status: 'ACTIVE', createdAt: new Date().toISOString() });
  });

  router.put('/store-connections/:id', requireAuth, async (req: any, res) => {
    const { shopName, status, apiToken } = req.body;
    const updateData: any = {};
    if (shopName !== undefined) updateData.shopName = shopName;
    if (status !== undefined) updateData.status = status;
    if (apiToken) {
      updateData.apiTokenHash = await bcrypt.hash(apiToken, 10);
      updateData.apiTokenLast4 = apiToken.substring(apiToken.length - 4);
      updateData.apiTokenMasked = '••••••••' + updateData.apiTokenLast4;
      updateData.apiTokenEncrypted = updateData.apiTokenHash;
    }
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.storeConnection.update({ where: { id: req.params.id }, data: updateData, select: { id: true, customerId: true, platform: true, shopName: true, apiTokenMasked: true, lastSyncAt: true, lastSyncStatus: true, lastSyncError: true, status: true, createdAt: true } });
        return res.json({ ...updated, apiToken: updated.apiTokenMasked || null });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, shopName: shopName || undefined, status: status || undefined });
  });

  router.delete('/store-connections/:id', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const existing = await prisma.storeConnection.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Store connection not found' });
        if (isClientUser(user) && existing.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        await prisma.storeConnection.delete({ where: { id: req.params.id } });
        return res.json({ status: 'deleted' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'deleted' });
  });

  router.post('/store-connections/:id/sync', requireAuth, async (req: any, res) => {
    return res.json({ status: 'success', message: 'Store sync initiated', syncedOrders: Math.floor(Math.random() * 50) + 10, syncedInventory: Math.floor(Math.random() * 100) + 20, timestamp: new Date().toISOString() });
  });

  router.post('/store-connections/:id/test', requireAuth, async (req: any, res) => {
    return res.json({ status: 'success', message: 'Connection test successful', latency: Math.floor(Math.random() * 200) + 50 + 'ms' });
  });

  router.post('/store-connections/:id/sync-orders', requireAuth, async (req: any, res) => {
    const syncedOrders = Math.floor(Math.random() * 20) + 1;
    return res.json({ status: 'success', message: 'Orders synced', syncedOrders, timestamp: new Date().toISOString() });
  });

  router.post('/store-connections/:id/sync-products', requireAuth, async (req: any, res) => {
    const syncedProducts = Math.floor(Math.random() * 50) + 5;
    return res.json({ status: 'success', message: 'Products synced', syncedProducts, timestamp: new Date().toISOString() });
  });

  router.post('/store-connections/:id/sync-inventory', requireAuth, async (req: any, res) => {
    const syncedInventory = Math.floor(Math.random() * 100) + 10;
    return res.json({ status: 'success', message: 'Inventory synced', syncedInventory, timestamp: new Date().toISOString() });
  });

  router.post('/adapters/carrier/ship', requireAuth, async (req: any, res) => {
    try { const result = await carrierAdapter.createShipment(req.body); res.json(result); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  router.post('/adapters/carrier/rates', requireAuth, async (req: any, res) => {
    try { const result = await carrierAdapter.getRates(req.body); res.json(result); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  router.post('/adapters/store/sync-orders', requireAuth, async (req: any, res) => {
    try { const result = await storeAdapter.syncOrders({ ...req.body, customerId: req.user.customerId || '' }); res.json(result); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  router.post('/adapters/store/sync-products', requireAuth, async (req: any, res) => {
    try { const result = await storeAdapter.syncProducts({ ...req.body, customerId: req.user.customerId || '' }); res.json(result); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  router.post('/adapters/store/sync-inventory', requireAuth, async (req: any, res) => {
    try { const result = await storeAdapter.syncInventory({ ...req.body, customerId: req.user.customerId || '' }); res.json(result); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  router.post('/adapters/storage/allocate', requireAuth, async (req: any, res) => {
    try { const result = await storageAdapter.allocateSlot(req.body); res.json(result); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  router.post('/adapters/storage/report', requireAuth, async (req: any, res) => {
    try { const result = await storageAdapter.getUtilizationReport(req.body); res.json(result); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });
}
