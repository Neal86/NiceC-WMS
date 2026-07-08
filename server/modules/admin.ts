import { Router } from 'express';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB } from '../db';
import { requireAuth, requireRole } from '../middleware';

export function registerAdminRoutes(router: Router): void {
  router.get('/dashboard/summary', requireAuth, async (req: any, res) => {
    const isClient = (req.user.role || '').toUpperCase() === 'CLIENT';
    const customerId = req.user.customerId;

    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where = isClient && customerId ? { customerId } : {};
        const [pendingOrders, shippedOrders, exceptionOrders, totalInventory] = await Promise.all([
          prisma.outboundOrder.count({ where: { ...where, status: 'PENDING' } }),
          prisma.outboundOrder.count({ where: { ...where, status: 'SHIPPED' } }),
          prisma.outboundOrder.count({ where: { ...where, status: 'EXCEPTIONS' } }),
          prisma.inventory.count({ where: isClient && customerId ? { customerId } : {} }),
        ]);
        return res.json({ pendingOrders, shippedOrders, exceptionOrders, totalSKUs: totalInventory });
      } catch (err) {
        console.error('Prisma dashboard summary error:', err);
      }
    }

    const db = getDB();
    const orders = isClient && customerId ? db.outboundOrders.filter(o => o.customerId === customerId) : db.outboundOrders;
    res.json({
      pendingOrders: orders.filter(o => o.status === 'PENDING').length,
      shippedOrders: orders.filter(o => o.status === 'SHIPPED').length,
      exceptionOrders: orders.filter(o => o.status === 'EXCEPTIONS').length,
      totalSKUs: db.skus.length,
    });
  });

  router.get('/dashboard/outbound-trend', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const orders = await prisma.outboundOrder.findMany({
          where: { createdTime: { gte: sevenDaysAgo } },
          select: { createdTime: true, totalQty: true },
        });

        const trend: Array<{ date: string; qty: number }> = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(sevenDaysAgo);
          d.setDate(d.getDate() + i);
          const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const dayOrders = orders.filter(o => {
            const ot = new Date(o.createdTime);
            return ot.getDate() === d.getDate() && ot.getMonth() === d.getMonth() && ot.getFullYear() === d.getFullYear();
          });
          trend.push({ date: dateStr, qty: dayOrders.reduce((sum, o) => sum + o.totalQty, 0) });
        }
        return res.json(trend);
      } catch (err) {
        console.error('Prisma outbound-trend error:', err);
      }
    }
    res.json([
      { date: '06-23', qty: 1540 }, { date: '06-24', qty: 1820 }, { date: '06-25', qty: 2110 },
      { date: '06-26', qty: 1940 }, { date: '06-27', qty: 1680 }, { date: '06-28', qty: 2340 }, { date: '06-29', qty: 2614 },
    ]);
  });

  router.get('/dashboard/channel-distribution', requireAuth, async (req: any, res) => {
    const isClient = (req.user.role || '').toUpperCase() === 'CLIENT';
    const customerId = req.user.customerId;

    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where = isClient && customerId ? { customerId } : {};
        const orders = await prisma.outboundOrder.findMany({
          where,
          select: { logisticsChannelId: true },
        });
        const channelOrders: Record<string, number> = {};
        for (const o of orders) {
          channelOrders[o.logisticsChannelId] = (channelOrders[o.logisticsChannelId] || 0) + 1;
        }
        const total = Object.values(channelOrders).reduce((s, v) => s + v, 0);
        const channels = await prisma.logisticsChannel.findMany();
        const distribution = Object.entries(channelOrders).map(([id, value]) => {
          const chan = channels.find(c => c.id === id);
          return { name: chan?.name || id, value: Math.round((value / total) * 100) };
        });
        return res.json(distribution.length > 0 ? distribution : [
          { name: 'FEDEX FHD_G', value: 45 }, { name: 'USPS GROUND', value: 35 },
          { name: 'UPS GROUND', value: 12 }, { name: 'DHL EXPRESS', value: 5 }, { name: 'AMAZON SHIP', value: 3 },
        ]);
      } catch (err) {
        console.error('Prisma channel-distribution error:', err);
      }
    }

    const db = getDB();
    const orders = isClient && customerId ? db.outboundOrders.filter(o => o.customerId === customerId) : db.outboundOrders;
    const channelOrders: Record<string, number> = {};
    for (const o of orders) {
      const key = (o as any).logisticsChannelId || (o as any).salesPlatform || 'Unknown';
      channelOrders[key] = (channelOrders[key] || 0) + 1;
    }
    const total = Object.values(channelOrders).reduce((s: number, v: number) => s + v, 0);
    const distribution = Object.entries(channelOrders).map(([id, value]) => {
      const chan = db.logisticsChannels.find((l: any) => l.id === id);
      return { name: chan?.name || id, value: Math.round((value / total) * 100) };
    });
    res.json(distribution.length > 0 ? distribution : [
      { name: 'FEDEX FHD_G', value: 45 }, { name: 'USPS GROUND', value: 35 },
      { name: 'UPS GROUND', value: 12 }, { name: 'DHL EXPRESS', value: 5 }, { name: 'AMAZON SHIP', value: 3 },
    ]);
  });
}
