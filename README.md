# NiceC WMS - 海外仓仓库管理系统

NiceC WMS 是一个全栈海外仓仓库管理系统（WMS），支持 Admin 管理端、Warehouse 仓库操作端、Client 客户端三端协作。

## 功能清单

### Admin 管理端
- Dashboard 总览（客户数/SKU数/库存/出入库统计）
- 用户管理、角色权限管理
- 客户管理
- 仓库管理
- SKU/产品管理
- 库存总览
- 入库订单管理（ASN）
- 出库订单管理
- 退货订单管理
- 账单管理
- 操作日志
- Feedback / Bug Report 管理

### Warehouse 仓库操作端
- 今日待处理任务
- 入库收货 / 上架
- 库位调整
- 拣货 / 打包 / 称重
- 出库复核
- 退货收货 / 换标
- 异常件处理

### Client 客户端
- 客户 Dashboard
- 我的 SKU / 我的库存
- 创建出库单 / 批量导入
- 创建入库预报 ASN
- 退货管理
- 账单查看
- API Key 自助创建
- Webhook 配置
- 店铺/ERP 对接配置

### AI Assistant
- 右下角 AI 助手悬浮按钮
- 聊天弹窗咨询 WMS 数据
- Feedback / Report Bug 按钮

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | PostgreSQL + Prisma ORM |
| 认证 | JWT (JSON Web Token) |
| 容器化 | Docker + Docker Compose |

## 本地开发步骤

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 设置 DATABASE_URL、JWT_SECRET 等

# 3. 初始化数据库
npx prisma generate
npx prisma db push
npx prisma db seed

# 4. 启动开发服务器
npm run dev
```

打开浏览器访问 http://localhost:3000

## Docker 部署步骤

```bash
# 启动服务集群 (PostgreSQL + App)
docker compose up -d --build

# 查看日志
docker compose logs -f wms-app

# 停止服务
docker compose down
```

容器启动后会自动：
- 运行 Prisma Generate
- 运行 Prisma Db Push（同步数据库结构）
- 运行 Prisma Db Seed（填充演示数据）
- 启动生产环境服务器

## 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://nicec:nicec_password@localhost:5432/nicec_wms?schema=public` |
| `JWT_SECRET` | JWT 签名密钥（生产环境必须修改） | `change-this-secret-in-production` |
| `PORT` | 服务监听端口 | `3000` |
| `NODE_ENV` | 运行环境 | `development` |

> **安全提示:** 生产环境必须修改 `JWT_SECRET` 和数据库密码，不要使用默认弱密码。

## 测试账号

| 角色 | 邮箱 | 密码 | 说明 |
|------|------|------|------|
| Admin 管理员 | `admin@nicecwms.com` | `admin123456` | 全部管理权限 |
| Warehouse 仓库操作员 | `warehouse@nicecwms.com` | `warehouse123456` | 仓库操作权限 |
| Client 客户 | `client@nicecwms.com` | `client123456` | 客户门户（数据隔离） |
| Client2 客户 | `client2@nicecwms.com` | `client123456` | 第二个客户（数据隔离） |

> 也支持旧账号：`admin@nicec.net`/`admin123456`、`neal@nicec.net`/`admin123456`、`operator`/`warehouse123456`

## 角色权限说明

| 功能 | Admin | Warehouse Operator | Client |
|------|:-----:|:------------------:|:------:|
| Dashboard 总览 | ✅ | ✅ (仓库视角) | ✅ (客户视角) |
| 用户管理 | ✅ | ❌ | ❌ |
| 客户管理 | ✅ | ❌ | ❌ |
| 仓库管理 | ✅ | ✅ | ❌ |
| SKU 管理 | ✅ (全部) | ✅ | ✅ (仅自己的) |
| 库存查看 | ✅ (全部) | ✅ | ✅ (仅自己的) |
| 出库管理 | ✅ (全部) | ✅ (操作) | ✅ (仅自己的) |
| 入库管理 | ✅ (全部) | ✅ (收货上架) | ✅ (创建ASN) |
| 退货管理 | ✅ | ✅ (收货质检) | ✅ (创建退货) |
| 账单管理 | ✅ | ❌ | ✅ (仅自己的) |
| API Key / Webhook | ✅ | ❌ | ✅ (仅自己的) |
| 系统设置 | ✅ | ❌ | ❌ |

## API 简介

后端运行于 `port:3000`，提供以下 REST API：

### 认证
- `POST /api/auth/login` - 登录获取 JWT Token

### 出库单
- `GET /api/outbound-orders` - 查询出库单列表（支持多维筛选、分页）
- `GET /api/outbound-orders/:id` - 获取出库单详情
- `POST /api/outbound-orders` - 创建出库单（含库存预留）
- `PUT /api/outbound-orders/:id` - 更新出库单
- `DELETE /api/outbound-orders/:id` - 取消出库单（释放库存）
- `POST /api/outbound-orders/:id/ship` - 确认出库（扣减库存）
- `POST /api/outbound-orders/batch-generate-wave` - 批量生成波次

### 元数据
- `GET /api/customers` - 客户列表
- `GET /api/skus` - SKU 列表
- `GET /api/inventory` - 库存列表
- `GET /api/carriers` - 承运商列表
- `GET /api/logistics-channels` - 物流渠道列表

## 当前已完成模块

- [x] 登录认证 + JWT
- [x] 三角色权限控制 + 客户数据隔离
- [x] Admin Dashboard
- [x] 出库单完整 CRUD + 库存事务
- [x] 波次管理 + 面单管理
- [x] 入库管理 (ASN) + 上架管理
- [x] SKU/产品/客户/仓库/渠道元数据管理
- [x] 库存管理 + 库存流水
- [x] Client Portal (Dashboard/SKU/库存/出库/入库)
- [x] Feedback 管理
- [x] AI Assistant Widget
- [x] 操作日志
- [x] Docker Compose 部署
- [x] 自动化冒烟测试

## 后续 TODO

- [ ] Warehouse Operator 独立操作界面
- [ ] 退货完整流程 (创建/收货/质检/入库)
- [ ] 账单计算引擎
- [ ] API Key / Webhook 真实 CRUD 后端
- [ ] 店铺/平台连接管理 (Amazon/Shopify/Walmart/TikTok)
- [ ] Integration Center 页面
- [ ] AI Assistant 接入真实 LLM API
- [ ] WebSocket 实时推送
- [ ] 批量操作性能优化
- [ ] 单元测试覆盖
