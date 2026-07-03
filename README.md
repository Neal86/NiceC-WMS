# NiceC WMS 仓库管理系统全栈 MVP
 
本项目是一个高精度、企业级海外仓仓库管理系统（WMS）全栈 MVP，将原本的“出库页面原型”升级为真实可落地的生产全栈系统。系统统一命名为：**NiceC WMS** / **NC WMS**。
 
---
 
## 🏗️ 全栈系统架构与重大重构亮点
 
为了实现生产级的海外仓作业流程，本项目采用 **React + TypeScript + Vite + Express + Prisma + PostgreSQL** 架构，并完成了以下核心业务骨架和数据一致性的深层重构：
 
### 1. 全 Prisma 数据库事务（Atomic Transaction）支持
*   **出库单与库存管理闭环**：出库单核心 API （创建、更新、取消、出库）全部改写为标准的 Prisma 数据库 `$transaction`，保证其强一致性。
*   **原子化锁库 (Stock Reservation)**：当创建或修改出库单时，系统会在同一个事务中校验所有 SKU 的可用库存，并在事务内部锁定库存；如果其中任意一款 SKU 的库存不足，**整笔事务强制 Rollback**，彻底杜绝超卖或部分锁定造成的实物异常，并向客户端返回 `400` 错误。
*   **数据库故障自动降级 (Fallback)**：核心 API 支持多运行态自动降级。如果检测到 PostgreSQL 连接不可达，系统会自动平滑降载至单体 JSON 数据库，确保离线或独立沙箱调试时的可用性。
 
### 2. 真实权限控制与多租户数据隔离
引入了 `requireAuth`、`requireRole` 和 `requireCustomerAccess` 安全拦截器：
*   **超级管理员 (Admin / Super Admin)**：拥有完整的客户元数据、商品SKU库、物理库存分布以及所有出库订单的管理、合并、审核、导出权限。
*   **仓库操作员 (Operator)**：具备日常仓储出入库确认、拣货波次批量归集、包裹打单等仓储作业功能。
*   **商户客户 (CLIENT / Client)**：登录后重定向进入专属 **Client Portal（客户门户）**。客户只能看到、检索、更新和创建属于该客户（CustomerId）的数据。对于 `GET /api/customers`、`GET /api/skus`、`GET /api/inventory`、`GET /api/outbound-orders` 等元数据与出库单，系统在底层自动应用租户 ID 过滤，防止 CLIENT 查看或越权篡改其他商户的数据，实现完全的客户多租户隔离。
 
### 3. 统一库存字段命名 (Unified Field Schema)
根据真实 WMS 的库存控制最佳实践，前端 React 类型、后端 JSON 模型以及 Prisma 数据库字段已完成了彻底统一：
*   **可用库存**：`availableQty`（正品）
*   **锁定占用库存**：`reservedQty`（备货中/预留中）
*   **破损次品库存**：`damagedQty`（次品/退货待处理）
*   *完全废弃了 legacy `lockedQty`, `locationCode`, `zoneCode` 字段，杜绝二义性。*
 
### 4. 显式出库扣减 API
*   **主动出库确认**：新增 `POST /api/outbound-orders/:id/ship` 主动作业接口，操作员确认后会将预留库存（`reservedQty`）直接扣减为 0，并将相应的预留状态消费为 `CONSUMED`，同时在底层生成 `SHIP` 类型、方向为 `OUT` 的 `inventoryTransaction` 历史审计日志。
 
---
 
## 🔑 默认演示账户与凭证 (含密码)
 
系统包含完善的 JWT 登录与密码 bcrypt 散列对比。预设演示账号如下：
 
| 角色 / 身份 | 登录账号 | 预设密码 | 登录行为与权限 |
| :--- | :--- | :--- | :--- |
| **超级管理员 (Admin)** | `neal@nicec.net` | `admin123` | 拥有全部出库、编辑、删除、波次合并及全局配置权限 |
| **超级管理员 (Admin)** | `admin@nicec.net` | `admin123` | 备用最高权限账号 |
| **仓库操作员 (Operator)** | `operator` | `operator123` | 基础仓储理货、复核、确认出库作业权限 |
| **商户客户 (Client)** | `client@nicec.net` | `client123` | **重定向进入 Client Portal（客户门户）**，多租户强隔离，仅能看到和编辑自身客户ID绑定的出库订单与可用库存 |
 
---
 
## 🚀 本地开发快速启动
 
### 1. 安装基础依赖
在主工作区根目录下安装所有必要的 npm 包：
```bash
npm install
```
 
### 2. 启动全栈开发服务器
运行以下命令，系统将在本地 **3000** 端口同时热加载启动 Express API 后端与 Vite React 前端：
```bash
npm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可使用。
 
---
 
## 🐳 生产级容器化部署 (Docker Compose)
 
本项目内置了完整的容器化编排文件。它将拉取 PostgreSQL 数据库，自动运行数据挂载、Prisma 结构初始化并挂载 WMS 镜像。
 
### 1. 启动服务集群
```bash
docker-compose up -d --build
```
 
### 2. 数据库自愈与自动迁移
WMS 镜像采用 `entrypoint.sh` 脚本作为运行入口。容器启动后会自动串联执行以下过程：
- **Prisma Generate**：动态编译并生成最新的 TypeScript Prisma 客户端。
- **Prisma Db Push**：将 `schema.prisma` 结构同步推送至 PostgreSQL 数据库（自愈模式）。
- **Prisma Db Seed**：自动填充基础组织结构、用户权限及 SKU 初始主数据。
- 启动生产环境编译出的全栈 CJS 后端：`node dist/server.cjs`。

---
 
## 🧪 自动化冒烟测试 (Automated Smoke Test)

系统包含一套一键化自动冒烟测试用例，覆盖了从认证到锁库、冲销、永久出库、安全审计的完整生命周期核心流程：

### 运行测试
请在 Express 启动（`npm run dev` 且 3000 端口已就绪）的状态下执行以下命令：
```bash
npm run test:smoke
```

测试将自动依次验证：
1. **Admin JWT 认证**。
2. **多租户权限拦截与资源可用度拉取**。
3. **出库创建原子锁库 (Stock Reservation)**。
4. **出库单整笔取消与回滚冲销 (Stock Release)**。
5. **包裹面单打印与手动扣减永久扣库 (Stock Ship Deduction)**。
6. **WMS AI Assistant Fallback 问答回复**。

所有用例在事务一致、多端鉴权拦截正确的状态下自动输出 `100% GREEN`。

---
 
## 📊 后端 REST API 接口文档
 
后端运行于 `port:3000`，提供以下标准的 REST API 路由：
 
### 1. 登录认证 (JWT Auth)
*   `POST /api/auth/login`
    *   **Payload**: `{ "username": "neal@nicec.net", "password": "admin123" }`
 
### 2. 出库单核心管理 (Outbound Orders CRUD)
*   `GET /api/outbound-orders`：多维检索出库列表（超级管理员显示全部，Client 用户强制按 CustomerId 隔离，支持根据状态页签汇总计数的动态过滤）
*   `GET /api/outbound-orders/:id`：获取出库订单详情（带客户、渠道、承运商关联，Client 用户做越权拦截）
*   `POST /api/outbound-orders`：创建新的一件代发出库单（包含原子性库存预留事务，库存不足回滚）
*   `PUT /api/outbound-orders/:id`：更新出库单详情（包含包裹及物品行数据，修改订单项时自动冲销原锁定并重新进行可用库存校验）
*   `DELETE /api/outbound-orders/:id`：物理删除出库单并清空明细
*   `POST /api/outbound-orders/:id/cancel`：取消出库单，回滚并释放已锁定的预留库存 (`reservedQty` 还原回 `availableQty`，状态恢复为 `RELEASED`)
*   `POST /api/outbound-orders/:id/ship`：操作员手动点击“确认出库”，触发实物扣减（`reservedQty` 扣减，记录流水账并结转为 `CONSUMED`）
 
### 3. 波次处理与归集
*   `POST /api/outbound-orders/batch-generate-wave`
    *   **Payload**: `{ "orderIds": ["ord_1", "ord_2"] }`：合并多个订单为同一拣货波次并自动分配波次流水号 `WVxxxxxx`
 
### 4. 隔离的基础元数据 API (按 CLIENT 自动隔离)
*   `GET /api/customers`：超级管理员显示全部商户，Client 仅显示自身商户档案
*   `GET /api/skus`：商品 SKU 元数据库，Client 仅显示自身托管产品
*   `GET /api/inventory`：实物库存状况，Client 仅查看自身可用与锁定数量
*   `GET /api/carriers`：承运商列表
*   `GET /api/logistics-channels`：物流渠道列表
 
---
 
## 🎨 页面复刻亮点及功能特性
 
1.  **极高逼真度企业级 UI**：
    *   左侧导航 `#071225` 配合出库高亮、右侧展开指示。
    *   顶部 Header `#062B66` 深蓝色企业质感，包含完整的 nc-NO.1 仓库选择器、通知铃、用户状态。
    *   内置全部 `待处理`、`待拣货`、`待复核`、`已出库` 真实数量。
2.  **出库一件代发核心流**：
    *   **新建出库单**：支持选择绑定多款 SKU，可灵活添加多条产品并设置数量。
    *   **详情透视**：支持在表格中点击 OBS 编号一键拉起侧弹窗，极速展示当前物流追踪状态及分拨包裹明细。
    *   **生成波次**：勾选多条订单后，点击蓝色的“生成波次”，系统将对该组订单合规分配并生成波次。
    *   **快速更新**：可在表格行中进行多状态手动快捷更改（如更新面单是否已打印状态）。
