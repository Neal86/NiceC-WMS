import { Router } from 'express';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB, saveDB } from '../db';
import { requireAuth, requireCustomerAccess } from '../middleware';

export function registerProductRoutes(router: Router): void {
  router.get('/products', requireAuth, async (req: any, res) => {
    const user = req.user;
    const isClient = (user.role || '').toUpperCase() === 'CLIENT';
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where = isClient && user.customerId ? { customerId: user.customerId } : {};
        const prods = await prisma.product.findMany({ where });
        return res.json(prods);
      } catch (err) {
        console.error('Prisma products list error:', err);
      }
    }
    const db = getDB();
    let prods = db.products || [];
    if (isClient && user.customerId) {
      prods = prods.filter(p => p.customerId === user.customerId);
    }
    res.json(prods);
  });

  router.get('/products/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const prod = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!prod) return res.status(404).json({ error: 'Product not found' });
        return res.json(prod);
      } catch (err) {
        console.error('Prisma product fetch error:', err);
      }
    }
    const db = getDB();
    const prod = db.products.find(p => p.id === req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    res.json(prod);
  });

  router.post('/products', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const newProd = await prisma.product.create({
          data: {
            name: req.body.name, sku: req.body.sku, barcode: req.body.barcode || null,
            category: req.body.category || null, weight: parseFloat(req.body.weight || 0),
            volume: parseFloat(req.body.volume || 0), customerId: req.body.customerId || req.user.customerId || 'cust_1'
          }
        });
        return res.status(201).json({ status: 'success', product: newProd });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const newProd = { id: 'prod_' + Date.now(), ...req.body, brand: req.body.brand || '-', description: req.body.description || '-', status: 'ACTIVE' };
    db.products.push(newProd);
    saveDB();
    res.status(201).json({ status: 'success', product: newProd });
  });

  router.put('/products/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const data: any = {};
        if (req.body.name !== undefined) data.name = req.body.name;
        if (req.body.sku !== undefined) data.sku = req.body.sku;
        if (req.body.barcode !== undefined) data.barcode = req.body.barcode;
        if (req.body.category !== undefined) data.category = req.body.category;
        if (req.body.weight !== undefined) data.weight = parseFloat(req.body.weight);
        if (req.body.volume !== undefined) data.volume = parseFloat(req.body.volume);
        if (req.body.customerId !== undefined) data.customerId = req.body.customerId;
        const updated = await prisma.product.update({ where: { id: req.params.id }, data });
        return res.json({ status: 'success', product: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const index = db.products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });
    db.products[index] = { ...db.products[index], ...req.body };
    saveDB();
    res.json({ status: 'success', product: db.products[index] });
  });

  router.delete('/products/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.product.delete({ where: { id: req.params.id } });
        return res.json({ status: 'success', message: 'Product deleted' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.products = db.products.filter(p => p.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'Product deleted' });
  });
}

export function registerSkuRoutes(router: Router): void {
  router.get('/skus', requireAuth, async (req: any, res) => {
    const user = req.user;
    const isClient = (user.role || '').toUpperCase() === 'CLIENT';
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where = isClient && user.customerId ? { customerId: user.customerId } : {};
        const skus = await prisma.sKU.findMany({ where });
        return res.json(skus);
      } catch (err) {
        console.error('Prisma SKU list error:', err);
      }
    }
    const db = getDB();
    let skus = db.skus;
    if (isClient && user.customerId) {
      skus = skus.filter(s => s.customerId === user.customerId);
    }
    res.json(skus);
  });

  router.get('/skus/:id', requireAuth, requireCustomerAccess, async (req: any, res) => {
    const user = req.user;
    const isClient = (user.role || '').toUpperCase() === 'CLIENT';
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const sku = await prisma.sKU.findUnique({ where: { id: req.params.id } });
        if (!sku) return res.status(404).json({ error: 'SKU not found' });
        if (isClient && user.customerId && sku.customerId !== user.customerId) {
          return res.status(403).json({ error: 'Forbidden. Access denied.' });
        }
        return res.json(sku);
      } catch (err) {
        console.error('Prisma SKU fetch error:', err);
      }
    }
    const db = getDB();
    const sku = db.skus.find(s => s.id === req.params.id);
    if (!sku) return res.status(404).json({ error: 'SKU not found' });
    if (isClient && user.customerId && sku.customerId !== user.customerId) {
      return res.status(403).json({ error: 'Forbidden. Access denied.' });
    }
    res.json(sku);
  });

  router.post('/skus', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const newSku = await prisma.sKU.create({
          data: { code: req.body.code, name: req.body.name, barcode: req.body.barcode || '-', weight: parseFloat(req.body.weight || 0), customerId: req.body.customerId || req.user.customerId || 'cust_1' }
        });
        return res.status(201).json({ status: 'success', sku: newSku });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const newSku = { id: 'sku_' + Date.now(), ...req.body };
    db.skus.push(newSku);
    saveDB();
    res.status(201).json({ status: 'success', sku: newSku });
  });

  router.put('/skus/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const data: any = {};
        if (req.body.code !== undefined) data.code = req.body.code;
        if (req.body.name !== undefined) data.name = req.body.name;
        if (req.body.barcode !== undefined) data.barcode = req.body.barcode;
        if (req.body.weight !== undefined) data.weight = parseFloat(req.body.weight);
        if (req.body.customerId !== undefined) data.customerId = req.body.customerId;
        const updated = await prisma.sKU.update({ where: { id: req.params.id }, data });
        return res.json({ status: 'success', sku: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    const index = db.skus.findIndex(s => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'SKU not found' });
    db.skus[index] = { ...db.skus[index], ...req.body };
    saveDB();
    res.json({ status: 'success', sku: db.skus[index] });
  });

  router.delete('/skus/:id', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        await prisma.sKU.delete({ where: { id: req.params.id } });
        return res.json({ status: 'success', message: 'SKU deleted' });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    const db = getDB();
    db.skus = db.skus.filter(s => s.id !== req.params.id);
    saveDB();
    res.json({ status: 'success', message: 'SKU deleted' });
  });
}
