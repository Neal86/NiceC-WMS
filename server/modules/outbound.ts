import { Router } from 'express';
import { getPrisma, checkDbConnection } from '../prisma';
import { getDB, saveDB } from '../db';
import { getWebSocket } from '../websocket';
import { resolveWarehouseId } from './warehouse';
import { requireAuth, requireRole, isWarehouseUser, assertWarehouseScope, requireApiKeyOrAuth } from '../middleware';
import { outboundCreateSchema } from '../validation';

export function registerOutboundRoutes(router: Router): void {

  async function releaseStockReservations(prisma: any, tx: any, orderId: string) {
    const reservations = await tx.inventoryReservation.findMany({ where: { orderId, status: 'ACTIVE' } });
    for (const resv of reservations) {
      const inv = await tx.inventory.findFirst({ where: { skuId: resv.skuId, warehouseId: resv.warehouseId } });
      if (inv) {
        await tx.inventory.update({
          where: { id: inv.id },
          data: { availableQty: inv.availableQty + resv.quantity, reservedQty: Math.max(0, inv.reservedQty - resv.quantity) }
        });
      }
      await tx.inventoryReservation.update({ where: { id: resv.id }, data: { status: 'RELEASED', releasedAt: new Date() } });
      await tx.inventoryTransaction.create({
        data: {
          customerId: resv.customerId, warehouseId: resv.warehouseId, skuId: resv.skuId, skuCode: resv.skuCode,
          type: 'RELEASE', direction: 'IN', quantity: resv.quantity,
          beforeQty: inv ? inv.availableQty : 0, afterQty: inv ? inv.availableQty + resv.quantity : 0,
          reason: `Outbound Order ${orderId} Cancelled`
        }
      });
    }
  }

  function isClient(user: any): boolean {
    return ['CLIENT', 'CUSTOMER'].includes((user?.role || '').toUpperCase());
  }

  router.get('/outbound-orders', requireApiKeyOrAuth, async (req: any, res) => {
    const user = req.user;
    const { tab, customerNameCode, orderType, salesPlatform, logisticsChannel, carrier, productCategory, recipient, sku, outboundOrderNo, createdTimeStart, createdTimeEnd, minQty, maxQty, sortBy = 'createdTime', sortOrder = 'desc', page = '1', pageSize = '10' } = req.query;

    const activeTab = (tab as string || 'ALL').toUpperCase();

    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const where: any = {};
        if (isClient(user) && user.customerId) where.customerId = user.customerId;
        if (isWarehouseUser(user) && user.warehouseId) where.warehouseId = user.warehouseId;

        if (activeTab !== 'ALL') where.status = activeTab;

        if (customerNameCode) where.customer = { OR: [{ id: { contains: customerNameCode as string, mode: 'insensitive' } }, { name: { contains: customerNameCode as string, mode: 'insensitive' } }, { code: { contains: customerNameCode as string, mode: 'insensitive' } }] };
        if (orderType) where.orderType = orderType;
        if (salesPlatform) where.salesPlatform = salesPlatform;
        if (recipient) where.recipient = { contains: recipient as string, mode: 'insensitive' };
        if (outboundOrderNo) where.orderNo = { contains: outboundOrderNo as string, mode: 'insensitive' };
        if (createdTimeStart || createdTimeEnd) {
          where.createdTime = {};
          if (createdTimeStart) where.createdTime.gte = new Date(createdTimeStart as string);
          if (createdTimeEnd) where.createdTime.lte = new Date(createdTimeEnd as string);
        }
        if (minQty || maxQty) {
          where.totalQty = {};
          if (minQty) where.totalQty.gte = parseInt(minQty as string, 10);
          if (maxQty) where.totalQty.lte = parseInt(maxQty as string, 10);
        }
        if (sku) where.items = { some: { OR: [{ skuCode: { contains: sku as string, mode: 'insensitive' } }, { productName: { contains: sku as string, mode: 'insensitive' } }] } };
        if (productCategory) where.items = { ...(where.items || {}), some: { ...((where.items as any)?.some || {}), category: productCategory } };

        if (logisticsChannel) {
          where.OR = [{ logisticsChannelId: logisticsChannel }, { logisticsChannel: { name: { contains: logisticsChannel as string, mode: 'insensitive' } } }];
        }
        if (carrier) {
          where.OR = [...(where.OR || []), { carrierId: carrier }, { carrier: { name: { contains: carrier as string, mode: 'insensitive' } } }];
        }

        const pNum = parseInt(page as string, 10);
        const pSize = parseInt(pageSize as string, 10);
        const orderBy: any = {};
        orderBy[sortBy as string] = sortOrder;

        const [ordersList, totalCount] = await Promise.all([
          prisma.outboundOrder.findMany({ where, include: { items: true, customer: true, logisticsChannel: true, carrier: true }, orderBy, skip: (pNum - 1) * pSize, take: pSize }),
          prisma.outboundOrder.count({ where })
        ]);

        const countsWhere: any = {};
        if (isClient(user) && user.customerId) countsWhere.customerId = user.customerId;
        if (isWarehouseUser(user) && user.warehouseId) countsWhere.warehouseId = user.warehouseId;
        const countsGroup = await prisma.outboundOrder.groupBy({ by: ['status'], where: countsWhere, _count: { id: true } });

        const counts: any = { ALL: 0, PENDING: 0, PICKING: 0, REVIEWS: 0, SHIPPING: 0, SHIPPED: 0, EXCEPTIONS: 0, CANCELLED: 0 };
        let grandTotal = 0;
        for (const item of countsGroup) {
          counts[item.status] = item._count.id;
          grandTotal += item._count.id;
        }
        counts.ALL = grandTotal;

        const resolvedOrders = ordersList.map(ord => ({
          ...ord, customerName: ord.customer?.name || '', customerCode: ord.customer?.code || '',
          logisticsChannelName: ord.logisticsChannel?.name || '', carrierName: ord.carrier?.name || '', items: ord.items || []
        }));

        return res.json({ orders: resolvedOrders, total: totalCount, counts, page: pNum, pageSize: pSize });
      } catch (err: any) {
        console.error('Prisma query error:', err);
      }
    }

    const db = getDB();
    let orders = [...db.outboundOrders];
    if (isClient(user) && user.customerId) orders = orders.filter(ord => ord.customerId === user.customerId);
    if (isWarehouseUser(user) && user.warehouseId) orders = orders.filter((ord: any) => ord.warehouseId === user.warehouseId);

    const counts = { ALL: orders.length, PENDING: orders.filter(o => o.status === 'PENDING').length, PICKING: orders.filter(o => o.status === 'PICKING').length, REVIEWS: orders.filter(o => o.status === 'REVIEWS').length, SHIPPING: orders.filter(o => o.status === 'SHIPPING').length, SHIPPED: orders.filter(o => o.status === 'SHIPPED').length, EXCEPTIONS: orders.filter(o => o.status === 'EXCEPTIONS').length, CANCELLED: orders.filter(o => o.status === 'CANCELLED').length };

    orders = orders.map(ord => {
      const cust = db.customers.find(c => c.id === ord.customerId);
      const chan = db.logisticsChannels.find(l => l.id === ord.logisticsChannelId);
      const carr = db.carriers.find(c => c.id === ord.carrierId);
      const items = db.outboundOrderItems.filter(item => item.orderId === ord.id);
      return { ...ord, customerName: cust?.name || '', customerCode: cust?.code || '', logisticsChannelName: chan?.name || '', carrierName: carr?.name || '', items };
    });

    if (activeTab !== 'ALL') orders = orders.filter(ord => ord.status === activeTab);

    if (customerNameCode) { const q = (customerNameCode as string).toLowerCase(); orders = orders.filter(ord => ord.customerId.toLowerCase().includes(q) || (ord as any).customerName?.toLowerCase().includes(q)); }
    if (orderType) orders = orders.filter(ord => ord.orderType === orderType);
    if (salesPlatform) orders = orders.filter(ord => ord.salesPlatform === salesPlatform);
    if (recipient) { const q = (recipient as string).toLowerCase(); orders = orders.filter(ord => ord.recipient.toLowerCase().includes(q)); }
    if (outboundOrderNo) { const q = (outboundOrderNo as string).toLowerCase(); orders = orders.filter(ord => ord.orderNo.toLowerCase().includes(q)); }
    if (sku) { const q = (sku as string).toLowerCase(); orders = orders.filter(ord => ord.items?.some((item: any) => item.skuCode.toLowerCase().includes(q) || item.productName.toLowerCase().includes(q))); }
    if (minQty) { const min = parseInt(minQty as string, 10); orders = orders.filter(ord => ord.totalQty >= min); }
    if (maxQty) { const max = parseInt(maxQty as string, 10); orders = orders.filter(ord => ord.totalQty <= max); }
    if (createdTimeStart && createdTimeEnd) { const start = new Date(createdTimeStart as string); const end = new Date(createdTimeEnd as string); orders = orders.filter(ord => { const ot = new Date(ord.createdTime); return ot >= start && ot <= end; }); }

    orders.sort((a: any, b: any) => {
      let fa = a[sortBy as string], fb = b[sortBy as string];
      if (typeof fa === 'string') { fa = fa.toLowerCase(); fb = fb.toLowerCase(); }
      return fa < fb ? (sortOrder === 'asc' ? -1 : 1) : fa > fb ? (sortOrder === 'asc' ? 1 : -1) : 0;
    });

    const pNum = parseInt(page as string, 10);
    const pSize = parseInt(pageSize as string, 10);
    const total = orders.length;
    const paginatedOrders = orders.slice((pNum - 1) * pSize, (pNum - 1) * pSize + pSize);
    res.json({ orders: paginatedOrders, total, counts, page: pNum, pageSize: pSize });
  });

  router.get('/outbound-orders/:id', requireApiKeyOrAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({
          where: { id: req.params.id }, include: { items: true, customer: true, logisticsChannel: true, carrier: true }
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (isClient(user) && user.customerId && order.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        if (isWarehouseUser(user) && user.warehouseId && order.warehouseId !== user.warehouseId) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
        return res.json({ ...order, customerName: order.customer?.name || '', customerCode: order.customer?.code || '', logisticsChannelName: order.logisticsChannel?.name || '', carrierName: order.carrier?.name || '', items: order.items || [] });
      } catch (err) { console.error('Prisma order fetch error:', err); }
    }
    const db = getDB();
    const order = db.outboundOrders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (isClient(user) && user.customerId && order.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
    if (isWarehouseUser(user) && user.warehouseId && (order as any).warehouseId !== user.warehouseId) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
    const cust = db.customers.find(c => c.id === order.customerId);
    const chan = db.logisticsChannels.find(l => l.id === order.logisticsChannelId);
    const carr = db.carriers.find(c => c.id === order.carrierId);
    const items = db.outboundOrderItems.filter(item => item.orderId === order.id);
    res.json({ ...order, customerName: cust?.name || '', customerCode: cust?.code || '', logisticsChannelName: chan?.name || '', carrierName: carr?.name || '', items });
  });

  router.post('/outbound-orders', requireApiKeyOrAuth, async (req: any, res) => {
    const user = req.user;
    const { customerId, logisticsChannelId, carrierId, remark = '', recipient, salesPlatform = 'Amazon', orderType = '单品单件', items = [] } = req.body;

    let resolvedCustomerId = customerId;
    if (isClient(user) && user.customerId) resolvedCustomerId = user.customerId;
    if (!resolvedCustomerId || !logisticsChannelId || !carrierId || !recipient || items.length === 0) return res.status(400).json({ error: 'Missing required fields' });

    const orderNo = 'OBS' + String(Date.now()).substring(3, 15);
    const newOrderId = 'ord_' + Math.random().toString(36).substr(2, 9);
    const totalQty = items.reduce((sum: number, item: any) => sum + (item.qty || 1), 0);
    const totalWeight = parseFloat((totalQty * 1.2).toFixed(2));
    const effectiveWhId = resolveWarehouseId(req.user, 'wh_default');
    if (!assertWarehouseScope(user, effectiveWhId)) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });

    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const result = await prisma.$transaction(async (tx) => {
          for (const item of items) {
            const inv = await tx.inventory.findFirst({ where: { skuId: item.skuId, warehouseId: effectiveWhId } });
            if (!inv || inv.availableQty < item.qty) {
              const skuObj = await tx.sKU.findUnique({ where: { id: item.skuId } });
              throw new Error(`库存不足，无法预留 SKU: ${skuObj ? skuObj.code : item.skuId} (可用: ${inv ? inv.availableQty : 0}, 需求: ${item.qty})`);
            }
          }

          const order = await tx.outboundOrder.create({
            data: {
              id: newOrderId, orderNo, status: 'PENDING', remark: remark || '-', totalWeight, totalQty,
              customerId: resolvedCustomerId, logisticsChannelId, carrierId, waveId: null,
              labelPrinted: 'NOT_PRINTED', recipient, salesPlatform, orderType, createdTime: new Date(),
              warehouseId: effectiveWhId
            }
          });

          for (const item of items) {
            const skuObj = await tx.sKU.findUnique({ where: { id: item.skuId } });
            const skuCode = skuObj ? skuObj.code : item.skuCode;
            const skuBarcode = skuObj ? skuObj.barcode : item.skuBarcode || skuCode;
            const productName = skuObj ? skuObj.name : item.productName;

            const newItem = await tx.outboundOrderItem.create({
              data: {
                id: 'item_' + Math.random().toString(36).substr(2, 9), orderId: newOrderId,
                skuId: item.skuId, skuCode, skuBarcode, qty: item.qty, productName, category: item.category || '未分类'
              }
            });

            const inv = await tx.inventory.findFirst({ where: { skuId: item.skuId, warehouseId: effectiveWhId } });
            if (inv) {
              await tx.inventory.update({ where: { id: inv.id }, data: { availableQty: inv.availableQty - item.qty, reservedQty: inv.reservedQty + item.qty } });
              await tx.inventoryReservation.create({ data: { customerId: resolvedCustomerId, orderId: newOrderId, orderItemId: newItem.id, skuId: item.skuId, skuCode, warehouseId: effectiveWhId, quantity: item.qty, status: 'ACTIVE' } });
              await tx.inventoryTransaction.create({ data: { customerId: resolvedCustomerId, warehouseId: effectiveWhId, skuId: item.skuId, skuCode, type: 'RESERVE', direction: 'OUT', quantity: item.qty, beforeQty: inv.availableQty, afterQty: inv.availableQty - item.qty, reason: `Outbound Order ${newOrderId} Stock Reservation` } });
            }
          }
          return { order, items };
        });

        const fullOrder = await prisma.outboundOrder.findUnique({ where: { id: result.order.id }, include: { customer: true, logisticsChannel: true, carrier: true } });
        return res.status(201).json({ status: 'success', order: { ...result.order, customerName: fullOrder?.customer?.name || '', customerCode: fullOrder?.customer?.code || '', logisticsChannelName: fullOrder?.logisticsChannel?.name || '', carrierName: fullOrder?.carrier?.name || '', items: result.items } });
      } catch (err: any) {
        return res.status(400).json({ error: err.message || 'Create outbound order transaction failed.' });
      }
    }

    const db = getDB();
    for (const item of items) {
      const inv = db.inventory.find(i => i.skuId === item.skuId);
      if (!inv || inv.availableQty < item.qty) {
        const skuObj = db.skus.find(s => s.id === item.skuId);
        return res.status(400).json({ error: `库存不足，无法预留 SKU: ${skuObj ? skuObj.code : item.skuId} (可用: ${inv ? inv.availableQty : 0}, 需求: ${item.qty})` });
      }
    }
    const newItems = items.map((item: any) => {
      const skuObj = db.skus.find(s => s.id === item.skuId);
      return { id: 'item_' + Math.random().toString(36).substr(2, 9), orderId: newOrderId, skuId: item.skuId, skuCode: skuObj ? skuObj.code : item.skuCode, skuBarcode: skuObj ? skuObj.barcode : item.skuBarcode || item.skuCode, qty: item.qty || 1, productName: skuObj ? skuObj.name : item.productName, category: item.category || '未分类' };
    });
    for (const item of newItems) {
      const inv = db.inventory.find(i => i.skuId === item.skuId);
      if (inv) { inv.availableQty = Math.max(0, inv.availableQty - item.qty); inv.reservedQty = (inv.reservedQty || 0) + item.qty; }
    }
    const newOrder: any = { id: newOrderId, orderNo, status: 'PENDING' as const, remark: remark || '-', totalWeight, totalQty, customerId: resolvedCustomerId, logisticsChannelId, carrierId, waveId: null, labelPrinted: 'NOT_PRINTED' as const, recipient, salesPlatform, orderType, createdTime: new Date().toISOString(), warehouseId: effectiveWhId };
    db.outboundOrders.push(newOrder);
    db.outboundOrderItems.push(...newItems);
    saveDB();
    const cust = db.customers.find(c => c.id === resolvedCustomerId);
    const chan = db.logisticsChannels.find(l => l.id === logisticsChannelId);
    const carr = db.carriers.find(c => c.id === carrierId);
    res.status(201).json({ status: 'success', order: { ...newOrder, customerName: cust?.name || '', customerCode: cust?.code || '', logisticsChannelName: chan?.name || '', carrierName: carr?.name || '', items: newItems } });
  });

  router.put('/outbound-orders/:id', requireAuth, async (req: any, res) => {
    const user = req.user;
    const updateData = req.body;
    const hasDb = await checkDbConnection();

    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (isClient(user) && user.customerId && order.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        if (!assertWarehouseScope(user, order.warehouseId)) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
        if (isClient(user) && updateData.status && updateData.status !== order.status) return res.status(403).json({ error: 'Forbidden. Client cannot change order status.' });
        if (order.status === 'SHIPPED' && updateData.items) return res.status(400).json({ error: '已出库订单无法修改商品列表' });

        const effectiveWhId = resolveWarehouseId(req.user, 'wh_default');
        const dataToUpdate: any = {};
        if (updateData.status) dataToUpdate.status = updateData.status;
        if (updateData.remark) dataToUpdate.remark = updateData.remark;
        if (updateData.recipient) dataToUpdate.recipient = updateData.recipient;
        if (updateData.salesPlatform) dataToUpdate.salesPlatform = updateData.salesPlatform;
        if (updateData.orderType) dataToUpdate.orderType = updateData.orderType;
        if (updateData.logisticsChannelId) dataToUpdate.logisticsChannelId = updateData.logisticsChannelId;
        if (updateData.carrierId) dataToUpdate.carrierId = updateData.carrierId;

        const updated = await prisma.$transaction(async (tx) => {
          if (updateData.items && Array.isArray(updateData.items)) {
            const oldReservations = await tx.inventoryReservation.findMany({ where: { orderId: order.id, status: 'ACTIVE' } });
            for (const resv of oldReservations) {
              const inv = await tx.inventory.findFirst({ where: { skuId: resv.skuId, warehouseId: resv.warehouseId } });
              if (inv) { await tx.inventory.update({ where: { id: inv.id }, data: { availableQty: inv.availableQty + resv.quantity, reservedQty: Math.max(0, inv.reservedQty - resv.quantity) } }); }
            }
            await tx.inventoryReservation.deleteMany({ where: { orderId: order.id } });
            await tx.outboundOrderItem.deleteMany({ where: { orderId: order.id } });

            for (const item of updateData.items) {
              const skuObj = await tx.sKU.findUnique({ where: { id: item.skuId } });
              const skuCode = skuObj ? skuObj.code : item.skuCode;
              const skuBarcode = skuObj ? skuObj.barcode : item.skuBarcode || skuCode;
              const productName = skuObj ? skuObj.name : item.productName;
              const inv = await tx.inventory.findFirst({ where: { skuId: item.skuId, warehouseId: effectiveWhId } });
              if (!inv || inv.availableQty < item.qty) throw new Error(`库存不足，无法预留 SKU: ${skuCode}`);

              const newItem = await tx.outboundOrderItem.create({
                data: { id: item.id || 'item_' + Math.random().toString(36).substr(2, 9), orderId: order.id, skuId: item.skuId, skuCode, skuBarcode, qty: item.qty || 1, productName, category: item.category || '未分类' }
              });
              await tx.inventory.update({ where: { id: inv.id }, data: { availableQty: inv.availableQty - item.qty, reservedQty: inv.reservedQty + item.qty } });
              await tx.inventoryReservation.create({ data: { customerId: order.customerId, orderId: order.id, orderItemId: newItem.id, skuId: item.skuId, skuCode, warehouseId: effectiveWhId, quantity: item.qty, status: 'ACTIVE' } });
            }
            dataToUpdate.totalQty = updateData.items.reduce((sum: number, i: any) => sum + i.qty, 0);
            dataToUpdate.totalWeight = parseFloat((dataToUpdate.totalQty * 1.2).toFixed(2));
          }
          return await tx.outboundOrder.update({ where: { id: order.id }, data: dataToUpdate, include: { items: true } });
        });
        return res.json({ status: 'success', order: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message || 'Update failed.' });
      }
    }

    const db = getDB();
    const index = db.outboundOrders.findIndex(o => o.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Order not found' });
    const currentOrder = db.outboundOrders[index];
    if (isClient(user) && user.customerId && currentOrder.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
    if (!assertWarehouseScope(user, (currentOrder as any).warehouseId)) return res.status(403).json({ error: 'Forbidden. Warehouse access denied.' });
    if (isClient(user) && updateData.status && updateData.status !== currentOrder.status) return res.status(403).json({ error: 'Forbidden. Client cannot change order status.' });
    if (currentOrder.status === 'SHIPPED' && updateData.items) return res.status(400).json({ error: '已出库订单无法修改商品列表' });

    const updatedOrder = { ...currentOrder, ...updateData, id: currentOrder.id, orderNo: currentOrder.orderNo };
    if (updateData.items && Array.isArray(updateData.items)) {
      const oldItems = db.outboundOrderItems.filter(item => item.orderId === currentOrder.id);
      for (const oldItem of oldItems) { const inv = db.inventory.find(i => i.skuId === oldItem.skuId); if (inv) { inv.availableQty += oldItem.qty; inv.reservedQty = Math.max(0, (inv.reservedQty || 0) - oldItem.qty); } }
      for (const item of updateData.items) { const inv = db.inventory.find(i => i.skuId === item.skuId); if (!inv || inv.availableQty < item.qty) { for (const oldItem of oldItems) { const oldInv = db.inventory.find(i => i.skuId === oldItem.skuId); if (oldInv) { oldInv.availableQty = Math.max(0, oldInv.availableQty - oldItem.qty); oldInv.reservedQty = (oldInv.reservedQty || 0) + oldItem.qty; } } return res.status(400).json({ error: `库存不足，无法预留 SKU: ${item.skuCode}` }); } }
      db.outboundOrderItems = db.outboundOrderItems.filter(item => item.orderId !== currentOrder.id);
      const newItems = updateData.items.map((item: any) => ({ id: item.id || 'item_' + Math.random().toString(36).substr(2, 9), orderId: currentOrder.id, skuId: item.skuId, skuCode: item.skuCode, skuBarcode: item.skuBarcode || item.skuCode, qty: item.qty || 1, productName: item.productName, category: item.category || '未分类' }));
      for (const item of newItems) { const inv = db.inventory.find(i => i.skuId === item.skuId); if (inv) { inv.availableQty = Math.max(0, inv.availableQty - item.qty); inv.reservedQty = (inv.reservedQty || 0) + item.qty; } }
      db.outboundOrderItems.push(...newItems);
      updatedOrder.totalQty = newItems.reduce((sum, item) => sum + item.qty, 0);
      updatedOrder.totalWeight = parseFloat((updatedOrder.totalQty * 1.2).toFixed(2));
    }
    db.outboundOrders[index] = updatedOrder;
    saveDB();
    res.json({ status: 'success', order: updatedOrder });
  });

  router.delete('/outbound-orders/:id', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (isClient(user) && user.customerId && order.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        if (order.status === 'SHIPPED') return res.status(400).json({ error: '已出库订单无法删除/取消' });

        const updated = await prisma.$transaction(async (tx) => {
          await releaseStockReservations(prisma, tx, order.id);
          return await tx.outboundOrder.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
        });
        return res.json({ status: 'success', message: 'Order soft deleted (cancelled) successfully', order: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message || 'Delete/Cancel failed.' });
      }
    }
    const db = getDB();
    const ord = db.outboundOrders.find(o => o.id === req.params.id);
    if (!ord) return res.status(404).json({ error: 'Order not found' });
    if (isClient(user) && user.customerId && ord.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
    if (ord.status === 'SHIPPED') return res.status(400).json({ error: '已出库订单无法删除/取消' });
    const reservations = db.outboundOrderItems.filter(item => item.orderId === ord.id);
    for (const item of reservations) { const inv = db.inventory.find(i => i.skuId === item.skuId); if (inv) { inv.availableQty += item.qty; inv.reservedQty = Math.max(0, (inv.reservedQty || 0) - item.qty); } }
    ord.status = 'CANCELLED';
    saveDB();
    res.json({ status: 'success', message: 'Order soft deleted (cancelled) successfully', order: ord });
  });

  router.post('/outbound-orders/batch-generate-wave', requireAuth, async (req: any, res) => {
    const user = req.user;
    if (isClient(user)) return res.status(403).json({ error: 'Forbidden: CLIENT role is not permitted to generate waves.' });

    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) return res.status(400).json({ error: 'No order IDs provided' });

    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const orders = await prisma.outboundOrder.findMany({ where: { id: { in: orderIds } } });
        const invalidOrders = orders.filter(o => ['CANCELLED', 'SHIPPED'].includes((o.status || '').toUpperCase()));
        if (invalidOrders.length > 0) return res.status(400).json({ error: `已取消或已出库的订单禁止生成波次: ${invalidOrders.map(o => o.orderNo).join(', ')}` });

        const count = await prisma.wave.count();
        const waveNo = 'WV' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '000' + (count + 1);

        const result = await prisma.$transaction(async (tx) => {
          const wave = await tx.wave.create({ data: { waveNo, status: 'PICKING', orderCount: orderIds.length } });
          await tx.outboundOrder.updateMany({ where: { id: { in: orderIds } }, data: { waveId: wave.id, status: 'PICKING' } });
          await tx.operationLog.create({ data: { userId: user.id || 'usr_1', username: user.username || 'system', action: `生成波次: ${waveNo}`, details: `成功生成波次 ${waveNo}, 包含 ${orderIds.length} 个订单` } });
          return wave;
        });
        return res.json({ status: 'success', message: `波次号 ${result.waveNo} 创建成功，成功归集 ${orderIds.length} 个出库单。`, wave: result });
      } catch (err: any) {
        return res.status(500).json({ error: 'PostgreSQL error: ' + err.message });
      }
    }

    const db = getDB();
    const orders = db.outboundOrders.filter(o => orderIds.includes(o.id));
    const invalidOrders = orders.filter(o => ['CANCELLED', 'SHIPPED'].includes((o.status || '').toUpperCase()));
    if (invalidOrders.length > 0) return res.status(400).json({ error: `已取消或已出库的订单禁止生成波次: ${invalidOrders.map(o => o.orderNo).join(', ')}` });
    const waveNo = 'WV' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '000' + (db.waves.length + 1);
    const newWave = { id: 'wave_' + Math.random().toString(36).substr(2, 9), waveNo, status: 'PICKING' as 'PENDING' | 'PICKING' | 'COMPLETED', orderCount: orderIds.length, createdTime: new Date().toISOString() };
    db.outboundOrders = db.outboundOrders.map(ord => orderIds.includes(ord.id) ? { ...ord, waveId: newWave.id, status: 'PICKING' as const } : ord);
    db.waves.push(newWave);
    saveDB();
    res.json({ status: 'success', message: `波次号 ${waveNo} 创建成功，成功归集 ${orderIds.length} 个出库单。`, wave: newWave });
  });

  router.post('/outbound-orders/:id/cancel', requireAuth, async (req: any, res) => {
    const user = req.user;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (isClient(user) && user.customerId && order.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        if (order.status === 'SHIPPED') return res.status(400).json({ error: '已出库订单无法取消' });

        const updated = await prisma.$transaction(async (tx) => {
          await releaseStockReservations(prisma, tx, order.id);
          return await tx.outboundOrder.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
        });
        getWebSocket()?.emit('order.status_changed', { orderId: updated.id, orderNo: updated.orderNo, status: 'CANCELLED' }, updated.customerId);
        return res.json({ status: 'success', message: '订单取消成功', order: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message || 'Cancel failed.' });
      }
    }
    const db = getDB();
    const ord = db.outboundOrders.find(o => o.id === req.params.id);
    if (!ord) return res.status(404).json({ error: 'Order not found' });
    if (isClient(user) && user.customerId && ord.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
    if (ord.status === 'SHIPPED') return res.status(400).json({ error: '已出库订单无法取消' });
    const reservations = db.outboundOrderItems.filter(item => item.orderId === ord.id);
    for (const item of reservations) { const inv = db.inventory.find(i => i.skuId === item.skuId); if (inv) { inv.availableQty += item.qty; inv.reservedQty = Math.max(0, (inv.reservedQty || 0) - item.qty); } }
    ord.status = 'CANCELLED';
    saveDB();
    res.json({ status: 'success', message: '订单取消成功', order: ord });
  });

  router.post('/outbound-orders/:id/ship', requireAuth, async (req: any, res) => {
    const user = req.user;
    if (isClient(user)) {
      return res.status(403).json({ error: 'Forbidden: CLIENT role cannot ship orders.' });
    }
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (isClient(user) && user.customerId && order.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
        if (order.status === 'SHIPPED') return res.status(400).json({ error: '订单已是出库状态' });
        if (order.status !== 'SHIPPING' && order.status !== 'REVIEWS') return res.status(400).json({ error: `订单状态是 ${order.status}，不能直接出库。必须先完成打包和称重。` });

        const updated = await prisma.$transaction(async (tx) => {
          const reservations = await tx.inventoryReservation.findMany({ where: { orderId: order.id, status: 'ACTIVE' } });
          for (const resv of reservations) {
            const inv = await tx.inventory.findFirst({ where: { skuId: resv.skuId, warehouseId: resv.warehouseId } });
            if (inv) {
              await tx.inventory.update({
                where: { id: inv.id },
                data: {
                  reservedQty: Math.max(0, inv.reservedQty - resv.quantity),
                  onHand: Math.max(0, (inv.onHand || 0) - resv.quantity)
                }
              });
            }
            await tx.inventoryReservation.update({ where: { id: resv.id }, data: { status: 'CONSUMED' } });
            await tx.inventoryTransaction.create({
              data: {
                customerId: resv.customerId, warehouseId: resv.warehouseId, skuId: resv.skuId, skuCode: resv.skuCode,
                type: 'SHIP', direction: 'OUT', quantity: resv.quantity,
                beforeQty: inv ? (inv.onHand || 0) : 0,
                afterQty: inv ? Math.max(0, (inv.onHand || 0) - resv.quantity) : 0,
                reason: `Outbound Order ${order.id} Shipped`
              }
            });
          }
          return await tx.outboundOrder.update({ where: { id: order.id }, data: { status: 'SHIPPED' } });
        });
        getWebSocket()?.emit('order.status_changed', { orderId: updated.id, orderNo: updated.orderNo, status: 'SHIPPED' }, updated.customerId);
        return res.json({ status: 'success', message: '出库确认成功，库存已扣减', order: updated });
      } catch (err: any) {
        return res.status(400).json({ error: err.message || 'Ship failed.' });
      }
    }
    const db = getDB();
    const ord = db.outboundOrders.find(o => o.id === req.params.id);
    if (!ord) return res.status(404).json({ error: 'Order not found' });
    if (isClient(user) && user.customerId && ord.customerId !== user.customerId) return res.status(403).json({ error: 'Forbidden. Access denied.' });
    if (ord.status === 'SHIPPED') return res.status(400).json({ error: '订单已是出库状态' });
    const reservations = db.outboundOrderItems.filter(item => item.orderId === ord.id);
    for (const item of reservations) { const inv = db.inventory.find(i => i.skuId === item.skuId) as any; if (inv) { inv.reservedQty = Math.max(0, (inv.reservedQty || 0) - item.qty); inv.onHand = Math.max(0, (inv.onHand || 0) - item.qty); } }
    ord.status = 'SHIPPED';
    saveDB();
    res.json({ status: 'success', message: '出库确认成功，库存已扣减', order: ord });
  });

  router.post('/outbound-orders/:id/print-label', requireAuth, (req, res) => {
    const db = getDB();
    const ord = db.outboundOrders.find(o => o.id === req.params.id);
    if (!ord) return res.status(404).json({ error: 'Order not found' });
    ord.labelPrinted = 'PRINTED';
    saveDB();
    res.json({ status: 'success', message: '面单打印状态更新成功', labelUrl: `https://mockpdf.wms.nicec.net/labels/${ord.orderNo}.pdf` });
  });

  router.post('/outbound-orders/:id/mark-label-printed', requireAuth, (req: any, res) => {
    if (isClient(req.user)) {
      return res.status(403).json({ error: 'Forbidden: CLIENT role is not permitted for this warehouse operation.' });
    }
    const db = getDB();
    const ord = db.outboundOrders.find(o => o.id === req.params.id);
    if (!ord) return res.status(404).json({ error: 'Order not found' });
    ord.labelPrinted = 'PRINTED';
    saveDB();
    res.json({ status: 'success', order: ord });
  });

  router.post('/outbound-orders/batch-print-pick-list', requireAuth, (req: any, res) => {
    if (isClient(req.user)) {
      return res.status(403).json({ error: 'Forbidden: CLIENT role is not permitted for this warehouse operation.' });
    }
    const { orderIds } = req.body;
    res.json({ status: 'success', message: `批量打印发货清单任务成功发送，包含 ${orderIds?.length || 0} 个出库单。` });
  });

  router.post('/outbound-orders/export', requireAuth, (req, res) => {
    res.json({ status: 'success', downloadUrl: 'https://mockpdf.wms.nicec.net/export/orders_export_temp.xlsx' });
  });

  router.post('/outbound-orders/:id/pick', requireAuth, async (req: any, res) => {
    if (isClient(req.user)) {
      return res.status(403).json({ error: 'Forbidden: CLIENT role is not permitted for this warehouse operation.' });
    }
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({ where: { id: req.params.id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'PENDING' && order.status !== 'PICKING') return res.status(400).json({ error: `Cannot pick order in status '${order.status}'` });
        const updated = await prisma.outboundOrder.update({ where: { id: req.params.id }, data: { status: 'PICKING' } });
        getWebSocket()?.emit('order.status_changed', { orderId: updated.id, orderNo: updated.orderNo, status: 'PICKING' }, updated.customerId);
        return res.json({ status: 'success', order: updated });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Pick started (Mock)' });
  });

  router.post('/outbound-orders/:id/pack', requireAuth, async (req: any, res) => {
    if (isClient(req.user)) {
      return res.status(403).json({ error: 'Forbidden: CLIENT role is not permitted for this warehouse operation.' });
    }
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({ where: { id: req.params.id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'PICKING') return res.status(400).json({ error: `Cannot pack order in status '${order.status}'. Must be PICKING.` });
        const pkgNo = 'PKG' + String(Date.now()).substring(3, 15);
        await prisma.package.create({ data: { packageNo: pkgNo, orderId: req.params.id } });
        const updated = await prisma.outboundOrder.update({ where: { id: req.params.id }, data: { status: 'REVIEWS' } });
        getWebSocket()?.emit('order.status_changed', { orderId: updated.id, orderNo: updated.orderNo, status: 'REVIEWS', packageNo: pkgNo }, updated.customerId);
        return res.json({ status: 'success', order: updated, packageNo: pkgNo });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ status: 'success', message: 'Packed (Mock)' });
  });

  router.post('/outbound-orders/:id/weigh-package', requireAuth, async (req: any, res) => {
    if (isClient(req.user)) {
      return res.status(403).json({ error: 'Forbidden: CLIENT role is not permitted for this warehouse operation.' });
    }
    const { weight, length, width, height } = req.body;
    const parsedWeight = parseFloat(weight || 0);
    if (parsedWeight <= 0) return res.status(400).json({ error: 'Weight must be greater than 0' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const order = await prisma.outboundOrder.findUnique({ where: { id: req.params.id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'REVIEWS') return res.status(400).json({ error: `Cannot weigh order in status '${order.status}'. Must be REVIEWS.` });
        const pkgNo = 'PKG' + String(Date.now()).substring(3, 15);
        const pkg = await prisma.package.create({ data: { packageNo: pkgNo, orderId: req.params.id, weight: parsedWeight, length: parseFloat(length || 0), width: parseFloat(width || 0), height: parseFloat(height || 0) } });
        await prisma.outboundOrder.update({ where: { id: req.params.id }, data: { status: 'SHIPPING' } });
        return res.status(201).json({ status: 'success', package: pkg, orderStatus: 'SHIPPING' });
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.status(201).json({ status: 'success', message: 'Package weighed successfully (Mock)' });
  });

  router.get('/outbound-orders/import-history', requireAuth, async (req: any, res) => {
    const db = getDB();
    res.json(db.importHistory || []);
  });

  router.post('/outbound-orders/import', requireApiKeyOrAuth, async (req: any, res) => {
    const user = req.user;
    const { rows } = req.body;
    const effectiveWhId = resolveWarehouseId(req.user, 'wh_default');
    if (!rows || !Array.isArray(rows) || rows.length === 0) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No rows provided.' } });
    if (!assertWarehouseScope(user, effectiveWhId)) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden. Warehouse access denied.' } });

    const errors: Array<{ row: number; message: string }> = [];
    const successRows: Array<{ orderNo: string; orderId: string; skuCount: number }> = [];
    const mergedOrders: Record<string, any> = {};

    for (const row of rows) {
      if (!mergedOrders[row.orderNo]) {
        mergedOrders[row.orderNo] = { orderNo: row.orderNo, recipientName: row.recipientName, address: row.address, phone: row.phone || '', logisticsChannel: row.logisticsChannel, items: [] };
      }
      mergedOrders[row.orderNo].items.push({ skuCode: row.skuCode, qty: row.qty });
    }

    const hasDb = await checkDbConnection();
    let customerId = user.customerId || 'cust_1';
    if (hasDb) {
      const prisma = getPrisma();
      try {
        for (const [orderNo, order] of Object.entries(mergedOrders)) {
          const resolvedChannel = await prisma.logisticsChannel.findFirst({ where: { OR: [{ name: { contains: (order as any).logisticsChannel, mode: 'insensitive' } }, { code: { contains: (order as any).logisticsChannel, mode: 'insensitive' } }] } });
          const resolvedCarrier = resolvedChannel ? await prisma.carrier.findUnique({ where: { id: resolvedChannel.carrierId } }) : null;
          const defaultChannel = await prisma.logisticsChannel.findFirst();
          const defaultCarrier = defaultChannel ? await prisma.carrier.findUnique({ where: { id: defaultChannel.carrierId } }) : null;
          const channel = resolvedChannel || defaultChannel;
          const carrier = resolvedCarrier || defaultCarrier;
          if (!channel || !carrier) { errors.push({ row: 0, message: `Order ${orderNo}: No logistics channel or carrier found` }); continue; }

          let hasStockIssue = false;
          for (const item of (order as any).items) {
            const sku = await prisma.sKU.findFirst({ where: { code: item.skuCode } });
            if (!sku) { errors.push({ row: 0, message: `Order ${orderNo}: SKU code '${item.skuCode}' not found` }); hasStockIssue = true; continue; }
            const inv = await prisma.inventory.findFirst({ where: { skuId: sku.id, warehouseId: effectiveWhId } });
            if (!inv || inv.availableQty < item.qty) { errors.push({ row: 0, message: `Order ${orderNo}: Insufficient stock for SKU '${item.skuCode}'` }); hasStockIssue = true; }
          }
          if (hasStockIssue) continue;

          const newOrderId = 'ord_imp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
          const totalQty = (order as any).items.reduce((sum: number, i: any) => sum + i.qty, 0);

          await prisma.$transaction(async (tx) => {
            const outboundOrder = await tx.outboundOrder.create({ data: { id: newOrderId, orderNo, status: 'PENDING', customerId, logisticsChannelId: channel.id, carrierId: carrier.id, recipient: `${(order as any).recipientName}, ${(order as any).address}`, totalQty, totalWeight: parseFloat((totalQty * 1.2).toFixed(2)), remark: `Bulk import: ${(order as any).logisticsChannel}`, salesPlatform: 'Bulk Import', orderType: '单品单件', createdTime: new Date(), warehouseId: effectiveWhId } });
            for (const item of (order as any).items) {
              const sku = await tx.sKU.findFirst({ where: { code: item.skuCode } });
              if (!sku) continue;
              const inv = await tx.inventory.findFirst({ where: { skuId: sku.id, warehouseId: effectiveWhId } });
              if (!inv) continue;
              const orderItem = await tx.outboundOrderItem.create({ data: { id: 'item_' + Math.random().toString(36).substr(2, 9), orderId: newOrderId, skuId: sku.id, skuCode: sku.code, skuBarcode: sku.barcode, qty: item.qty, productName: sku.name, category: '未分类' } });
              await tx.inventory.update({ where: { id: inv.id }, data: { availableQty: inv.availableQty - item.qty, reservedQty: inv.reservedQty + item.qty } });
              await tx.inventoryReservation.create({ data: { customerId, orderId: newOrderId, orderItemId: orderItem.id, skuId: sku.id, skuCode: sku.code, warehouseId: effectiveWhId, quantity: item.qty, status: 'ACTIVE' } });
              await tx.inventoryTransaction.create({ data: { customerId, warehouseId: effectiveWhId, skuId: sku.id, skuCode: sku.code, type: 'BULK_IMPORT_RESERVE', direction: 'OUT', quantity: item.qty, beforeQty: inv.availableQty, afterQty: inv.availableQty - item.qty, reason: `Bulk import order ${orderNo} stock reservation` } });
            }
          });
          successRows.push({ orderNo, orderId: newOrderId, skuCount: (order as any).items.length });
        }
      } catch (err: any) { return res.status(500).json({ success: false, error: { code: 'IMPORT_ERROR', message: err.message } }); }
    } else {
      const db = getDB();
      for (const [orderNo, order] of Object.entries(mergedOrders)) {
        const o = order as any;
        const channel = db.logisticsChannels.find(c => o.logisticsChannel.includes(c.code) || o.logisticsChannel.includes(c.name));
        if (!channel) { errors.push({ row: 0, message: `Order ${orderNo}: No matching logistics channel` }); continue; }
        const carrier = db.carriers.find(c => c.id === channel.carrierId);
        if (!carrier) continue;
        let hasStockIssue = false;
        for (const item of o.items) { const sku = db.skus.find(s => s.code === item.skuCode); if (!sku) { errors.push({ row: 0, message: `Order ${orderNo}: SKU '${item.skuCode}' not found` }); hasStockIssue = true; } }
        if (hasStockIssue) continue;
        const newOrderId = 'ord_imp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        const totalQty = o.items.reduce((sum: number, i: any) => sum + i.qty, 0);
        db.outboundOrders.push({ id: newOrderId, orderNo, status: 'PENDING' as const, customerId, logisticsChannelId: channel.id, carrierId: carrier.id, recipient: `${o.recipientName}, ${o.address}`, totalQty, totalWeight: parseFloat((totalQty * 1.2).toFixed(2)), remark: `Bulk import: ${o.logisticsChannel}`, salesPlatform: 'Bulk Import', orderType: '单品单件', waveId: null, labelPrinted: 'NOT_PRINTED' as const, createdTime: new Date().toISOString(), warehouseId: effectiveWhId } as any);
        for (const item of o.items) {
          const sku = db.skus.find(s => s.code === item.skuCode);
          if (!sku) continue;
          const inv = db.inventory.find(i => i.skuId === sku.id);
          if (inv) { inv.availableQty = Math.max(0, inv.availableQty - item.qty); inv.reservedQty = (inv.reservedQty || 0) + item.qty; }
          db.outboundOrderItems.push({ id: 'item_' + Date.now(), orderId: newOrderId, skuId: sku.id, skuCode: sku.code, skuBarcode: sku.barcode, qty: item.qty, productName: sku.name, category: '未分类' });
        }
        saveDB();
        successRows.push({ orderNo, orderId: newOrderId, skuCount: o.items.length });
      }
    }
    res.json({ success: true, message: `Import completed. ${successRows.length} orders created, ${errors.length} errors.`, data: { successRows, errors, totalRows: rows.length, orderCount: successRows.length, errorCount: errors.length } });
  });
}
