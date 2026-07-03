# NiceC WMS Final App Completion Guide

Goal: continue the existing NiceC-WMS codebase into a runnable full-stack overseas warehouse WMS app. Do not rewrite the project from scratch. Reuse the current React, Express, Prisma, PostgreSQL, JSON fallback, auth, Admin Panel, Client Portal, AI Assistant, and Feedback foundations.

## Current foundation

The repository already has the core architecture, Prisma schema, JWT login, outbound order flow, inventory reservation, Docker/env docs, and a final product specification in `WMS_BUILD_SPEC.md`.

## Required next work

1. Make the project start, build, and validate cleanly.
2. Align `src/api.ts` with every route in `server.ts`.
3. Complete Admin pages: users, customers, warehouses, SKUs, inventory, inbound, outbound, returns, billing, API keys, webhooks, store connections, operation logs, feedback, settings.
4. Complete Warehouse pages: receiving, putaway, location adjustment, picking, packing, weighing, outbound review, returns receiving, relabeling, exceptions, operation records.
5. Complete Client pages: dashboard, own SKUs, own inventory, outbound creation, bulk import, ASN creation, inbound status, returns, billing, API keys, webhooks, integrations, operation records.
6. Add mock-first APIs and UI for API keys, webhooks, store connections, returns, billing, audit logs, and integration center.
7. Make seed data cover all modules so no page is empty.
8. Enforce customer data isolation for Client role.
9. Enforce warehouse-only permissions for Operator role.
10. Keep AI Assistant scoped to WMS operations only.
11. Fix hover dropdown disappearing, loading states, error states, empty states, confirmation dialogs, and basic mobile layout.
12. Update README after each major completion pass.

## Standard demo accounts

- Admin: `admin@nicecwms.com` / `admin123456`
- Warehouse Operator: `warehouse@nicecwms.com` / `warehouse123456`
- Client: `client@nicecwms.com` / `client123456`
- Demo Client 2: `client2@nicecwms.com` / `client123456`

## Acceptance commands

Run these after every module pass:

```bash
npm install
npm run lint
npm run build
npx prisma validate
npx prisma generate
docker compose config
npm run test:smoke
```

If a command is missing, add it or document why it is not available.

## Completion definition

The project is complete only when local start, Docker start, login, role permissions, Admin/Warehouse/Client pages, inventory flows, inbound, outbound, returns, billing, API key, webhook, integration, feedback, operation logs, seed data, README, `.env.example`, build, Prisma validate, and Docker config all work.
