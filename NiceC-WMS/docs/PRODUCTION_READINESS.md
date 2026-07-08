# NiceC WMS Production Readiness Checklist

This checklist defines the minimum requirements before promoting NiceC WMS to a real production warehouse environment.

## 1. Required environment setup

- [ ] `.env` exists on the server and is not committed to Git.
- [ ] `JWT_SECRET` is a strong random secret.
- [ ] `POSTGRES_PASSWORD` is strong and unique.
- [ ] `DATABASE_URL` points to the production PostgreSQL service.
- [ ] `CORS_ORIGIN` and `ALLOWED_ORIGINS` match the production domain.
- [ ] Default demo passwords have been changed.
- [ ] `RUN_DB_PUSH=false` after first initialization.
- [ ] `RUN_DB_SEED=false` after first initialization.

## 2. Deployment checks

Run after deployment:

```bash
curl https://your-domain.com/api/health
curl https://your-domain.com/api/health/db
```

Expected:

- `/api/health` returns `status: ok`.
- `/api/health/db` returns PostgreSQL healthy status in real production.

## 3. Automated checks

For local or staging validation:

```bash
npm ci
npm run prisma:generate
npm run lint
npm run build
npm run dev
npm run test:smoke
npm run test:functions
```

For Docker validation:

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f wms-app
```

## 4. Database policy

Production should use proper migrations rather than destructive schema sync.

Current safe defaults:

```env
RUN_DB_PUSH=false
RUN_DB_SEED=false
```

Temporary first initialization only:

```env
RUN_DB_PUSH=true
RUN_DB_SEED=true
```

After the first successful initialization, revert both values to `false`.

## 5. Security checks

- [ ] HTTPS is enabled at the reverse proxy layer.
- [ ] Admin panel is not accessible to CLIENT users.
- [ ] CLIENT users only see their own customer data.
- [ ] API keys are not committed in Git.
- [ ] `.env` is not exposed by static hosting.
- [ ] Database port is not publicly exposed unless protected.
- [ ] Container runs as non-root user.
- [ ] Healthcheck is enabled.

## 6. Backup and rollback

Minimum backup policy:

- Daily PostgreSQL dump.
- Keep at least 7 daily backups.
- Test restore before production handoff.

Rollback command:

```bash
git checkout <last-good-commit>
docker compose up -d --build
```

## 7. Known production gaps to finish next

- Replace `server-bootstrap.ts` runtime injection with directly refactored modular route files.
- Introduce Prisma migrations with `prisma migrate deploy`.
- Add `helmet`, rate limiting, request ID logging, and structured logger.
- Add full E2E tests for admin user management and inventory flows.
- Connect real carrier APIs and store integrations.
- Configure object storage for uploaded screenshots and labels.
- Add database backup automation.
