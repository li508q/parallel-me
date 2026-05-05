# 02 · Roundtable, Agents, And Scribe Memory

> 单 chat 框不是 ParallelMe 的范式。v0.7 的关键资产是结构化对象：本次议题、五声立论、自由圆桌、书记员问询、偏好刻画、清明落定。

## 1. Post-Chat Direction

业界趋势从单 chat 框转向：

- visible affordances
- structured input
- direct manipulation
- scoped assistance
- living objects

ParallelMe 对应：

- 不是“问 AI 怎么办”，而是“把本次议题放到五声圆桌上”。
- 不是滚动聊天记录，而是可比较、可回看的圆桌痕迹。
- 用户不靠 prompt 控制一切，而是通过操作台提问、续轮、对峙、补充和结束自由圆桌。

参考：

- https://www.designersforest.com/the-chat-box-isnt-a-ui-paradigm-its-what-shipped/
- https://www.mmntm.net/articles/beyond-chat-interfaces
- https://medium.com/user-experience-design-1/where-should-ai-sit-in-your-ui-1710a258390e

## 2. Fixed-Voice Roundtable

旧多 agent 辩论范式有启发，但 ParallelMe 不追求更像辩论。五声圆桌要做的是让固定五声从不同价值位置看同一个议题。

保留：

- 多个声音分别表达。
- 用户自由介入。
- 声音之间暴露盲点、代价和被忽略的保护意图。

删除：

- 攻击性辩论。
- 自动召唤新角色。
- 角色扩展和声音升格。
- 声浪最大、声浪最小等粗指标。

v0.7 编排：

- 本次议题：书记员把原始输入整理成可讨论对象。
- 五声立论：固定五声第一轮结构化表态。
- 自由圆桌：用户推动续轮、问某声、问全桌或两声对峙。
- 书记员问询：书记员验证用户在五声之间的偏好刻画。
- 清明落定：输出清明句、偏好读数、代价承认、此刻落点和 24h 承诺。

参考：

- https://docs.ag2.ai/latest/docs/user-guide/basic-concepts/introducing-group-chat/
- https://microsoft-autogen-85.mintlify.app/guides/multi-agent-workflows
- https://arxiv.org/abs/2305.14325

## 3. User Intervention As Product Value

ParallelMe 的价值不是更强自动化，而是让用户以低成本表达主权。

关键设计：

- 本次议题必须可审阅、可原地改写。
- 五声第一轮必须可比较。
- 自由圆桌不使用死板反应标签。
- 用户可以让某声继续、问某声、问全桌或选择两声对峙。
- 书记员问询必须验证偏好，而不是继续追问背景。

这类摩擦不是阻碍，而是用户把自己从单一声音里取回来的方式。

## 4. Scribe Memory

长期价值不是“AI 记得更多隐私”，而是用户能观察自己如何在固定五声之间形成偏好和代价承认。

书记员记录：

- 用户问了谁。
- 用户让谁继续说。
- 用户选择了哪些对峙。
- 用户向全桌补充了什么。
- 用户在问询中验证了哪些偏好。
- 用户承认或拒绝了哪些代价。
- 用户如何改写清明句。

不做：

- 偷偷记忆。
- 情感依赖式回访。
- 角色亲密关系模拟。
- 打卡和连胜。
- 对声音打分或排名。

参考：

- https://research.google/pubs/pub51202/
- https://memgpt.ai/
- https://mem0.ai/
