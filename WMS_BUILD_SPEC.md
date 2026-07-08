# NiceC WMS 最终 App 开发与验收标准

本项目目标是把 NiceC-WMS 从当前 MVP/原型升级为可部署、可演示、可持续迭代的海外仓 WMS 全栈 App。

AI Agent 必须始终读取本文件，并根据现有项目代码结构继续开发，不允许重写整个项目，不允许删除已有核心功能，除非有明确理由并同步更新说明。

---

## 一、开发总原则

1. 先检查当前项目结构、依赖、路由、数据库模型、API 和页面，再开始修改。
2. 优先复用现有代码、组件、API、Prisma 模型和权限逻辑。
3. 每次修改前先理解现有实现，不要盲目覆盖。
4. 每完成一个模块，必须执行构建、类型检查、lint、基础运行测试。
5. 如果发现现有代码有 bug，先修复 bug，再继续新增功能。
6. 所有新增页面必须有样本数据或真实 API 数据支持，不能只是空页面。
7. 所有功能必须区分 Admin、Warehouse Operator、Client 三种角色。
8. 系统必须可以通过 Docker Compose 部署运行。
9. 所有环境变量必须有 `.env.example` 示例。
10. 最终必须更新 README，说明如何本地运行、Docker 部署、测试账号、功能清单。

---

## 二、最终产品定位

NiceC WMS 是一个海外仓管理系统，分为三个端：

### 1. Admin 管理端

用于平台管理员管理整个系统。

必须包含：

* Dashboard 总览
* 用户管理
* 客户管理
* 仓库管理
* SKU 管理
* 库存总览
* 入库订单管理
* 出库订单管理
* 退货订单管理
* 账单管理
* API Key 管理
* Webhook 管理
* 店铺/平台连接管理
* 系统设置
* 操作日志

### 2. Warehouse 仓库操作端

用于仓库人员完成日常仓内操作。

必须包含：

* 今日待处理任务
* 入库收货
* 上架
* 库位调整
* 拣货
* 打包
* 称重
* 出库复核
* 面单/运单记录
* 退货收货
* 换标
* 异常件处理
* 操作记录

### 3. Client 客户端

用于海外仓客户自己管理订单、库存和 API 对接。

必须包含：

* 客户 Dashboard
* 我的 SKU
* 我的库存
* 创建出库单
* 批量导入出库单
* 查看出库状态
* 创建入库预报 ASN
* 查看入库进度
* 退货管理
* 账单查看
* API Key 自助创建
* Webhook 配置
* 店铺/ERP 对接配置
* 操作记录

注意：第三方平台对接应该主要放在 Client 客户端完成，仓库端只负责提供标准接口、处理订单和库存。

---

## 三、核心业务流程要求

### 1. 登录与权限

必须支持：

* Admin 登录
* Warehouse Operator 登录
* Client 登录
* JWT 鉴权
* 路由权限保护
* API 权限校验
* 客户数据隔离

验收标准：

* Admin 可以查看所有客户数据。
* Client 只能查看自己的数据。
* Operator 只能操作仓库相关任务，不能进入客户管理/系统管理。
* 未登录用户访问受保护页面会跳转登录页。

---

### 2. Dashboard

Admin Dashboard 必须显示：

* 总客户数
* 总 SKU 数
* 总库存件数
* 今日入库数
* 今日出库数
* 异常订单数
* 待处理任务数
* 最近订单
* 最近异常

Client Dashboard 必须显示：

* 我的 SKU 数
* 我的库存数量
* 待出库订单
* 在途入库 ASN
* 退货数量
* 本月费用
* 最近订单状态

Warehouse Dashboard 必须显示：

* 今日待收货
* 今日待拣货
* 今日待复核
* 今日待发货
* 异常件
* 操作任务列表

---

### 3. SKU 管理

必须支持：

* 创建 SKU
* 编辑 SKU
* 删除/停用 SKU
* SKU 图片
* SKU 名称
* FNSKU
* UPC/EAN
* 尺寸
* 重量
* 客户归属
* 备注
* 搜索
* 筛选
* 分页

Client 只能管理自己的 SKU。

---

### 4. 库存管理

必须支持：

* 按 SKU 查看库存
* 按仓库查看库存
* 按库位查看库存
* 可用库存
* 预留库存
* 锁定库存
* 损坏库存
* 库存流水
* 库存调整
* 库存导出

验收标准：

* 创建出库单后，系统应预留库存。
* 取消出库单后，系统应释放预留库存。
* 出库完成后，系统应扣减库存。
* 入库上架后，系统应增加库存。

---

### 5. 入库 ASN 流程

Client 必须可以创建入库预报 ASN。

字段包括：

* ASN 编号
* 客户
* 仓库
* 预计到仓日期
* 箱数
* SKU 明细
* 每个 SKU 数量
* 追踪号
* 备注

Warehouse 必须可以：

* 查看待收货 ASN
* 收货确认
* 差异记录
* 上架到库位
* 完成入库

状态至少包括：

* draft
* submitted
* receiving
* putaway
* completed
* exception
* cancelled

---

### 6. 出库订单流程

Client 必须可以创建出库单。

字段包括：

* 订单号
* 客户
* 收件人
* 地址
* 电话
* 邮箱
* SKU 明细
* 数量
* 物流方式
* 备注

Warehouse 必须可以：

* 接收订单
* 拣货
* 打包
* 称重
* 录入 tracking number
* 出库复核
* 完成发货

状态至少包括：

* draft
* submitted
* allocated
* picking
* packing
* shipped
* completed
* cancelled
* exception

验收标准：

* 库存不足时不能成功提交出库单。
* 提交出库单后库存进入 reserved。
* shipped/completed 后库存正式扣减。
* cancelled 后释放 reserved 库存。

---

### 7. 退货流程

必须支持：

* 客户创建退货预报
* 仓库扫描/录入退货
* 检查商品状态
* 可售入库
* 损坏入库
* 换标处理
* 异常处理
* 退货完成

状态至少包括：

* pending
* received
* inspected
* restocked
* damaged
* relabel_required
* completed
* exception

---

### 8. 账单模块

必须支持基础账单项目：

* 入库费
* 出库操作费
* 仓储费
* 换标费
* 退货处理费
* 特殊操作费
* 月度账单
* 客户账单查看

Admin 可以管理所有账单。Client 只能查看自己的账单。

---

### 9. API Key 与 Webhook

Client 必须可以在客户端自助创建 API Key。

必须支持：

* 创建 API Key
* 查看 Key 名称
* 复制 Key
* 停用 Key
* 删除 Key
* 设置权限 scope

Webhook 必须支持：

* 创建 Webhook URL
* 设置触发事件
* 测试发送
* 启用/禁用

Webhook 事件至少包括：

* order.created
* order.updated
* order.shipped
* inventory.updated
* inbound.completed
* return.completed

---

### 10. 客户端对接中心

Client 端必须提供“Integration / 对接中心”。

必须包含：

* 标准 API 文档入口
* API Key 管理入口
* Webhook 管理入口
* 店铺连接配置
* 自定义 ERP 对接配置
* 测试连接按钮
* 最近同步记录

注意：

仓库端只提供接口能力和仓内处理能力。
客户自己的 ERP、店铺、平台对接配置应该在 Client 端完成。

---

### 11. 店铺/平台连接

可以先做 sample/mock 版本，但页面和数据结构必须完整。

支持的平台示例：

* Amazon
* Shopify
* Walmart
* TikTok Shop
* eBay
* WooCommerce
* Custom ERP

每个连接需要：

* 平台名称
* 店铺名称
* API Key / Token placeholder
* 状态
* 最近同步时间
* 同步订单按钮
* 同步库存按钮
* 错误日志

真实 API 可以后续接入，但当前版本必须保留接口结构和页面。

---

### 12. 管理员 Panel

页面顶部或侧边栏必须有 Admin Panel 入口。

Admin Panel 必须包含：

* 用户管理
* 角色管理
* 客户管理
* 仓库管理
* 系统配置
* Feedback / Bug Report 管理

---

### 13. AI Assistant Widget

所有页面右下角必须有 AI Assistant Widget。

要求：

* fixed bottom-6 right-6
* 圆形悬浮按钮
* 蓝紫渐变
* Bot / Sparkles / MessageCircle 图标
* hover 动效
* 点击后打开聊天弹窗
* 弹窗不要全屏
* 建议尺寸：420px x 620px
* 可咨询 WMS 数据
* 包含 Feedback / Report Bug 按钮
* 客户反馈需要进入 Admin Panel 可查看

AI Assistant 当前可以先做 mock 回复，但结构必须方便后续接入真实 LLM API。

---

### 14. UI / UX 要求

整体风格：

* 现代 SaaS 后台风格
* 简洁、清晰、专业
* 左侧导航
* 顶部用户信息
* 卡片式数据展示
* 表格支持搜索、筛选、分页
* 主要按钮颜色统一
* 页面不能出现明显空白、错位、重叠

必须修复：

* 鼠标移动时下拉菜单消失的问题
* 移动端基础适配
* loading 状态
* error 状态
* empty state
* confirmation dialog

---

## 四、技术要求

### 前端

* React
* TypeScript
* Vite
* Tailwind CSS
* 组件化
* API client 独立封装
* 类型定义清晰
* 不允许大量 any
* 页面状态清晰
* 表单有基础校验

### 后端

* Node.js
* Express
* TypeScript
* Prisma
* PostgreSQL
* JWT Auth
* Role-based access control
* Customer data isolation
* REST API
* Error handling middleware
* Request validation
* Seed data

### 数据库

必须有：

* User
* Customer
* Warehouse
* SKU
* Inventory
* InventoryTransaction
* InboundOrder
* InboundOrderItem
* OutboundOrder
* OutboundOrderItem
* ReturnOrder
* ReturnOrderItem
* Billing
* ApiKey
* Webhook
* StoreConnection
* Feedback
* AuditLog

如现有 schema 已有部分模型，应在现有基础上补全。

---

## 五、测试账号

Seed 数据必须创建以下账号：

### Admin

email: [admin@nicecwms.com](mailto:admin@nicecwms.com)
password: admin123456

### Warehouse Operator

email: [warehouse@nicecwms.com](mailto:warehouse@nicecwms.com)
password: warehouse123456

### Client

email: [client@nicecwms.com](mailto:client@nicecwms.com)
password: client123456

### Demo Client 2

email: [client2@nicecwms.com](mailto:client2@nicecwms.com)
password: client123456

---

## 六、必须执行的检查命令

每次完成修改后必须运行：

```bash
npm install
npm run lint
npm run build
npx prisma validate
npx prisma generate
docker compose config
```

如果项目已有测试命令，也必须运行：

```bash
npm test
npm run test
npm run test:smoke
```

如果命令不存在，不要失败退出，应记录“当前项目未配置该命令”，并建议补充。

---

## 七、Docker 部署要求

必须保证：

```bash
docker compose up -d --build
```

可以启动：

* app 服务
* postgres 服务

并且：

* app 监听 3000 或 README 指定端口
* health check 正常
* Prisma migration/seed 有说明
* `.env.example` 完整
* 不要在生产配置中使用默认弱密码
* README 必须说明如何修改 JWT_SECRET、DATABASE_URL 等变量

---

## 八、README 必须更新

README 必须包含：

1. 项目简介
2. 功能清单
3. 技术栈
4. 本地开发步骤
5. Docker 部署步骤
6. 环境变量说明
7. 测试账号
8. 角色权限说明
9. API 简介
10. 当前已完成模块
11. 后续 TODO

---

## 九、验收标准

最终项目必须满足：

1. 可以本地启动。
2. 可以 Docker Compose 启动。
3. 登录功能可用。
4. 三种角色权限正确。
5. Admin 端可以管理用户、客户、仓库、SKU、订单、库存、账单。
6. Warehouse 端可以处理入库、上架、拣货、打包、出库、退货。
7. Client 端可以管理自己的 SKU、库存、入库、出库、退货、账单、API Key、Webhook、Integration。
8. 库存预留、释放、扣减、入库增加逻辑正确。
9. 页面没有明显报错。
10. build 通过。
11. Prisma validate 通过。
12. docker compose config 通过。
13. README 完整。
14. `.env.example` 完整。
15. 有 seed demo 数据。
16. 有 AI Assistant Widget。
17. 有 Admin Panel。
18. 有 Feedback/Bug Report 管理。
19. 有操作日志。
20. 客户数据隔离正确。

---

## 十、Agent 工作方式

AI Agent 必须按照以下循环工作：

1. 读取 `WMS_BUILD_SPEC.md`
2. 检查当前项目代码
3. 列出已完成/未完成模块
4. 优先修复启动、构建、数据库、权限问题
5. 补齐缺失功能
6. 运行检查命令
7. 修复错误
8. 更新 README
9. 更新 TODO/完成记录
10. 重复直到满足验收标准

不要只写计划，必须直接修改代码。

如果一次无法全部完成，必须优先完成：

1. 项目能启动
2. 登录和权限
3. 数据库和 seed
4. Admin/Client/Warehouse 三端主框架
5. 出入库和库存核心流程
6. API Key/Webhook/Integration
7. AI Assistant 和 Feedback
8. README 和部署说明
