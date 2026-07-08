# Development Status

> Last updated: 2026-07-05
> Branch: `fix/complete-wms-functions`
> Status: **All P0 tasks completed. P1 infrastructure completed.**

## Completion Matrix

| Task | Status | Notes |
|------|--------|-------|
| P0-1: Fix duplicate API exports | ✅ | `src/api.ts` deduplicated, added `getUser` |
| P0-2: Add 19 missing backend routes | ✅ | Users, locations, inventory, inbound, outbound, return, store connections |
| P0-3: RBAC permission enforcement | ✅ | `requireRole()` on all sensitive routes |
| P0-4: Login security fix | ✅ | `ENABLE_DEMO_LOGIN` guard, generic error messages |
| P0-5: Return restock real inventory update | ✅ | Prisma `$transaction` with inventory transactions |
| P0-6: Outbound state machine | ✅ | Invalid transitions return 400 |
| P0-7: Admin CRUD complete | ✅ | User/Customer/Warehouse full CRUD + persistence |
| P0-8: Billing module closure | ✅ | Rules CRUD UI, generate records/invoices buttons |
| P0-9: API Key/Webhook security | ✅ | bcrypt hashing, masking, raw key only on creation |
| P0-10: Tests + CI | ✅ | vitest config, 5 test files, GitHub Actions, scripts |
| P1-1: AI Assistant OpenAI | ✅ | OPENAI_API_KEY/BASE_URL/MODEL/TIMEOUT support |
| P1-2: WebSocket notifications | ✅ | JWT auth, room-based, 5 event types |
| P1-3: Adapter architecture | ✅ | Carrier/Store/Storage adapters (mock) |

## Pending Items

### Critical
- `npm install` blocked by Chinese characters in workspace path (`我的云端硬盘`)
  - Workaround: clone/pull to a path without non-ASCII characters, run `npm install` there
  - Then `npm run test:unit`, `npm run build`, `npm run test:all`

### Would Be Nice
- Integration Center role-based access control (frontend)
- Store connection `apiToken` masking in backend
- BillingRule model field expansion (customerId, warehouseId, unit, minCharge, isActive)
- Invoice status enum with UNPAID/PAID/VOID
- Warehouse operator can view own warehouse data only

## Test Results (Expected)

Once dependencies are installed, verify:
```
npm run test:unit    → 5 test files, all passing
npm run test:api     → Smoke test script
npm run test:e2e     → Full function check
npx prisma validate  → Schema valid
npm run build        → Builds without errors
```

## File Change Summary

### Modified Files
| File | Changes |
|------|---------|
| `server.ts` | + API key/webhook hashing, masking; + WebSocket notifications; + Adapter routes; + AI Assistant OpenAI integration; ~4960 lines |
| `src/components/AdminPanel.tsx` | + Customer/warehouse edit forms, delete buttons |
| `src/components/billing/BillingView.tsx` | + Rules tab CRUD, generate records/invoices buttons |
| `src/components/integration/IntegrationCenter.tsx` | + API key masking, webhook secret masking, createdKey notification |
| `package.json` | + ws, vitest deps; + test scripts |
| `.env.example` | + OPENAI_BASE_URL, OPENAI_MODEL, LLM_TIMEOUT_MS |

### New Files
| File | Purpose |
|------|---------|
| `CODEBASE_INDEX.md` | Codebase index |
| `DEVELOPMENT_STATUS.md` | This file |
| `tests/permissions.test.ts` | Permission unit tests |
| `tests/auth.test.ts` | Auth unit tests |
| `tests/inventory.test.ts` | Inventory unit tests |
| `tests/billing.test.ts` | Billing unit tests |
| `tests/api-key-masking.test.ts` | API key security tests |
| `vitest.config.ts` | Vitest configuration |
| `.github/workflows/ci.yml` | GitHub Actions CI |
| `server/websocket.ts` | WebSocket server |
| `server/ai-assistant.ts` | OpenAI-compatible AI assistant |
| `server/adapters/index.ts` | Adapter exports |
| `server/adapters/CarrierAdapter.ts` | Mock carrier adapter |
| `server/adapters/StoreAdapter.ts` | Mock store adapter |
| `server/adapters/StorageAdapter.ts` | Mock storage adapter |

### API Changes
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/adapters/carrier/ship` | POST | Create carrier shipment (mock) |
| `/api/adapters/carrier/rates` | POST | Get carrier rates (mock) |
| `/api/adapters/store/sync-orders` | POST | Sync store orders (mock) |
| `/api/adapters/store/sync-products` | POST | Sync store products (mock) |
| `/api/adapters/store/sync-inventory` | POST | Sync store inventory (mock) |
| `/api/adapters/storage/allocate` | POST | Allocate storage slot (mock) |
| `/api/adapters/storage/report` | POST | Get utilization report (mock) |
| `/ws` | WS | WebSocket with JWT auth |

### WebSocket Events
| Event | Trigger | Target Rooms |
|-------|---------|--------------|
| `order.status_changed` | Pick/Pack/Ship/Cancel | admin, warehouse, client:{customerId} |
| `inventory.adjusted` | Inventory adjust | admin, warehouse, client:{customerId} |
| `return.received` | Return receive | admin, warehouse, client:{customerId} |
| `billing.generated` | Generate records/invoices | admin, client:{customerId} |
| `feedback.created` | Client AI question | admin, warehouse |
