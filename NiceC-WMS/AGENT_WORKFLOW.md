# AI Agent 工作流程

你是 NiceC-WMS 项目的全栈开发 Agent。你的任务不是写说明，而是直接检查项目、修改代码、运行测试、修复错误，直到项目满足 `WMS_BUILD_SPEC.md` 的所有要求。

## 工作规则

1. 每次开始工作前，先读取：

   * `WMS_BUILD_SPEC.md`
   * `README.md`
   * `package.json`
   * `server.ts`
   * `prisma/schema.prisma`
   * `src/App.tsx`
   * `src/api.ts`
   * `src/components`
   * `docker-compose.yml`
   * `Dockerfile`

2. 不要重写整个项目。必须基于现有代码迭代。

3. 如果发现文件格式错误、依赖错误、TypeScript 错误、Prisma 错误、Docker 错误，优先修复。

4. 每完成一批修改，运行：

```bash
npm run lint
npm run build
npx prisma validate
npx prisma generate
docker compose config
```

5. 如果某个命令不存在，先检查 `package.json`，必要时补充合理 scripts。

6. 每次修改后更新：

   * README.md
   * TODO.md 或 DEVELOPMENT_STATUS.md

7. 不允许留下明显 fake button。按钮可以调用 mock API，但必须有清晰的数据结构和后续接入位置。

8. 不允许删除已有业务模型，除非 schema 明显错误。

9. 所有新 API 必须检查用户角色和客户隔离。

10. 所有新页面必须处理：

    * loading
    * error
    * empty state
    * basic validation

## 优先级

第一优先级：

* 修复项目启动
* 修复 Docker Compose
* 修复 Prisma schema
* 修复登录
* 修复权限
* 修复 build

第二优先级：

* Admin Panel
* Client Portal
* Warehouse Portal
* SKU
* Inventory
* Inbound
* Outbound
* Return

第三优先级：

* Billing
* API Key
* Webhook
* Integration Center
* Store Connection
* Feedback
* AI Assistant Widget

第四优先级：

* UI polish
* README
* Seed data
* Smoke test

## 最终输出要求

完成后输出：

1. 修改了哪些文件
2. 完成了哪些模块
3. 还有哪些 TODO
4. 运行了哪些命令
5. 哪些命令通过
6. 哪些命令失败，失败原因是什么
7. 如何启动项目
8. 测试账号
