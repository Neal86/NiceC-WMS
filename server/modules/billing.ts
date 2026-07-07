/**
 * Billing Module — Real WMS billing engine
 *
 * Calculates charges based on actual warehouse operations:
 *   OUTBOUND → per order/item/sku
 *   INBOUND  → per ASN/item/sku
 *   STORAGE  → per CBM/day, pallet/day, or month
 *   RETURN   → per return order/item
 *   RELABEL  → per item/sku
 *   WORK_ORDER → per work order
 *   MATERIAL → per consumable qty
 *
 * Every billing record is idempotent (ruleId + sourceType + sourceId unique).
 */

import { getPrisma, checkDbConnection } from '../prisma';
import { getWebSocket } from '../websocket';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface BillingFilters {
  customerId?: string;
  warehouseId?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface GenerateBillingResult {
  generated: number;
  skipped: number;
  errors: string[];
  records: Array<{ id: string; customerId: string; type: string; amount: number }>;
}

export interface GenerateInvoiceResult {
  generated: number;
  invoices: Array<{ id: string; invoiceNo: string; customerId: string; amount: number }>;
}

// ──────────────────────────────────────────────
// Quantity resolvers per billing rule type
// ──────────────────────────────────────────────

async function resolveOrderCount(customerId: string, startDate: Date, endDate: Date): Promise<number> {
  const prisma = getPrisma();
  return prisma.outboundOrder.count({
    where: { customerId, createdTime: { gte: startDate, lte: endDate } }
  });
}

async function resolveItemCount(customerId: string, startDate: Date, endDate: Date): Promise<number> {
  const prisma = getPrisma();
  const orders = await prisma.outboundOrder.findMany({
    where: { customerId, createdTime: { gte: startDate, lte: endDate } },
    select: { id: true },
  });
  if (orders.length === 0) return 0;
  const items = await prisma.outboundOrderItem.groupBy({
    by: ['orderId'],
    where: { orderId: { in: orders.map(o => o.id) } },
    _sum: { qty: true },
  });
  return items.reduce((sum, i) => sum + (i._sum.qty || 0), 0);
}

async function resolveSkuCount(customerId: string, startDate: Date, endDate: Date): Promise<number> {
  const prisma = getPrisma();
  const orders = await prisma.outboundOrder.findMany({
    where: { customerId, createdTime: { gte: startDate, lte: endDate } },
    select: { id: true },
  });
  if (orders.length === 0) return 0;
  const items = await prisma.outboundOrderItem.findMany({
    where: { orderId: { in: orders.map(o => o.id) } },
    select: { skuId: true },
    distinct: ['skuId'],
  });
  return items.length;
}

async function resolveCbmDays(customerId: string, startDate: Date, endDate: Date): Promise<number> {
  const prisma = getPrisma();
  const products = await prisma.product.findMany({
    where: { customerId },
    select: { volume: true },
  });
  const totalCbm = products.reduce((sum, p) => sum + p.volume, 0);
  const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
  return Math.max(1, Math.round(totalCbm * days * 100) / 100);
}

async function resolveInboundOrderCount(customerId: string, startDate: Date, endDate: Date): Promise<number> {
  const prisma = getPrisma();
  return prisma.inboundOrder.count({
    where: { customerId, createdAt: { gte: startDate, lte: endDate } }
  });
}

async function resolveInboundItemCount(customerId: string, startDate: Date, endDate: Date): Promise<number> {
  const prisma = getPrisma();
  const orders = await prisma.inboundOrder.findMany({
    where: { customerId, createdAt: { gte: startDate, lte: endDate } },
    select: { id: true },
  });
  if (orders.length === 0) return 0;
  const items = await prisma.inboundOrderItem.groupBy({
    by: ['orderId'],
    where: { orderId: { in: orders.map(o => o.id) } },
    _sum: { qtyExpected: true },
  });
  return items.reduce((sum, i) => sum + (i._sum.qtyExpected || 0), 0);
}

async function resolveReturnCount(customerId: string, startDate: Date, endDate: Date): Promise<number> {
  const prisma = getPrisma();
  return prisma.returnOrder.count({
    where: { customerId, createdAt: { gte: startDate, lte: endDate } }
  });
}

async function resolveReturnItemCount(customerId: string, startDate: Date, endDate: Date): Promise<number> {
  const prisma = getPrisma();
  const returns = await prisma.returnOrder.findMany({
    where: { customerId, createdAt: { gte: startDate, lte: endDate } },
    select: { id: true },
  });
  if (returns.length === 0) return 0;
  const items = await prisma.returnItem.groupBy({
    by: ['returnOrderId'],
    where: { returnOrderId: { in: returns.map(r => r.id) } },
    _sum: { qtyReceived: true },
  });
  return items.reduce((sum, i) => sum + (i._sum.qtyReceived || 0), 0);
}

async function resolveRelabelCount(customerId: string, startDate: Date, endDate: Date): Promise<number> {
  const prisma = getPrisma();
  const relabels = await prisma.relabelOrder.findMany({
    where: { customerId, createdAt: { gte: startDate, lte: endDate } },
    select: { quantity: true },
  });
  return relabels.reduce((sum, r) => sum + r.quantity, 0);
}

async function resolveWorkOrderCount(customerId: string, startDate: Date, endDate: Date): Promise<number> {
  const prisma = getPrisma();
  return prisma.workOrder.count({
    where: { customerId, createdAt: { gte: startDate, lte: endDate } }
  });
}

// ──────────────────────────────────────────────
// Quantity resolver dispatcher
// ──────────────────────────────────────────────

const QUANTITY_RESOLVERS: Record<string, (customerId: string, start: Date, end: Date) => Promise<number>> = {
  ORDER: resolveOrderCount,
  ITEM: resolveItemCount,
  SKU: resolveSkuCount,
  CBM: resolveCbmDays,
  INBOUND_ORDER: resolveInboundOrderCount,
  INBOUND_ITEM: resolveInboundItemCount,
  RETURN: resolveReturnCount,
  RETURN_ITEM: resolveReturnItemCount,
  RELABEL: resolveRelabelCount,
  WORK_ORDER: resolveWorkOrderCount,
};

// ──────────────────────────────────────────────
// Calculate a single billing record amount
// ──────────────────────────────────────────────

export function calculateBillingAmount(rate: number, quantity: number, minCharge: number): number {
  const raw = rate * quantity;
  return Math.max(raw, minCharge);
}

// ──────────────────────────────────────────────
// Resolve billable sources for a rule
// ──────────────────────────────────────────────

export async function resolveBillableSources(rule: any, filters: BillingFilters): Promise<Array<{ sourceType: string; sourceId: string; quantity: number }>> {
  const { customerId, periodStart, periodEnd } = filters;
  if (!customerId || !periodStart || !periodEnd) return [];

  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);

  const type = (rule.type || '').toUpperCase();
  const unit = (rule.unit || '').toUpperCase();

  // Use unit-specific resolvers
  if (QUANTITY_RESOLVERS[unit]) {
    const qty = await QUANTITY_RESOLVERS[unit](customerId, startDate, endDate);
    if (qty <= 0) return [];
    return [{ sourceType: type, sourceId: `${type}_${customerId}_${periodStart}_${periodEnd}`, quantity: qty }];
  }

  // Fallback: resolve by type
  switch (type) {
    case 'OUTBOUND': {
      const prisma = getPrisma();
      const orders = await prisma.outboundOrder.findMany({
        where: { customerId, createdTime: { gte: startDate, lte: endDate } },
        select: { id: true, totalQty: true },
      });
      const qty = unit === 'ITEM' ? orders.reduce((s, o) => s + o.totalQty, 0) : orders.length;
      if (qty <= 0) return [];
      return [{ sourceType: 'OUTBOUND', sourceId: `OUTBOUND_${customerId}_${periodStart}_${periodEnd}`, quantity: qty }];
    }
    case 'INBOUND': {
      const qty = await resolveInboundOrderCount(customerId, startDate, endDate);
      if (qty <= 0) return [];
      return [{ sourceType: 'INBOUND', sourceId: `INBOUND_${customerId}_${periodStart}_${periodEnd}`, quantity: qty }];
    }
    case 'STORAGE': {
      const qty = await resolveCbmDays(customerId, startDate, endDate);
      if (qty <= 0) return [];
      return [{ sourceType: 'STORAGE', sourceId: `STORAGE_${customerId}_${periodStart}_${periodEnd}`, quantity: qty }];
    }
    case 'RETURN': {
      const qty = await resolveReturnCount(customerId, startDate, endDate);
      if (qty <= 0) return [];
      return [{ sourceType: 'RETURN', sourceId: `RETURN_${customerId}_${periodStart}_${periodEnd}`, quantity: qty }];
    }
    case 'RELABEL': {
      const qty = await resolveRelabelCount(customerId, startDate, endDate);
      if (qty <= 0) return [];
      return [{ sourceType: 'RELABEL', sourceId: `RELABEL_${customerId}_${periodStart}_${periodEnd}`, quantity: qty }];
    }
    case 'WORK_ORDER': {
      const qty = await resolveWorkOrderCount(customerId, startDate, endDate);
      if (qty <= 0) return [];
      return [{ sourceType: 'WORK_ORDER', sourceId: `WORK_ORDER_${customerId}_${periodStart}_${periodEnd}`, quantity: qty }];
    }
    default:
      return [{ sourceType: type, sourceId: `${type}_${customerId}_${periodStart}_${periodEnd}`, quantity: 1 }];
  }
}

// ──────────────────────────────────────────────
// Generate billing records for a period
// ──────────────────────────────────────────────

export async function generateBillingRecords(filters: BillingFilters): Promise<GenerateBillingResult> {
  const result: GenerateBillingResult = { generated: 0, skipped: 0, errors: [], records: [] };
  const { customerId, warehouseId, periodStart, periodEnd } = filters;

  if (!periodStart || !periodEnd) {
    result.errors.push('periodStart and periodEnd are required');
    return result;
  }

  const hasDb = await checkDbConnection();
  if (!hasDb) {
    result.errors.push('Database not available');
    return result;
  }

  const prisma = getPrisma();
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);

  // Find active billing rules
  const where: any = { isActive: true };
  if (customerId) where.customerId = customerId;
  if (warehouseId) where.warehouseId = warehouseId;
  const rules = await prisma.billingRule.findMany({ where });

  // Collect customers to bill
  let customers: Array<{ id: string }>;
  if (customerId) {
    customers = [{ id: customerId }];
  } else {
    customers = await prisma.customer.findMany({ select: { id: true } });
  }

  for (const cust of customers) {
    for (const rule of rules) {
      try {
        // Date guard
        if (rule.effectiveFrom && startDate < rule.effectiveFrom) continue;
        if (rule.effectiveTo && endDate > rule.effectiveTo) continue;

        // Resolve sources
        const sources = await resolveBillableSources(rule, { customerId: cust.id, periodStart, periodEnd });
        if (sources.length === 0) {
          result.skipped++;
          continue;
        }

        for (const src of sources) {
          // Dedup check: same ruleId + sourceType + sourceId
          const existing = await prisma.billingRecord.findFirst({
            where: { ruleId: rule.id, sourceType: src.sourceType, sourceId: src.sourceId }
          });
          if (existing) {
            result.skipped++;
            continue;
          }

          const amount = calculateBillingAmount(rule.rate, src.quantity, rule.minCharge);

          const record = await prisma.billingRecord.create({
            data: {
              customerId: cust.id,
              ruleId: rule.id,
              type: rule.type,
              sourceType: src.sourceType,
              sourceId: src.sourceId,
              amount,
              quantity: src.quantity,
              unit: rule.unit,
              description: `${rule.name} — ${src.quantity} ${rule.unit} @ ${rule.rate}`,
              currency: rule.currency || 'USD',
              status: 'UNPAID',
            },
          });

          // Write operation log
          await prisma.operationLog.create({
            data: {
              userId: 'system',
              username: 'system',
              action: 'BILLING_RECORD_CREATED',
              details: `Generated billing record ${record.id} for customer ${cust.id}: ${rule.name} = $${amount} (${src.quantity} ${rule.unit})`,
            },
          });

          result.generated++;
          result.records.push({ id: record.id, customerId: cust.id, type: rule.type, amount });

          // WebSocket notification
          const ws = getWebSocket();
          ws?.emit('billing.generated', { recordId: record.id, customerId: cust.id, type: rule.type, amount }, cust.id);
        }
      } catch (err: any) {
        result.errors.push(`Rule ${rule.code} for customer ${cust.id}: ${err.message}`);
      }
    }
  }

  return result;
}

// ──────────────────────────────────────────────
// Generate invoices from unpaid billing records
// ──────────────────────────────────────────────

export async function generateInvoices(filters: BillingFilters & { dueDate?: string }): Promise<GenerateInvoiceResult> {
  const result: GenerateInvoiceResult = { generated: 0, invoices: [] };
  const { customerId, periodStart, periodEnd, dueDate } = filters;

  const hasDb = await checkDbConnection();
  if (!hasDb) return result;

  const prisma = getPrisma();

  // Find customers with unpaid records
  const customerWhere: any = {};
  if (customerId) customerWhere.id = customerId;
  const customers = await prisma.customer.findMany({ where: customerWhere, select: { id: true } });

  for (const cust of customers) {
    const recordWhere: any = { customerId: cust.id, status: 'UNPAID', invoiceId: null };
    if (periodStart && periodEnd) {
      recordWhere.createdAt = { gte: new Date(periodStart), lte: new Date(periodEnd) };
    }

    const unpaidRecords = await prisma.billingRecord.findMany({ where: recordWhere });
    if (unpaidRecords.length === 0) continue;

    const totalAmount = unpaidRecords.reduce((sum, r) => sum + r.amount, 0);
    if (totalAmount <= 0) continue;

    const invoiceNo = 'INV' + String(Date.now()).substring(3, 12) + cust.id.substring(0, 3);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        customerId: cust.id,
        amount: totalAmount,
        status: 'UNPAID',
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 86400000),
      },
    });

    // Link billing records to invoice
    await prisma.billingRecord.updateMany({
      where: { id: { in: unpaidRecords.map(r => r.id) } },
      data: { invoiceId: invoice.id },
    });

    // Operation log
    await prisma.operationLog.create({
      data: {
        userId: 'system',
        username: 'system',
        action: 'INVOICE_GENERATED',
        details: `Generated invoice ${invoice.invoiceNo} for customer ${cust.id}: $${totalAmount} (${unpaidRecords.length} records)`,
      },
    });

    result.generated++;
    result.invoices.push({ id: invoice.id, invoiceNo, customerId: cust.id, amount: totalAmount });

    const ws = getWebSocket();
    ws?.emit('invoice.generated', { invoiceId: invoice.id, invoiceNo, customerId: cust.id, amount: totalAmount }, cust.id);
  }

  return result;
}

// ──────────────────────────────────────────────
// Mark invoice as paid
// ──────────────────────────────────────────────

export async function markInvoicePaid(invoiceId: string): Promise<{ success: boolean; error?: string }> {
  const hasDb = await checkDbConnection();
  if (!hasDb) return { success: false, error: 'Database not available' };

  const prisma = getPrisma();
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { success: false, error: 'Invoice not found' };

  // State machine: UNPAID/OVERDUE -> PAID
  if (invoice.status === 'PAID') return { success: false, error: 'Invoice is already paid' };
  if (invoice.status === 'VOID') return { success: false, error: 'Cannot pay a voided invoice' };

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'PAID', paidAt: new Date() },
  });

  // Mark linked billing records as PAID
  await prisma.billingRecord.updateMany({
    where: { invoiceId, status: 'UNPAID' },
    data: { status: 'PAID' },
  });

  await prisma.operationLog.create({
    data: {
      userId: 'system',
      username: 'system',
      action: 'INVOICE_PAID',
      details: `Invoice ${invoice.invoiceNo} marked as paid`,
    },
  });

  return { success: true };
}

// ──────────────────────────────────────────────
// Void invoice
// ──────────────────────────────────────────────

export async function voidInvoice(invoiceId: string): Promise<{ success: boolean; error?: string }> {
  const hasDb = await checkDbConnection();
  if (!hasDb) return { success: false, error: 'Database not available' };

  const prisma = getPrisma();
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { success: false, error: 'Invoice not found' };

  if (invoice.status === 'VOID') return { success: false, error: 'Invoice is already voided' };

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'VOID', voidedAt: new Date() },
  });

  // Unlink billing records (they stay UNPAID, but no longer tied to voided invoice)
  await prisma.billingRecord.updateMany({
    where: { invoiceId },
    data: { invoiceId: null },
  });

  await prisma.operationLog.create({
    data: {
      userId: 'system',
      username: 'system',
      action: 'INVOICE_VOIDED',
      details: `Invoice ${invoice.invoiceNo} voided`,
    },
  });

  return { success: true };
}

// ──────────────────────────────────────────────
// Recalculate invoice from linked billing records
// ──────────────────────────────────────────────

export async function recalculateInvoice(invoiceId: string): Promise<{ success: boolean; error?: string }> {
  const hasDb = await checkDbConnection();
  if (!hasDb) return { success: false, error: 'Database not available' };

  const prisma = getPrisma();
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { success: false, error: 'Invoice not found' };
  if (invoice.status === 'PAID') return { success: false, error: 'Cannot recalculate a paid invoice' };
  if (invoice.status === 'VOID') return { success: false, error: 'Cannot recalculate a voided invoice' };

  const records = await prisma.billingRecord.findMany({
    where: { invoiceId, status: { not: 'VOID' } },
  });
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { amount: totalAmount },
  });

  await prisma.operationLog.create({
    data: {
      userId: 'system',
      username: 'system',
      action: 'INVOICE_RECALCULATED',
      details: `Invoice ${invoice.invoiceNo} recalculated: $${totalAmount}`,
    },
  });

  return { success: true };
}
