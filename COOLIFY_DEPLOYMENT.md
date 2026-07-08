# Coolify 部署指南 — NiceC WMS

## 环境变量（必需）

| 变量 | 说明 | 默认值 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://nicec_wms:<pass>@postgres:5432/nicec_wms?schema=public` |
| `JWT_SECRET` | JWT 签名密钥（至少 32 字符随机字符串） | **无 — 生产环境必须设置** |
| `NODE_ENV` | 运行模式 | `production` |

## 环境变量（可选）

| 变量 | 说明 | 默认值 |
|---|---|---|
| `PORT` | 服务端口 | `3000` |
| `ALLOWED_ORIGINS` | 允许的 CORS 来源（逗号分隔） | `http://localhost:3000` |
| `CORS_ORIGIN` | 向前兼容的 CORS 来源 | 同 `ALLOWED_ORIGINS` |
| `WEBHOOK_SECRET` | Webhook 回调签名密钥 | 可选 |
| `RUN_DB_SEED` | 首次启动是否初始化种子数据 | `false` |
| `RUN_DB_MIGRATE` | 是否自动执行数据库迁移 | `true` |
| `ENABLE_JSON_FALLBACK` | 是否启用 JSON 文件回退模式（仅开发/演示） | `false` |

## Coolify 部署步骤

### 1. 创建 PostgreSQL 服务
- 在 Coolify 中新建 PostgreSQL 服务
- 记下生成的内部 Hostname（例如 `postgres`）
- 用户名、密码、数据库名建议保持默认（或按需修改）

### 2. 部署 NiceC WMS
- 仓库：`https://github.com/your-org/NiceC-WMS`
- 构建包：`Docker Compose`
- Docker Compose 文件：`docker-compose.yml`

### 3. 设置环境变量
在 Coolify 服务配置中设置以下环境变量：

```bash
DATABASE_URL=postgresql://nicec_wms:your-db-password@postgres:5432/nicec_wms?schema=public
JWT_SECRET=<至少 64 字符随机字符串，可用 openssl rand -hex 32 生成>
NODE_ENV=production
ALLOWED_ORIGINS=https://your-domain.com
```

### 4. 健康检查
部署后访问 `https://your-domain.com/api/health` 确认返回 `{"status":"ok"}`。

### 5. 首次启动
- 首次启动会自动执行 `prisma migrate deploy` 创建数据库表
- 如果需要初始化种子数据，设置 `RUN_DB_SEED=true` 后重启
- **首次启动后请关闭 `RUN_DB_SEED`**，防止重置数据

## 安全注意事项

1. **JWT_SECRET**：必须使用足够长的随机字符串，不要在多个环境共用
2. **CORS**：`ALLOWED_ORIGINS` 中只列出您的前端域名
3. **种子数据**：种子账户密码仅供开发和演示环境使用，生产环境应在启动后立即修改密码
4. **备份**：确保 PostgreSQL 数据卷定期备份（`pg_dump` 或 Coolify 自动备份）
