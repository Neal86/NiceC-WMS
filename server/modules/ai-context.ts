/**
 * AI Context Module — Builds real WMS data summaries from the database
 *
 * Provides role-scoped summaries for:
 *   - Admin: global warehouse operations
 *   - Client: own customer data only
 *   - Warehouse: own warehouse data only
 */

import { Router } from 'express';
import { getPrisma, checkDbConnection } from '../prisma';
import { requireAuth } from '../middleware';
import { processChat } from '../ai-assistant';

export function registerAIContextRoutes(router: Router): void {
  const chatHistories: Record<string, Array<{ role: string; content: string }>> = {};

  router.get('/wms-ai-assistant/history', requireAuth, (req: any, res) => {
    const userId = req.user?.id || 'anonymous';
    res.json(chatHistories[userId] || []);
  });

  router.delete('/wms-ai-assistant/history', requireAuth, (req: any, res) => {
    const userId = req.user?.id || 'anonymous';
    chatHistories[userId] = [];
    res.json({ status: 'success', message: 'Chat history cleared' });
  });

  router.post('/wms-ai-assistant/chat', requireAuth, async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: 'Message is required' });
      const userId = req.user?.id || 'anonymous';
      if (!chatHistories[userId]) chatHistories[userId] = [];
      chatHistories[userId].push({ role: 'user', content: message });
      const result = await processChat({
        userId: req.user?.id || '',
        role: req.user?.role || '',
        customerId: req.user?.customerId,
        question: message,
        warehouseId: req.user?.warehouseId,
      });
      chatHistories[userId].push({ role: 'assistant', content: result.response });
      return res.json({ reply: result.response, provider: result.provider, history: chatHistories[userId] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface AIContextSummary {
  todayInboundCount: number;
  todayOutboundPendingCount: number;
  pickingCount: number;
  reviewCount: number;
  lowStockSKUs: Array<{ skuCode: string; name: string; availableQty: number; safetyStock: number }>;
  exceptionPackages: number;
  overdueInvoices: number;
  unpaidInvoices: number;
  inboundReceivingProgress: string;
  provider: string;
}

// ──────────────────────────────────────────────
// Build AI context summary from real database data
// ──────────────────────────────────────────────

export async function buildAiContextSummary(user: any, question: string): Promise<{
  summary: string;
  provider: string;
}> {
  const hasDb = await checkDbConnection();
  if (!hasDb) {
    return {
      summary: 'Database is not currently connected. Some features may be limited.',
      provider: 'db-unavailable',
    };
  }

  const prisma = getPrisma();
  const role = (user?.role || '').toUpperCase();
  const customerId = user?.customerId || null;
  const warehouseId = user?.warehouseId || null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  try {
    // Build where clauses based on role
    const customerWhere = role === 'CLIENT' && customerId ? { customerId } : {};
    const warehouseWhere = role !== 'ADMIN' && role !== 'SUPER_ADMIN' && warehouseId ? { warehouseId } : {};

    // ── Today's inbound count ──
    const todayInboundCount = await prisma.inboundOrder.count({
      where: {
        ...customerWhere,
        ...(role !== 'ADMIN' && role !== 'SUPER_ADMIN' ? warehouseWhere : {}),
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    });

    // ── Outbound orders pending (PENDING status) ──
    const outboundPendingFilter: any = { status: 'PENDING' };
    if (role === 'CLIENT' && customerId) outboundPendingFilter.customerId = customerId;
    const todayOutboundPendingCount = await prisma.outboundOrder.count({
      where: {
        ...outboundPendingFilter,
        createdTime: { gte: todayStart, lte: todayEnd },
      },
    });

    // ── Picking count ──
    const pickingFilter: any = { status: 'PICKING' };
    if (role === 'CLIENT' && customerId) pickingFilter.customerId = customerId;
    const pickingCount = await prisma.outboundOrder.count({ where: pickingFilter });

    // ── Review count ──
    const reviewCount = await prisma.reviewTask.count({
      where: { status: 'PENDING' },
    });

    // ── Low stock SKUs (availableQty < 20 as threshold) ──
    const invWhere: any = { availableQty: { lt: 20 } };
    if (role === 'CLIENT' && customerId) invWhere.customerId = customerId;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && warehouseId) invWhere.warehouseId = warehouseId;
    const lowStockInventory = await prisma.inventory.findMany({
      where: invWhere,
      select: { skuCode: true, availableQty: true },
      orderBy: { availableQty: 'asc' },
      take: 10,
    });

    // ── Exception packages ──
    const exceptionFilter: any = {};
    if (role === 'CLIENT' && customerId) exceptionFilter.customerId = customerId;
    const exceptionCount = await prisma.exceptionCase.count({
      where: { ...exceptionFilter, status: 'PENDING' },
    });

    // ── Billing overview ──
    const billingFilter: any = {};
    if (role === 'CLIENT' && customerId) billingFilter.customerId = customerId;
    const overdueInvoices = await prisma.invoice.count({
      where: {
        ...billingFilter,
        status: 'OVERDUE',
      },
    });
    const unpaidInvoices = await prisma.invoice.count({
      where: {
        ...billingFilter,
        status: 'UNPAID',
      },
    });

    // ── Inbound receiving progress ──
    const inboundInProgress = await prisma.inboundOrder.count({
      where: {
        ...customerWhere,
        status: { in: ['SUBMITTED', 'RECEIVING'] },
      },
    });

    // Build summary text
    const parts: string[] = [];
    parts.push(`📦 **Today's Inbound**: ${todayInboundCount} ASN(s) created today.`);
    parts.push(`📤 **Pending Outbound**: ${todayOutboundPendingCount} orders waiting for processing.`);
    parts.push(`🔍 **Picking**: ${pickingCount} orders in picking.`);
    parts.push(`✅ **Review**: ${reviewCount} tasks pending review.`);

    if (lowStockInventory.length > 0) {
      parts.push(`⚠️ **Low Stock SKUs** (${lowStockInventory.length}):`);
      for (const sku of lowStockInventory.slice(0, 5)) {
        parts.push(`  - ${sku.skuCode}: ${sku.availableQty} units available`);
      }
      if (lowStockInventory.length > 5) {
        parts.push(`  - ... and ${lowStockInventory.length - 5} more`);
      }
    }

    parts.push(`❗ **Exceptions**: ${exceptionCount} unresolved exception cases.`);
    parts.push(`💰 **Billing**: ${unpaidInvoices} unpaid, ${overdueInvoices} overdue invoice(s).`);
    parts.push(`📋 **Inbound Receiving**: ${inboundInProgress} ASN(s) in receiving progress.`);

    const summary = parts.join('\n');

    return {
      summary,
      provider: 'db-summary',
    };
  } catch (err: any) {
    return {
      summary: `Unable to generate warehouse summary: ${err.message}`,
      provider: 'db-error',
    };
  }
}
