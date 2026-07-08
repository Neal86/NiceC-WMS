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

function getEcommerceDeclineResponse(question: string): string | null {
  const lowerQ = question.toLowerCase();
  if (lowerQ.includes('acos') || lowerQ.includes('roas') || lowerQ.includes('listing') || lowerQ.includes('keyword') || lowerQ.includes('竞品') || lowerQ.includes('评论')) {
    return `I apologize, but as a WMS AI Assistant, I only support WMS warehouse operations, inventory, billing, exceptions, and order processing. I do not answer Amazon PPC (ACOS/ROAS), listings optimization, keywords, reviews, or e-commerce marketing questions. Please let me know how I can assist you with warehouse tasks!`;
  }
  return null;
}

async function buildDbSummary(context: AIContext): Promise<string> {
  try {
    const { buildAiContextSummary } = await import('./modules/ai-context');
    const user = {
      role: context.role,
      customerId: context.customerId,
      warehouseId: context.warehouseId,
    };
    const result = await buildAiContextSummary(user, context.question);
    return result.summary;
  } catch (err: any) {
    return `Unable to load warehouse data: ${err.message}`;
  }
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
      console.error('OpenAI API call failed, falling back to DB summary:', err.message);
      const decline = getEcommerceDeclineResponse(context.question);
      if (decline) return { response: decline, provider: 'fallback' };
      const summary = await buildDbSummary(context);
      return { response: summary, provider: 'fallback-db-summary' };
    }
  }

  // No OPENAI_API_KEY — use database-based summary
  const decline = getEcommerceDeclineResponse(context.question);
  if (decline) return { response: decline, provider: 'static' };
  const summary = await buildDbSummary(context);
  return { response: summary, provider: 'fallback-db-summary' };
}
