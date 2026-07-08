import { Router } from 'express';
import { getPrisma, checkDbConnection } from '../prisma';
import { requireAuth, requireRole } from '../middleware';

export function registerSystemSettingsRoutes(router: Router): void {
  router.get('/system-settings', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const settings = await prisma.systemSetting.findMany();
        const masked = settings.map(s => ({
          key: s.key,
          value: s.key.toLowerCase().includes('secret') || s.key.toLowerCase().includes('key') || s.key.toLowerCase().includes('token') || s.key.toLowerCase().includes('password') ? '••••••••' : s.value,
          updatedAt: s.updatedAt,
        }));
        return res.json(masked);
      } catch (err) { console.error('Prisma system-settings fetch error:', err); }
    }
    return res.json([
      { key: 'wms_name', value: 'NiceC-WMS', updatedAt: new Date().toISOString() },
      { key: 'timezone', value: 'Asia/Shanghai', updatedAt: new Date().toISOString() },
      { key: 'currency', value: 'USD', updatedAt: new Date().toISOString() },
    ]);
  });

  router.put('/system-settings', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { settings } = req.body;
    if (!settings || !Array.isArray(settings)) return res.status(400).json({ error: 'settings array is required' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        for (const s of settings) {
          await prisma.systemSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: { key: s.key, value: s.value } });
        }
        await prisma.operationLog.create({ data: { userId: req.user?.id || 'system', username: req.user?.username || 'system', action: 'SYSTEM_SETTINGS_UPDATED', details: `${settings.length} setting(s) updated` } });
        return res.json({ status: 'success', updated: settings.length });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', updated: settings.length });
  });
}
