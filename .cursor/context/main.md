# Context Snapshot

## 维护约定

- **每完成一条 feat / 需求**：在下方 **History** 里 **新增** 一节 `### 0.x.0`（次版本递增：`0.1.0` → `0.2.0` → `0.3.0` …），**禁止删除或改写**旧节；只在 **Current** 更新最新版本号、日期与一行摘要。
- 该节建议包含：`updated_at`、`scope`（对应 PRD/需求名）、本版 **Active Decisions**、**Implemented Structure** 增量；验证命令可写「同仓库 AGENTS.md」避免重复。
- 跨版本仍开放的事项放在 **Open follow-ups**，新需求完结时勾选或改写，不必复制进每一版 History。

## Current

- version: **0.3.0**
- updated_at: 2026-03-27
- scope: 移动端壳层含登录门、四 Tab、主题与语言；在 RN 本地优先基线之上

---

## History

### 0.3.0 — login / tabs / app shell

- updated_at: 2026-03-27
- scope: `feat/login_and_tab` 等；登录门、四 Tab、主题与 locale、本地 bootstrap 状态
- **Active Decisions**
  - Monorepo 仍为基线；前端为 Expo + React Native + Expo Router。
  - 当前阶段无后端；结构化数据在 SQLite，文档在本地文件仓。
  - 主题、语言、本地 session 摘要等在 AsyncStorage，遵循 storage 契约。
  - 真源：`packages/storage`、`packages/schemas`、`docs/contracts`、根目录 Agent 规则。
- **Implemented Structure**
  - `apps/mobile`：Expo Router，登录门、四 Tab 壳、主题与语言切换、本地 bootstrap。
  - `packages/storage`：契约、路径辅助、契约测试。
  - `packages/ui`：RN 展示原语。
  - `packages/schemas`：创作者产品模块、平台与工作流原则。

### 0.2.0 — Next 到 RN（Expo）与本地存储

- updated_at: （按该需求实际合并日填写）
- scope: `project_next_to_rn`；前端由 Next 转向 Expo + RN；数据侧为本地 SQLite + 文件仓，无后端 API
- **Active Decisions**
  - 本地优先：结构化库与文件仓均在前端；暂不引入后端。
  - 契约与文档以 schema-first 维护，与 `AGENTS.md` 对齐。
- **Implemented Structure**
  - `apps/mobile` 以 Expo 应用为主承载；存储契约与 `docs/contracts` 随 RN 阶段更新。

### 0.1.0 — 仓库与契约基线

- updated_at: （按该需求实际合并日填写）
- scope: `project_init`；多包 monorepo、规范、测试与目录结构；创作者财务产品方向立项
- **Active Decisions**
  - 产品定位为多平台收入创作者的财务控制台（收入、成本、税务预估、现金流等聚合方向）。
  - 建立 storage / schemas / contracts 首版与自动化测试基线。
- **Implemented Structure**
  - Monorepo 目录、包边界与 README 说明；契约与 schemas 初版。

---

## Open follow-ups

- 在 Ledger、Discover 上基于本地 SQLite 与文件仓契约落地真实功能切片。
- Apple 登录是否在后续引入后端的 PRD 中与账号同步，待 PRD 决策。
- 后端或同步能力仅通过新 PRD 引入。

## Verification（仓库门禁，各版通用）

- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm contract:check`
- `pnpm build`
- `pnpm smoke`（及 `tests/smoke/README.md` 手工设备项）
