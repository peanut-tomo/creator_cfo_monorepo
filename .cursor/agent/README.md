# `.cursor/agent` 目录说明

本目录存放 **Harness / Testor / Dev** 三个角色的提示词与行为边界（`harness.md`、`testor.md`、`dev.md`）。

## 维护约定（给人类与 Agent）

- 这些文件属于**仓库级、长期稳定**的角色配置，不是「当前需求的草稿纸」。
- 在开发具体需求、对照各类《开发指南》或外部文档时，**默认不要改写**本目录下的 `.md`，避免把单次任务的口径或临时约定写进全局角色定义。
- 若确需调整流程或角色职责：先在 PRD、`.cursor/rules/work_flow.md`、`AGENTS.md`、`.cursor/prd/agent-dev-guide-summary.md` 等**规范与需求层**写清变更原因与生效范围；再在**独立提交**中**小步、可审**地更新本目录文件，并在 PR 或说明里明确「为何改 agent」。

工作流程中对本约定的引用见 `.cursor/rules/work_flow.md`。
