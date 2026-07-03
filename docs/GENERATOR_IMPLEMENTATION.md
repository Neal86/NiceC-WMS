# WMS Generator Implementation

Branch: `fix/complete-wms-functions`

Implemented:

- `src/lib/wmsGenerator.ts`
  - Normalizes product/SKU data.
  - Creates default generation settings from customers, carriers, and channels.
  - Generates outbound order payloads compatible with the existing `/api/outbound-orders` API.
  - Supports scenario selection, item count range, quantity range, status, label status, and fallback products.

Next integration files:

- `src/components/GeneratorManager.tsx`
- `src/components/Sidebar.tsx`
- `src/App.tsx`

The intended UI behavior:

1. Open sidebar item `生成器`.
2. Select count, customer, carrier, channel, scenario, quantity rules.
3. Preview generated outbound orders.
4. Click create to call `outboundApi.createOrder` for each generated payload.
5. Refresh outbound order list when completed.

The generator is intentionally built on existing order APIs instead of adding a new persistence table, so it works with both Prisma and JSON fallback modes.
