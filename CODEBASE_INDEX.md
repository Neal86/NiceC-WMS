# NiceC-WMS Codebase Index

> Last updated: 2026-07-05
> Branch: `fix/complete-wms-functions`

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 4, Lucide React, Motion
- **Backend:** Express 4, TypeScript (single-file via `server.ts`)
- **Database:** PostgreSQL + Prisma ORM 5.22.0
- **Auth:** JWT (jsonwebtoken), bcryptjs
- **Validation:** Zod
- **HTTP Client:** axios
- **Build:** Vite (frontend), esbuild (backend)

## Directory Structure

### `/` Root
| File | Purpose |
|------|---------|
| `server.ts` | Single-file Express server: ALL routes, middleware, business logic (~4950 lines) |
| `server-bootstrap.ts` | Server entry point (loads env, starts server) |
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript config |
| `vite.config.ts` | Vite config |
| `index.html` | HTML entry |
| `Dockerfile` | Docker build |
| `docker-compose.yml` | Docker Compose |
| `entrypoint.sh` | Docker entrypoint |

### `/tests/` - Unit Tests
| File | Purpose |
|------|---------|
| `tests/permissions.test.ts` | RBAC, role normalization, customerId isolation tests |
| `tests/auth.test.ts` | Login validation, demo guard, token payload, password hashing |
| `tests/inventory.test.ts` | Stock reservation/release/ship/return restock/adjustment |
| `tests/billing.test.ts` | Rule CRUD, record generation, invoice generation, client isolation |
| `tests/api-key-masking.test.ts` | Key hashing, masking, webhook secret security |

### `/server/` - Backend Helpers
| File | Purpose |
|------|---------|
| `server/permissions.ts` | RBAC: Permission type, RolePermissions map, hasPermission(), requirePermission() |
| `server/middleware.ts` | Express middleware: helmet, compression, CORS, rate limit, error handler, requestId |
| `server/validation.ts` | Zod schemas for all request bodies |
| `server/db.ts` | JSON file fallback DB (for dev without PostgreSQL) |
| `server/prisma.ts` | Prisma client singleton with connection check |
| `server/websocket.ts` | WebSocket server: JWT auth, room-based (admin/warehouse/client:{id}) broadcasting |
| `server/ai-assistant.ts` | OpenAI-compatible AI assistant: OPENAI_API_KEY, fallback to static responses |
| `server/adapters/CarrierAdapter.ts` | Mock carrier integration (FedEx/UPS/USPS) |
| `server/adapters/StoreAdapter.ts` | Mock store integration (Amazon/Shopify/Walmart) |
| `server/adapters/StorageAdapter.ts` | Mock storage/3PL integration |
| `server/adapters/index.ts` | Adapter exports |

### `/prisma/` - Database Schema
| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Full schema with 30+ models |
| `prisma/seed.ts` | Seed data |
| `prisma/migrations/` | Existing migrations |

### `/src/` - Frontend
| File | Purpose |
|------|---------|
| `src/api.ts` | 28 API client modules (axios-based) |
| `src/types.ts` | TypeScript interfaces |
| `src/App.tsx` | Root app component with routing |
| `src/main.tsx` | React entry point |
| `src/index.css` | Tailwind CSS |

### `/src/components/` - UI Components

| Component | Module | Purpose |
|-----------|--------|---------|
| `Login.tsx` | Auth | Login form |
| `Dashboard.tsx` | Dashboard | Stats overview |
| `AdminPanel.tsx` | Admin | Admin dashboard with tabs |
| `WarehousePortal.tsx` | Warehouse | Warehouse operations |
| `ClientPortal.tsx` | Client | Client self-service |
| `Header.tsx` | Layout | Top navigation |
| `Sidebar.tsx` | Layout | Side navigation |
| `OrderTable.tsx` | Outbound | Order list table |
| `OrderDetailModal.tsx` | Outbound | Order detail view |
| `OrderFormModal.tsx` | Outbound | Create/edit order form |
| `FilterSection.tsx` | Outbound | Filter controls |
| `WavesManager.tsx` | Waves | Wave management |
| `BulkImportModal.tsx` | Import | Bulk order import |
| `LabelManager.tsx` | Labels | Label printing |
| `InboundManager.tsx` | Inbound | Inbound order management |
| `InboundClaimManager.tsx` | Inbound | Inbound claim handling |
| `PutawayManager.tsx` | Putaway | Putaway task management |
| `InventoryManager.tsx` | Inventory | Inventory view/adjust/transfer |
| `WarehouseManager.tsx` | Admin | Warehouse CRUD |
| `SKUsManager.tsx` | SKU | SKU management |
| `CustomersManager.tsx` | Admin | Customer CRUD |
| `ChannelsManager.tsx` | Admin | Logistics channel management |
| `NewProductMaintenance.tsx` | Products | Product maintenance |
| `billing/` | Billing | Billing rules, records, invoices |
| `feedback/` | Feedback | User feedback widget |
| `integration/` | Integration | API keys, webhooks, store connections |
| `returns/` | Returns | Return order management |
| `wms-ai-assistant/` | AI | AI assistant chat widget |

## Database Models (Prisma)

### Core Business
- `User` - id, username, email, passwordHash, role (enum), customerId, warehouseId, status
- `Customer` - id, name, code (unique), contact, email
- `Warehouse` - id, name, code (unique), address

### Products & Inventory
- `Product` - id, name, sku, barcode, category, weight, volume, customerId
- `SKU` - id, code (unique), name, barcode, weight, customerId
- `Inventory` - id, customerId, warehouseId, skuId, skuCode, availableQty, reservedQty, damagedQty
- `InventoryTransaction` - id, type, direction, quantity, beforeQty, afterQty, referenceType, referenceId
- `InventoryReservation` - id, orderId, skuId, quantity, status
- `Location` - id, code (unique), warehouseId, zoneCode
- `InventoryLocation` - id, warehouseId, locationId, skuId, skuCode, availableQty

### Orders
- `OutboundOrder` - id, orderNo (unique), status (enum), customerId, logisticsChannelId, carrierId, waveId, items
- `OutboundOrderItem` - id, orderId, skuId, skuCode, qty
- `InboundOrder` - id, orderNo (unique), customerId, status, items
- `InboundOrderItem` - id, orderId, skuId, skuCode, qtyExpected, qtyReceived
- `ReturnOrder` - id, returnNo (unique), customerId, orderId, status, items
- `ReturnItem` - id, returnOrderId, skuId, skuCode, qtyExpected, qtyReceived, condition

### Warehouse Operations
- `Wave` - id, waveNo (unique), status, orderCount
- `PickTask` - id, taskNo (unique), waveId, orderId, skuId, quantity, status, operatorId
- `PutawayTask` - id, taskNo (unique), inboundOrderId, skuId, locationId, quantity, status
- `ReviewTask` - id, orderId, status
- `Package` - id, packageNo (unique), orderId, weight, length, width, height, trackingNo
- `RelabelOrder` - id, orderNo (unique), customerId, skuId, oldSkuCode, newSkuCode, quantity, status
- `WorkOrder` - id, orderNo (unique), customerId, type, description, status

### Logistics
- `Carrier` - id, name, code (unique)
- `LogisticsChannel` - id, name, code (unique), carrierId
- `Shipment` - id, orderId (unique), trackingNo (unique), cost
- `ShippingProvider` - id, name, code (unique), status

### Billing
- `BillingRule` - id, name, code (unique), type, rate
- `BillingRecord` - id, customerId, orderId, type, amount, currency, status
- `Invoice` - id, invoiceNo (unique), customerId, amount, status

### Integration
- `ApiKey` - id, customerId, key, status
- `WebhookEndpoint` - id, customerId, url, secret, status
- `WebhookEvent` - id, customerId, eventType, payload, status
- `StoreConnection` - id, customerId, platform, shopName, status

### Logging & Feedback
- `OperationLog` - id, userId, username, action, details, ipAddress
- `AuditLog` - id, userId, action, resource, resourceId, changes
- `ExceptionCase` - id, caseNo (unique), orderId, type, description, status
- `Feedback` - id, customerId, userId, type, title, description, status
- `FeedbackComment` - id, feedbackId, userId, comment

## API Modules (src/api.ts)
| Module | Key Methods |
|--------|-------------|
| `authApi` | login, logout, getCurrentUser, refreshCurrentUser |
| `outboundApi` | getOrders, getOrderById, createOrder, updateOrder, deleteOrder, cancelOrder, shipOrder, printLabel, markLabelPrinted, batchGenerateWave, batchPrintPickList, exportOrders, importOrders, bulkImport, getImportHistory |
| `metadataApi` | getCustomers, getCarriers, getLogisticsChannels, getProducts, getSkus, getWarehouses, getInventory |
| `waveApi` | getWaves, getWaveById, createWave, updateWave, deleteWave |
| `customerApi` | getCustomers, createCustomer, updateCustomer, deleteCustomer |
| `productApi` | getProducts, createProduct, updateProduct, deleteProduct |
| `skuApi` | getSkus, createSku, updateSku, deleteSku |
| `carrierApi` | getCarriers, createCarrier, updateCarrier, deleteCarrier |
| `channelApi` | getChannels, createChannel, updateChannel, deleteChannel |
| `warehouseApi` | getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse |
| `inventoryApi` | getInventory, updateInventory, transferInventory, adjustInventory |
| `dashboardApi` | getSummary, getOutboundTrend, getChannelDistribution |
| `logApi` | getOperationLogs |
| `userApi` | getUsers, getUser, createUser, updateUser, toggleUserStatus, resetPassword, deleteUser |
| `apiKeyApi` | getKeys, createKey, updateKey, deleteKey, testKey |
| `webhookApi` | getWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook |
| `storeConnectionApi` | getConnections, createConnection, updateConnection, deleteConnection, syncConnection |
| `returnApi` | getReturns, createReturn, getReturnById, updateReturn, receiveReturn, inspectReturn, restockReturn |
| `billingApi` | getRules, createRule, updateRule, deleteRule, getRecords, generateRecords, getInvoices, generateInvoice |
| `inboundApi` | getOrders, receive |
| `putawayApi` | getTasks, complete |
| `pickApi` | getTasks, complete |
| `reviewApi` | getTasks, complete |
| `exceptionApi` | getCases, resolve |
| `relabelApi` | getOrders, complete |
| `locationApi` | getLocations, create, adjust |

## RBAC Permissions (server/permissions.ts)
- **SUPER_ADMIN**: All permissions
- **ADMIN**: All permissions (same as SUPER_ADMIN)
- **WAREHOUSE_MANAGER**: Warehouse ops, no billing manage, no user manage
- **WAREHOUSE_OPERATOR**: Limited warehouse ops
- **CLIENT**: Own data only (SKU, inventory read, orders, billing read, api keys, webhooks, store connections)

## Completed Changes

### P0-1 (Done ✓)
- Removed duplicate `userApi` in `src/api.ts`
- Added missing `getUser` method
- Fixed `toggleUserStatus` to use PATCH HTTP method

### P0-2 (Done ✓)
Added backend routes:
- `GET /api/users/:id` - user detail
- `PATCH /api/users/:id/status` - enable/disable user
- `POST /api/users/:id/reset-password` - reset password
- `PUT /api/locations/:id` - update location
- `DELETE /api/locations/:id` - delete location
- `POST /api/inventory/adjust` - manual inventory adjustment
- `POST /api/inventory/transfer` - inventory transfer between warehouses
- `GET /api/inbound-orders/:id` - inbound order detail
- `PUT /api/inbound-orders/:id` - update inbound order
- `POST /api/inbound-orders/:id/putaway` - complete putaway
- `POST /api/outbound-orders/:id/pick` - start picking
- `POST /api/outbound-orders/:id/pack` - complete packing
- `POST /api/return-orders/:id/scrap` - scrap return items
- `POST /api/store-connections/:id/test` - test connection
- `POST /api/store-connections/:id/sync-orders` - sync orders
- `POST /api/store-connections/:id/sync-products` - sync products
- `POST /api/store-connections/:id/sync-inventory` - sync inventory
- `PUT /api/invoices/:id/status` - update invoice status
- `GET /api/outbound-orders/import-history` - import history
Removed duplicate `POST /api/outbound-orders/import` route
Updated `PUT /api/inventory/:id` to use `requireAuth` and Prisma

### P0-3 (Done ✓)
Added `requireRole` to sensitive routes:
- `/api/users` (all methods) → ADMIN, SUPER_ADMIN
- `/api/customers` (POST, PUT, DELETE) → ADMIN, SUPER_ADMIN
- `/api/warehouses` (POST, PUT) → ADMIN, SUPER_ADMIN, WAREHOUSE_MANAGER
- `/api/warehouses` (DELETE) → ADMIN, SUPER_ADMIN
- `/api/operation-logs` → CLIENT blocked (403)
- Billing routes already had role checks

### P0-4 (Done ✓)
- Fixed critical security bug: local user without matching hardcoded password no longer bypasses auth
- Added `ENABLE_DEMO_LOGIN` env variable (defaults to false in production)
- Production mode without `ENABLE_DEMO_LOGIN=true` blocks demo login
- All error responses use generic "Invalid credentials" (no info leakage)
- Login returns only safe user fields: id, name, email, role, customerId, warehouseId

### P0-5 (Done ✓)
- Return restock now reads returnOrder items and updates inventory
- RESTOCK items → increase `availableQty` + `RETURN_RESTOCK` transaction
- DAMAGED items → increase `damagedQty` + `RETURN_DAMAGED` transaction
- All inside Prisma `$transaction`
- OperationLog written for all return flow steps
- Status flow: PENDING → RECEIVED → INSPECTED → RESTOCKED

### P0-6 (Done ✓)
- Order state machine enforced:
  - `PENDING` → `/pick` → `PICKING`
  - `PICKING` → `/pack` → `REVIEWS`
  - `REVIEWS` → `/weigh-package` → `SHIPPING`
  - `SHIPPING` → `/ship` → `SHIPPED`
- Invalid state transitions return 400 with clear error message
- Weight validation (> 0) in weigh-package route

### P0-7 (Completed)
- User Management: full CRUD (create, toggle status, delete)
- Customer Management: full CRUD (added edit inline form + delete with confirm)
- Warehouse Management: full CRUD (added edit inline form + delete with confirm)
- All use real API calls via `customerApi`/`warehouseApi`/`userApi`

### P0-8 (Completed)
- BillingView: added rules management tab (CRUD) for Admin/Super Admin
- "Generate Records" and "Generate Invoice" buttons for Admin
- Rules tab: create/edit/delete with inline form
- Backend billing rules CRUD, records/invoices generate already existed

### P0-9 (Completed)
- API Key: bcrypt hash, raw key returned only on creation
- API Key list: masked (e.g. `nwc_ab****ef45`)
- Webhook secret: bcrypt hash, raw secret returned only on creation
- Webhook list: always shows `••••••••`
- IntegrationCenter: masked keys/secrets, raw shown only once with 30s timeout
- Store connection sync routes (test/sync-orders/sync-products/sync-inventory)

### P0-10 (Completed - Pending npm install)
- vitest config (`vitest.config.ts`)
- Unit tests: permissions, auth, inventory, billing, API key masking (5 test files)
- GitHub Actions CI (`.github/workflows/ci.yml`)
- package.json scripts: test:unit, test:api, test:e2e, test:all, prisma:migrate:deploy
- ⚠️ `npm install` blocked by Chinese characters in workspace path

### P1-1 (Completed)
- AI Assistant: OpenAI-compatible API (OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL, LLM_TIMEOUT_MS)
- Falls back to static responses when no API key configured
- Client data isolated by customerId, role context in system prompt
- API key never returned to frontend

### P1-2 (Completed)
- WebSocket server (`server/websocket.ts`) with JWT auth
- Rooms: admin, warehouse, client:{customerId}
- Events: order.status_changed, inventory.adjusted, return.received, billing.generated, feedback.created
- Client only sees own customerId events
- Non-blocking if WebSocket unavailable
- Notifications added to pick/pack/ship/cancel/inventory-adjust/billing-generate

### P1-3 (Completed)
- Adapter architecture (`server/adapters/`)
- CarrierAdapter, StoreAdapter, StorageAdapter (mock implementations)
- Routes: POST /api/adapters/carrier/ship|rates, /store/sync-*, /storage/allocate|report
- Integration Center delegates to adapters, no mock logic in pages
