# NiceC WMS 仓库管理系统全栈 Demo

本项目是一个高逼格、高逼真度的企业级仓库管理系统（WMS）全栈演示 Demo。设计和交互风格高度复刻**NiceC WMS后台**（包括左侧深色导航栏、顶部多标签Tab切换、高密度多条件筛选、出库一件代发流程以及波次管理等）。

---

## 🏗️ 全栈系统架构说明

为了简化依赖管理和本地运行，本项目采用 **Vite + Express 极简全栈单体代码仓（Unified Monorepo）** 架构。

*   **前端（Frontend）**：运行于 `/src` 目录下，基于 **React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons** 构建，具有像素级还原度与精细的卡片间距。
*   **后端（Backend）**：运行于 `/server` 与 `/server.ts`，基于 **Node.js + Express** 构建，具备完整的多参数查询过滤、出库单完整 CRUD 存储、波次合并及 JWT Auth。
*   **数据层（Data Layer）**：
    *   **开发预览环境**：内置 JSON 本地持久化文件存储引擎（`/server/db.ts` & `/server/data.json`），开箱即用，支持各种复杂数据的增删改查。
    *   **生产环境**：提供完整生产级 **Prisma ORM 映射模式**（`/prisma/schema.prisma`）及 **PostgreSQL** 数据引擎，支持快速数据迁移和表关系映射。

---

## 🔑 默认登录账户

系统已开启 JWT 登录保护，支持以下两组预设演示账户，密码可输入任意字符：

| 角色 / 身份 | 用户账号 | 预设密码 | 备注 |
| :--- | :--- | :--- | :--- |
| **超级管理员 (Admin)** | `neal@nicec.net` | `任意输入` | 拥有全部出库、编辑、删除及波次归集权限 |
| **仓库操作员 (Operator)** | `operator` | `任意输入` | 基础仓储作业权限 |

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

### 2. 数据库迁移与初始化 (Prisma Migration & Seed)
在容器或宿主机运行 Prisma Migrate 进行表结构初始化：
```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送并执行 PostgreSQL 数据库迁移
npx prisma db push
```

### 3. 数据种子脚本
可以编写如下 Seed 脚本或调用我们提供的 API 进行初始化 demo 数据生成。

---

## 📊 后端 REST API 接口文档

后端运行于 `port:3000`，提供以下 11 个标准的 REST API 路由：

### 1. 登录认证 (JWT Auth)
*   `POST /api/auth/login`
    *   **Payload**: `{ "username": "neal@nicec.net", "password": "any" }`

### 2. 出库单核心管理 (Outbound Orders CRUD)
*   `GET /api/outbound-orders`：多维检索出库列表（支持分页、排序、18个多维度Tab字段过滤）
*   `GET /api/outbound-orders/:id`：获取出库订单详情（含包裹明细、产品条码、客户、承运渠道）
*   `POST /api/outbound-orders`：创建新的一件代发出库单
*   `PUT /api/outbound-orders/:id`：更新/编辑出库单状态或 SKU 信息
*   `DELETE /api/outbound-orders/:id`：删除出库单

### 3. 波次处理与归集
*   `POST /api/outbound-orders/batch-generate-wave`
    *   **Payload**: `{ "orderIds": ["ord_1", "ord_2"] }`：选择多个待处理订单进行拣货波次批量归集（自动生成 `WV2026xxxx` 编号并转移状态）

### 4. 辅助基础元数据 API
*   `GET /api/customers`：拉取对应 WMS 注册的商户列表
*   `GET /api/carriers`：拉取主流承运商
*   `GET /api/logistics-channels`：拉取指定服务渠道
*   `GET /api/products`：获取基础 SKU 商品库

---

## 🎨 页面复刻亮点及功能特性

1.  **极高逼真度企业级 UI**：
    *   左侧导航 `#071225` 配合出库高亮、右侧展开指示箭。
    *   顶部 Header `#062B66` 深蓝色企业质感，包含完整的 nc-NO.1 仓库选择器、通知铃、用户状态。
    *   内置全部 `待处理(4)`、`待拣货(7)`、`待复核(446)`、`已出库(26147)` 真实数量偏移。
2.  **出库一件代发核心流**：
    *   **新建出库单**：支持选择绑定多款爆品 SKU（如 *289-TX-69*、*TS-V-NA-4*），可灵活添加多条产品行并设置数量。
    *   **详情透视**：支持在表格中点击 OBS 编号一键拉起侧弹窗，极速展示当前物流追踪状态及分拨包裹明细。
    *   **生成波次**：勾选多条订单后，点击蓝色的“生成波次”，系统将对该组订单合规分配并生成独有波次序列号。
    *   **快速更新**：可在表格行中进行多状态手动快捷更改（如更新面单是否已打印状态）。
