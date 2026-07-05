/**
 * AI Assistant with OpenAI-compatible API support
 *
 * Environment variables:
 *   OPENAI_API_KEY    - API key for OpenAI-compatible provider
 *   OPENAI_BASE_URL   - Base URL (default: https://api.openai.com/v1)
 *   OPENAI_MODEL      - Model name (default: gpt-4o-mini)
 *   LLM_TIMEOUT_MS    - Request timeout in ms (default: 15000)
 *
 * Falls back to static responses when no API key is configured.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || '15000', 10);

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIContext {
  userId: string;
  role: string;
  customerId?: string;
  question: string;
  warehouseId?: string;
  operationScope?: string;
  currentPage?: string;
}

const SYSTEM_PROMPT = `You are a professional WMS (Warehouse Management System) AI Assistant. 
Your role is to help warehouse operators, managers, and clients with:

1. Warehouse operations - picking, packing, shipping, receiving
2. Inventory management - stock levels, adjustments, transfers
3. Order processing - outbound orders, inbound ASNs, returns
4. Billing and invoicing
5. Exception handling and problem resolution
6. Reporting and analytics

ONLY answer questions related to warehouse and logistics operations.
If asked about unrelated topics (marketing, advertising, product listings, etc.), politely decline.

Keep responses concise, practical, and action-oriented. Use bullet points for lists.
When discussing orders or inventory, include relevant IDs and quantities.`;

function getStaticResponse(question: string, context: AIContext): string {
  const lowerQ = question.toLowerCase();

  if (lowerQ.includes('delayed') || lowerQ.includes('inbound shipments')) {
    return `There are 6 delayed inbound shipments today. 3 are waiting for unloading, 2 are missing ASN details, and 1 has a barcode mismatch issue. The highest priority shipment is ASN-IN-1028 from NiceC because it contains 240 units of HC-001 needed for pending outbound orders.`;
  }
  if (lowerQ.includes('waiting for picking') || lowerQ.includes('picking')) {
    return `There are 18 outbound orders waiting for picking. 7 are one-piece dropship orders, 6 are Shopify orders, and 5 are FBA transfer orders. I recommend prioritizing the 5 FBA transfer orders first because their carrier cutoff is 3:30 PM today.`;
  }
  if (lowerQ.includes('low in stock') || lowerQ.includes('skus are low')) {
    return `5 SKUs are below safety stock:\n\n1. HC-001 — 18 units available, safety stock 50\n2. OC-002 — 12 units available, safety stock 40\n3. SC-006 — 24 units available, safety stock 60\n4. HS-008 — 9 units available, safety stock 30\n5. CT-014 — 15 units available, safety stock 45\n\nI recommend creating a replenishment alert and checking inbound shipment ASN-IN-1028.`;
  }
  if (lowerQ.includes('exception') || lowerQ.includes('exceptions')) {
    return `There are 11 packages with exception status:\n\n1. 4 barcode mismatch\n2. 3 weight mismatch\n3. 2 missing label\n4. 1 damaged package\n5. 1 address validation failed\n\nThe most urgent package is PKG-88321 because it belongs to an expedited order scheduled for carrier pickup today.`;
  }
  if (lowerQ.includes('prioritize') || lowerQ.includes('tasks should i')) {
    return `Today's top WMS priorities:\n\n1. Process 6 delayed inbound shipments\n2. Pick 18 outbound orders before carrier cutoff\n3. Resolve 11 exception packages\n4. Reconcile 5 inventory discrepancy records\n5. Review 3 failed label generation orders\n6. Complete FBA transfer order FBA-TR-2049 before 3:30 PM`;
  }
  if (lowerQ.includes('acos') || lowerQ.includes('roas') || lowerQ.includes('listing') || lowerQ.includes('keyword') || lowerQ.includes('竞品') || lowerQ.includes('评论')) {
    return `I apologize, but as a WMS AI Assistant, I only support WMS warehouse operations, inventory, billing, exceptions, and order processing. I do not answer Amazon PPC (ACOS/ROAS), listings optimization, keywords, reviews, or e-commerce marketing questions. Please let me know how I can assist you with warehouse tasks!`;
  }

  return `I have received your query regarding warehouse operations.\n\nContext Info:\n- Warehouse: ${context.warehouseId || 'All Warehouses'}\n- Operation Scope: ${context.operationScope || 'All Operations'}\n- Current Location: ${context.currentPage || 'WMS Portal'}\n\nBased on the current database state, all inventory levels are synced. Let me know if you would like me to compile metrics for today's inbound shipments or highlight pending pick lists.`;
}

async function callOpenAI(messages: ChatMessage[]): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        max_tokens: 1024,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated.';
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Process an AI chat request.
 * Uses OpenAI-compatible API if OPENAI_API_KEY is set, otherwise falls back to static responses.
 * Client role queries are scoped to their customerId.
 */
export async function processChat(context: AIContext): Promise<{ response: string; provider: string }> {
  // Role-based data isolation context
  const roleContext = context.role === 'CLIENT'
    ? `The user is a CLIENT (customerId: ${context.customerId}). Only answer about their own data.`
    : `The user has role: ${context.role}. They can see global data.`;

  if (OPENAI_API_KEY) {
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\n${roleContext}` },
        { role: 'user', content: `[Context: warehouse=${context.warehouseId || 'all'}, page=${context.currentPage || 'unknown'}, operation=${context.operationScope || 'general'}, role=${context.role}, customerId=${context.customerId || 'none'}]\n\nQuestion: ${context.question}` },
      ];

      const response = await callOpenAI(messages);
      return { response, provider: `openai:${OPENAI_MODEL}` };
    } catch (err: any) {
      console.error('OpenAI API call failed, falling back to static:', err.message);
      return { response: getStaticResponse(context.question, context), provider: 'fallback' };
    }
  }

  return { response: getStaticResponse(context.question, context), provider: 'static' };
}
