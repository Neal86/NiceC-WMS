import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getPrisma, checkDbConnection } from './server/prisma';
import { generalRateLimit, authRateLimit, corsMiddleware, requestIdMiddleware, errorHandler, notFoundHandler, helmetConfig, compressionMiddleware, requireAuth, getCurrentUser } from './server/middleware';
import { initWebSocket } from './server/websocket';
import { registerAuthRoutes } from './server/modules/auth';
import { registerAdminRoutes } from './server/modules/admin';
import { registerCustomerRoutes } from './server/modules/customers';
import { registerWarehouseRoutes } from './server/modules/warehouses';
import { registerCarrierRoutes } from './server/modules/carriers';
import { registerProductRoutes, registerSkuRoutes } from './server/modules/products';
import { registerInventoryRoutes } from './server/modules/inventory';
import { registerInboundRoutes } from './server/modules/inbound';
import { registerOutboundRoutes } from './server/modules/outbound';
import { registerWarehouseOperationsRoutes } from './server/modules/warehouse-operations';
import { registerBillingRoutes } from './server/modules/billing';
import { registerIntegrationRoutes } from './server/modules/integration';
import { registerSystemSettingsRoutes } from './server/modules/system-settings';
import { registerAIContextRoutes } from './server/modules/ai-context';
import { registerFeedbackRoutes } from './server/modules/feedback';
import { registerUserRoutes } from './server/modules/users';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'NiceC-WMS-Secret-Token-Key-2026!');
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required in production.');
  process.exit(1);
}

const PORT = Number(process.env.PORT || 3100);
const WS_PORT = Number(process.env.WS_PORT || 24679);

async function startServer() {
  const app = express();

  app.use(compressionMiddleware());
  app.use(helmetConfig());
  app.use(corsMiddleware());
  app.use(requestIdMiddleware());
  app.use(express.json({ limit: '10mb' }));
  app.use(generalRateLimit());
  app.use('/api/auth/login', authRateLimit());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', pid: process.pid, uptime: process.uptime(), memory: process.memoryUsage().rss });
  });

  app.get('/api/health/db', async (req, res) => {
    const healthy = await checkDbConnection();
    const prismaAvailable = !!(globalThis as any).__PRISMA_LOADED;
    res.json({ status: healthy ? 'ok' : 'error', prisma: prismaAvailable, db: healthy });
  });

  app.get('/api/operation-logs', requireAuth, async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const logs = await prisma.operationLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
        return res.json(logs);
      } catch (err) { console.error('Prisma operation-logs error:', err); }
    }
    res.json([]);
  });

  const apiRouter = express.Router();
  registerAuthRoutes(apiRouter);
  registerAdminRoutes(apiRouter);
  registerCustomerRoutes(apiRouter);
  registerWarehouseRoutes(apiRouter);
  registerCarrierRoutes(apiRouter);
  registerProductRoutes(apiRouter);
  registerSkuRoutes(apiRouter);
  registerInventoryRoutes(apiRouter);
  registerInboundRoutes(apiRouter);
  registerOutboundRoutes(apiRouter);
  registerWarehouseOperationsRoutes(apiRouter);
  registerBillingRoutes(apiRouter);
  registerIntegrationRoutes(apiRouter);
  registerSystemSettingsRoutes(apiRouter);
  registerAIContextRoutes(apiRouter);
  registerFeedbackRoutes(apiRouter);
  registerUserRoutes(apiRouter);
  app.use('/api', apiRouter);

  app.get('/api/docs', requireAuth, async (req: any, res) => {
    res.json({
      openapi: '3.0.0',
      info: { title: 'NiceC WMS API', version: '1.0.0', description: 'Warehouse Management System REST API' },
      servers: [{ url: '/api', description: 'API Base URL' }],
      security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
      components: { securitySchemes: { BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' } } },
      paths: {
        '/auth/login': { post: { summary: 'Login', tags: ['Auth'], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } } } } } }, responses: { '200': { description: 'Login successful' }, '401': { description: 'Invalid credentials' } } } },
        '/outbound-orders': {
          get: { summary: 'List outbound orders', tags: ['Outbound'], security: [{ BearerAuth: [] }], parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'pageSize', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: 'Orders list' } } },
          post: { summary: 'Create outbound order', tags: ['Outbound'], security: [{ BearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { logisticsChannelId: { type: 'string' }, carrierId: { type: 'string' }, recipient: { type: 'string' }, items: { type: 'array', items: { type: 'object', properties: { skuId: { type: 'string' }, qty: { type: 'integer' } } } } } } } } }, responses: { '201': { description: 'Order created' } } }
        },
        '/outbound-orders/{id}': { get: { summary: 'Get outbound order by ID', tags: ['Outbound'], security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Order detail' } } }, put: { summary: 'Update outbound order', tags: ['Outbound'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Order updated' } } }, delete: { summary: 'Cancel outbound order', tags: ['Outbound'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Order cancelled' } } } },
        '/outbound-orders/{id}/cancel': { post: { summary: 'Cancel order and release stock', tags: ['Outbound'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Order cancelled' } } } },
        '/outbound-orders/{id}/ship': { post: { summary: 'Confirm shipment and deduct stock', tags: ['Outbound'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Shipped' } } } },
        '/outbound-orders/import': { post: { summary: 'Bulk import outbound orders from CSV/XLSX', tags: ['Outbound'], security: [{ BearerAuth: [] }], requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } } }, responses: { '200': { description: 'Import result' } } } },
        '/inventory': { get: { summary: 'List inventory', tags: ['Inventory'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Inventory list' } } } },
        '/inventory/adjust': { post: { summary: 'Adjust inventory', tags: ['Inventory'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Inventory adjusted' } } } },
        '/inventory/transfer': { post: { summary: 'Transfer inventory between warehouses', tags: ['Inventory'], security: [{ BearerAuth: [] }], responses: { '200': { description: 'Inventory transferred' } } } },
        '/inbound-orders': { get: { summary: 'List inbound orders', tags: ['Inbound'], security: [{ BearerAuth: [] }] }, post: { summary: 'Create inbound ASN', tags: ['Inbound'], security: [{ BearerAuth: [] }] } },
        '/inbound-orders/{id}/receive': { post: { summary: 'Receive inbound shipment', tags: ['Inbound'], security: [{ BearerAuth: [] }] } },
        '/return-orders': { get: { summary: 'List return orders', tags: ['Returns'], security: [{ BearerAuth: [] }] }, post: { summary: 'Create return order', tags: ['Returns'], security: [{ BearerAuth: [] }] } },
        '/return-orders/{id}/receive': { post: { summary: 'Receive return', tags: ['Returns'], security: [{ BearerAuth: [] }] } },
        '/return-orders/{id}/inspect': { post: { summary: 'Inspect return items', tags: ['Returns'], security: [{ BearerAuth: [] }] } },
        '/return-orders/{id}/restock': { post: { summary: 'Restock return items', tags: ['Returns'], security: [{ BearerAuth: [] }] } },
        '/billing-rules': { get: { summary: 'List billing rules', tags: ['Billing'] }, post: { summary: 'Create billing rule', tags: ['Billing'], security: [{ BearerAuth: [] }] } },
        '/billing-records': { get: { summary: 'List billing records', tags: ['Billing'] } },
        '/invoices': { get: { summary: 'List invoices', tags: ['Billing'] } },
        '/api-keys': { get: { summary: 'List API keys', tags: ['Integration'], security: [{ BearerAuth: [] }] }, post: { summary: 'Create API key', tags: ['Integration'], security: [{ BearerAuth: [] }] } },
        '/webhooks': { get: { summary: 'List webhooks', tags: ['Integration'], security: [{ BearerAuth: [] }] }, post: { summary: 'Create webhook', tags: ['Integration'], security: [{ BearerAuth: [] }] } },
        '/store-connections': { get: { summary: 'List store connections', tags: ['Integration'], security: [{ BearerAuth: [] }] }, post: { summary: 'Create store connection', tags: ['Integration'], security: [{ BearerAuth: [] }] } },
        '/health': { get: { summary: 'Health check', tags: ['System'] } },
        '/health/db': { get: { summary: 'Database health check', tags: ['System'] } },
      },
      'x-webhook-events': [
        { event: 'order.created', description: 'Outbound order created' },
        { event: 'order.updated', description: 'Outbound order updated' },
        { event: 'order.shipped', description: 'Outbound order shipped' },
        { event: 'inventory.updated', description: 'Inventory level changed' },
        { event: 'inbound.completed', description: 'Inbound order completed' },
        { event: 'return.completed', description: 'Return order completed' },
      ],
      'x-error-codes': [
        { code: 'UNAUTHORIZED', description: 'Missing or invalid authentication' },
        { code: 'FORBIDDEN', description: 'Insufficient permissions' },
        { code: 'VALIDATION_ERROR', description: 'Request body validation failed' },
        { code: 'NOT_FOUND', description: 'Resource not found' },
        { code: 'INSUFFICIENT_STOCK', description: 'Not enough available inventory' },
        { code: 'RATE_LIMITED', description: 'Too many requests' },
        { code: 'INTERNAL_ERROR', description: 'Internal server error' },
      ],
      'x-curl-examples': {
        login: 'curl -X POST /api/auth/login -H "Content-Type: application/json" -d \'{"username":"client@nicecwms.com","password":"client123456"}\'',
        createOrder: 'curl -X POST /api/outbound-orders -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d \'{"logisticsChannelId":"chan_usps_ground","carrierId":"carr_usps","recipient":"John Doe (NY, USA)","items":[{"skuId":"sku_1","qty":1}]}\'',
        getOrders: 'curl -H "Authorization: Bearer <token>" /api/outbound-orders?status=PENDING&page=1&pageSize=10',
        getInventory: 'curl -H "Authorization: Bearer <token>" /api/inventory',
        getSkus: 'curl -H "Authorization: Bearer <token>" /api/skus',
        createAsn: 'curl -X POST /api/inbound-orders -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d \'{"warehouseId":"wh_1","items":[{"skuId":"sku_1","skuCode":"TS-V-NA-4","qtyExpected":100}]}\'',
        apiKey: 'curl -H "X-API-Key: nwc_<your_api_key>" /api/outbound-orders?page=1',
        webhookSignature: 'HMAC-SHA256(webhook_secret, request_body) for webhook payload verification',
      },
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true, hmr: process.env.DISABLE_HMR === 'true' ? false : { port: WS_PORT } }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`WMS Express Backend + Vite running on http://localhost:${PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}; shutting down gracefully...`);
    server.close(() => { console.log('HTTP server closed.'); process.exit(0); });
    setTimeout(() => { console.error('Forced exit after shutdown timeout.'); process.exit(1); }, 10_000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try { initWebSocket(server); console.log('WebSocket server initialized on /ws'); }
  catch (err) { console.warn('WebSocket initialization skipped (non-critical):', err); }
}

process.on('uncaughtException', (err) => { console.error('[FATAL] Uncaught Exception:', err); setTimeout(() => process.exit(1), 1000); });
process.on('unhandledRejection', (reason) => { console.error('[FATAL] Unhandled Rejection:', reason); setTimeout(() => process.exit(1), 1000); });

startServer().catch((err) => { console.error('Error starting full-stack WMS server:', err); process.exit(1); });
