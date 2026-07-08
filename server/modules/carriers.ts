import { Router } from 'express';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB, saveDB } from '../db';
import { requireAuth } from '../middleware';

export function registerCarrierRoutes(router: Router): void {
  router.get('/carriers', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const carriers = await prisma.carrier.findMany();
        return res.json(carriers);
      } catch (err) { console.error('Prisma carriers error:', err); }
    }
    const db = getDB();
    res.json(db.carriers || []);
  });

  router.post('/carriers', requireAuth, async (req: any, res) => {
    const { name, code } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const carrier = await prisma.carrier.create({ data: { name, code } });
        return res.status(201).json(carrier);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'carr_' + Date.now(), name, code });
  });

  router.put('/carriers/:id', requireAuth, async (req: any, res) => {
    const { name, code } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.carrier.update({ where: { id: req.params.id }, data: { name, code } });
        return res.json(updated);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, name, code });
  });

  router.delete('/carriers/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.carrier.delete({ where: { id: req.params.id } });
        return res.json({ status: 'deleted' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'deleted' });
  });

  router.get('/logistics-channels', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const channels = await prisma.logisticsChannel.findMany();
        return res.json(channels);
      } catch (err) { console.error('Prisma logistics-channels error:', err); }
    }
    const db = getDB();
    res.json(db.logisticsChannels || []);
  });

  router.post('/logistics-channels', requireAuth, async (req: any, res) => {
    const { name, code, carrierId } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const channel = await prisma.logisticsChannel.create({ data: { name, code, carrierId } });
        return res.status(201).json(channel);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ id: 'chan_' + Date.now(), name, code, carrierId });
  });

  router.put('/logistics-channels/:id', requireAuth, async (req: any, res) => {
    const { name, code, carrierId } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.logisticsChannel.update({ where: { id: req.params.id }, data: { name, code, carrierId } });
        return res.json(updated);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, name, code, carrierId });
  });

  router.delete('/logistics-channels/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.logisticsChannel.delete({ where: { id: req.params.id } });
        return res.json({ status: 'deleted' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'deleted' });
  });
}
