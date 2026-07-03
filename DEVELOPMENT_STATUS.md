# NiceC WMS 开发状态报告

生成时间: 2026-07-02 (第二轮开发后更新)

---

## 一、完整自检结果

### 静态检查 (全部通过)

| # | 命令 | 结果 | 说明 |
|---|------|------|------|
| 1 | `npm install` | ✅ PASS | 250 packages, 0 vulnerabilities |
| 2 | `npm run lint` (tsc --noEmit) | ✅ PASS | 无 TypeScript 错误 |
| 3 | `npm run build` | ✅ PASS | vite build + esbuild, dist/server.cjs 159.3kb |
| 4 | `npx prisma validate` | ✅ PASS | schema valid |
| 5 | `npx prisma generate` | ✅ PASS | Prisma Client v5.22.0 generated |
| 6 | `docker compose config` | ✅ PASS | YAML valid |

### 运行时检查 (全部通过)

| # | 测试项 | 结果 | 说明 |
|---|--------|------|------|
| 7 | 服务器启动 | ✅ PASS | GET /api/health → status: "ok" |
| 8 | Client 登录 | ✅ PASS | role=CLIENT, customerId=cust_1 |
| 9 | Admin 登录 | ✅ PASS | role=admin |
| 10 | Warehouse 登录 | ✅ PASS | role=operator, warehouseId=wh_1 |
| 11 | ApiKey API | ✅ PASS | GET /api/api-keys → 2 keys, POST 创建成功 |
| 12 | Webhook API | ✅ PASS | GET /api/webhooks → 1 webhook |
| 13 | Store Connection API | ✅ PASS | GET /api/store-connections → 2 connections |
| 14 | Return Order API | ✅ PASS | GET + POST 创建退货单成功 |
| 15 | Billing Records API | ✅ PASS | GET /api/billing-records → 1 record |
| 16 | Billing Rules API | ✅ PASS | GET /api/billing-rules → 3 rules |
| 17 | Warehouse Portal APIs | ✅ PASS | inbound/putaway/pick/exceptions 全部返回数据 |

---

## 二、已修复的 Bug

1. ~~Prisma v7 schema 不兼容~~ → 固定 5.22.0
2. ~~docker-compose.yml 废弃 version 字段~~ → 移除
3. ~~测试账号不匹配规范~~ → 添加 4 个 spec 账号
4. ~~缺少 Warehouse Operator 入口~~ → 新建 WarehousePortal
5. ~~App.tsx 不识别小写 role~~ → 添加小写匹配
6. ~~data.json stale data~~ → 删除旧文件 + db.ts 合并逻辑

---

## 三、已完成模块

### 基础架构 ✅
- React + TypeScript + Vite + Tailwind CSS 前端
- Express + TypeScript + Prisma 后端
- PostgreSQL 数据库 (Prisma ORM) + JSON Fallback
- JWT 认证 + RBAC 权限控制
- Docker Compose 部署配置

### 登录与权限 ✅
- JWT Token 认证
- Admin / Warehouse Operator / Client 三角色
- requireAuth / requireRole / requireCustomerAccess 中间件
- 客户数据隔离

### Admin 端 ✅
- Dashboard 总览
- 用户管理 / 角色权限 / 仓库管理 / 客户管理
- 账单规则配置 (Admin-only CRUD)
- 操作日志查看
- Feedback / Bug Report 管理
- 系统设置

### 出库核心流程 ✅
- 出库单 CRUD + 库存预留/释放/扣减
- 波次生成 + 面单管理
- 多维搜索/筛选/分页

### 库存管理 ✅
- 库存查询 (按 SKU/仓库/库位)
- 可用/预留/损坏库存 + 库存流水

### 入库管理 ✅
- ASN 入库单列表 + 收货确认
- 上架管理 (Putaway) + 入库认领

### 元数据管理 ✅
- 客户/SKU/产品/承运商/物流渠道/仓库/库位管理

### 退货流程 ✅ (NEW)
- 客户创建退货预报 (选择订单 + SKU + 数量)
- 退货单列表 (状态: pending → received → inspected → restocked/completed)
- 仓库收货确认 / 检验 / 入库
- 状态颜色编码 + 详情查看

### 账单模块 ✅ (NEW)
- 费用明细列表 (按客户隔离)
- 月度账单 / 发票查看
- 汇总卡片 (总费用/待支付/已支付/本月账单)
- Admin 可管理计费规则 (CRUD)
- Admin 可生成月度账单和发票

### API Key 管理 ✅ (NEW)
- 创建 / 查看 / 复制 / 测试 / 删除 API Key
- 自动生成 nwc_ 前缀密钥
- 客户数据隔离

### Webhook 管理 ✅ (NEW)
- 创建 / 编辑 / 测试 / 删除 Webhook
- 自动生成 secret
- 事件订阅: order.created/updated/shipped, inventory.updated, inbound.completed, return.completed

### 店铺连接 ✅ (NEW)
- 支持 Amazon / Shopify / Walmart / TikTok Shop / eBay / WooCommerce / Custom ERP
- 连接 / 同步 / 断开
- 同步订单和库存 (mock)

### 对接中心 ✅ (NEW)
- API Keys 管理标签页
- Webhooks 管理标签页
- 店铺连接标签页
- API 文档入口标签页

### Client Portal ✅ (完成)
- Dashboard / 我的 SKU / 我的库存
- 出库订单管理 (创建/查看)
- 入库预报 ASN
- 退货管理 (完整 RMA 流程)
- 账单管理 (费用明细 + 月度账单)
- 对接中心 (API Key + Webhook + 店铺连接)
- 工单反馈
- 账号设置

### Warehouse Portal ✅ (完成)
- 今日任务仪表盘
- 入库收货 (真实 API 数据)
- 上架管理 (真实 API 数据)
- 拣货任务 (真实 API 数据)
- 打包复核 (真实 API 数据)
- 出库复核 (真实 API 数据)
- 退货收货 (真实 API 数据)
- 异常件处理 (真实 API 数据)
- 操作记录 (真实 API 数据)

### AI Assistant Widget ✅
- 右下角浮动按钮 + 聊天弹窗
- Mock 回复模式
- Feedback / Report Bug 按钮

### Feedback 管理 ✅
- 客户提交反馈/Bug Report
- Admin 查看和管理 + 评论系统

---

## 四、未完成模块 (低优先级)

1. **Admin Panel 扩展:** 部分子模块内容可进一步丰富
2. **Dashboard 硬编码:** 部分统计在 JSON fallback 模式下为 seed 数据
3. **批量导入出库单:** UI 按钮存在但实际导入逻辑未实现
4. **API 文档页面:** 当前为占位页面

---

## 五、测试账号

| 账号 | 密码 | 角色 | 数据范围 |
|------|------|------|----------|
| admin@nicecwms.com | admin123456 | Admin | 全部数据 |
| warehouse@nicecwms.com | warehouse123456 | Operator | 仓库 wh_1 |
| client@nicecwms.com | client123456 | Client | 仅 cust_1 |
| client2@nicecwms.com | client123456 | Client | 仅 cust_2 |

---

## 六、API 路由清单 (新增)

### ApiKey (5 routes)
- GET /api/api-keys, POST /api/api-keys, PUT /api/api-keys/:id, DELETE /api/api-keys/:id, POST /api/api-keys/:id/test

### Webhook (5 routes)
- GET /api/webhooks, POST /api/webhooks, PUT /api/webhooks/:id, DELETE /api/webhooks/:id, POST /api/webhooks/:id/test

### StoreConnection (5 routes)
- GET /api/store-connections, POST /api/store-connections, PUT /api/store-connections/:id, DELETE /api/store-connections/:id, POST /api/store-connections/:id/sync

### ReturnOrder (7 routes)
- GET /api/return-orders, POST /api/return-orders, GET /api/return-orders/:id, PUT /api/return-orders/:id, POST /api/return-orders/:id/receive, POST /api/return-orders/:id/inspect, POST /api/return-orders/:id/restock

### Billing (5 routes)
- POST /api/billing-rules, PUT /api/billing-rules/:id, DELETE /api/billing-rules/:id, POST /api/billing-records/generate, POST /api/invoices/generate

---

## 七、下一步开发顺序

1. ✅ ~~Server API routes (ApiKey/Webhook/Store/Return/Billing)~~
2. ✅ ~~Frontend components (IntegrationCenter/ReturnManager/BillingView)~~
3. ✅ ~~Client Portal 完整化~~
4. ✅ ~~Warehouse Portal 完整化~~
5. Admin Panel 扩展 (可选)
6. 批量导入功能 (可选)
7. 提交 PR

---

## 八、本次修改记录

1. **server.ts**: 新增 27 条 API 路由 (ApiKey 5 + Webhook 5 + Store 5 + Return 7 + Billing 5)
2. **src/api.ts**: 新增 apiKeyApi, webhookApi, storeConnectionApi, returnApi, billingApi
3. **src/components/integration/IntegrationCenter.tsx**: 新建对接中心 (4 标签页)
4. **src/components/returns/ReturnManager.tsx**: 新建退货管理 (完整 RMA 流程)
5. **src/components/billing/BillingView.tsx**: 新建账单管理 (费用明细 + 月度账单)
6. **src/components/ClientPortal.tsx**: 集成新组件替换 placeholder
7. **src/components/WarehousePortal.tsx**: 8 个标签页全部实现真实 API 数据
