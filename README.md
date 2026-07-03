# NiceC WMS 仓库管理系统

NiceC WMS 是一个面向海外仓业务的全栈仓库管理系统，采用 **React + TypeScript + Vite + Express + Prisma + PostgreSQL** 架构，支持出库一件代发、波次、库存预留、入库、上架、客户门户、管理员后台、反馈管理与 AI 助手等模块。

> 当前分支目标：把演示型 MVP 升级为可部署、可检查、可继续扩展的生产级版本。

---

## 生产级能力清单

已加入或强化：

- Docker 多阶段生产构建
- Docker Compose + PostgreSQL 16
- 非 root 容器运行用户
- 容器 Healthcheck
- 生产安全 entrypoint
- `.env.example` 生产环境模板
- GitHub Actions CI：类型检查、构建、Docker build
- `npm run test:smoke` 核心冒烟测试
- `npm run test:functions` 全功能端点检查
- JWT 登录鉴权
- 客户角色数据隔离
- PostgreSQL 不可用时的 JSON fallback/mock 运行能力

仍建议在正式上线前继续补强：

- 正式 Prisma migration 流程，替代生产 `db push`
- 完整 RBAC 权限矩阵
- API rate limit / Helmet / audit trail 全覆盖
- 对接真实承运商、店铺平台、对象存储
- E2E 测试和备份恢复演练

---

## 本地开发

```bash
npm install
cp .env.example .env
npm run dev
```

打开：

```text
http://localhost:3000
```

默认开发端口：`3000`

---

## 生产部署：Docker Compose

### 1. 配置环境变量

```bash
cp .env.example .env
```

必须修改这些值：

```env
JWT_SECRET="replace-with-a-long-random-production-secret"
POSTGRES_PASSWORD="replace-db-password"
DATABASE_URL="postgresql://nicec_wms:replace-db-password@postgres:5432/nicec_wms?schema=public"
ADMIN_PASSWORD="replace-admin-password"
CLIENT_PASSWORD="replace-client-password"
CORS_ORIGIN="https://your-domain.com"
ALLOWED_ORIGINS="https://your-domain.com"
```

生成强密钥：

```bash
openssl rand -base64 48
```

### 2. 首次初始化数据库

首次部署可以临时打开：

```env
RUN_DB_PUSH=true
RUN_DB_SEED=true
```

然后启动：

```bash
docker compose up -d --build
```

初始化完成后，建议改回：

```env
RUN_DB_PUSH=false
RUN_DB_SEED=false
```

再重启：

```bash
docker compose up -d
```

> 生产环境默认不自动执行 `db push --accept-data-loss`，避免意外破坏线上数据。

### 3. 查看状态

```bash
docker compose ps
docker compose logs -f wms-app
```

健康检查：

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/db
```

---

## Coolify 部署建议

推荐选择 **Docker Compose** 部署方式。

必须配置：

- Build Pack：Docker Compose
- Port：`3000`
- Healthcheck URL：`/api/health`
- Environment：使用 `.env.example` 中的变量，不要使用默认密码
- Volume：保留 PostgreSQL volume `postgres_data`

首次部署：

```env
RUN_DB_PUSH=true
RUN_DB_SEED=true
```

稳定后改成：

```env
RUN_DB_PUSH=false
RUN_DB_SEED=false
```

---

## 测试与生产检查

先启动服务：

```bash
npm run dev
```

另开终端执行：

```bash
npm run test:smoke
npm run test:functions
```

`test:smoke` 检查核心链路：

- 健康检查
- 登录鉴权
- 客户数据隔离
- 库存接口
- CLIENT 波次权限拦截
- AI 助手 fallback

`test:functions` 检查主要端点：

- Auth
- Customers
- Carriers
- Logistics Channels
- Products
- SKUs
- Warehouses
- Inventory
- Outbound Orders
- Waves
- Dashboard
- Operation Logs
- AI Assistant
- Feedback
- Users
- Billing Rules

---

## 常用账号

开发/演示种子账号：

| 角色 | 登录账号 | 默认密码 | 说明 |
| --- | --- | --- | --- |
| Admin | `admin@nicec.net` | `admin123` | 管理后台账号 |
| Admin | `neal@nicec.net` | `admin123` | 项目负责人账号 |
| Operator | `operator` | `operator123` | 仓库操作员 |
| Client | `client@nicec.net` | `client123` | 客户门户账号 |

正式生产必须通过 `.env` 或数据库种子脚本修改默认密码。

---

## 主要 API

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

### Outbound

- `GET /api/outbound-orders`
- `GET /api/outbound-orders/:id`
- `POST /api/outbound-orders`
- `PUT /api/outbound-orders/:id`
- `DELETE /api/outbound-orders/:id`
- `POST /api/outbound-orders/:id/cancel`
- `POST /api/outbound-orders/:id/ship`
- `POST /api/outbound-orders/batch-generate-wave`

### Master Data

- `GET /api/customers`
- `GET /api/products`
- `GET /api/skus`
- `GET /api/carriers`
- `GET /api/logistics-channels`
- `GET /api/warehouses`

### Inventory

- `GET /api/inventory`
- `GET /api/inventory/:id`
- `POST /api/inventory/adjust`
- `POST /api/inventory/transfer`
- `GET /api/inventory-transactions`
- `GET /api/inventory-reservations`

### Admin

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `POST /api/users/:id/reset-password`
- `DELETE /api/users/:id`
- `GET /api/billing-rules`
- `POST /api/billing-rules`
- `PUT /api/billing-rules/:id`
- `DELETE /api/billing-rules/:id`
- `GET /api/feedback`

---

## 数据安全建议

上线前必须完成：

1. 替换所有默认密码和密钥。
2. 使用独立 PostgreSQL volume 或托管数据库。
3. 定期备份数据库。
4. 不要把 `.env` 提交到 Git。
5. 生产环境默认保持 `RUN_DB_PUSH=false`。
6. 将域名接入 HTTPS 反代，例如 Coolify/Traefik/Cloudflare。

---

## 回滚

Docker Compose 回滚：

```bash
git checkout <last-good-commit>
docker compose up -d --build
```

GitHub 分支回滚：

```bash
git revert <commit-sha>
```
