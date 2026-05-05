# 02 · Interaction, Agents, And Memory

> 单 chat 框不是 ParallelMe 的范式。ParallelMe 的关键资产是结构化对象：陈情纸、工作焦点、声音牌、时间轴、清明句、纸页。

## 1. Post-Chat Direction

业界趋势从单 chat 框转向：

- visible affordances
- structured input
- direct manipulation
- scoped assistance
- living objects

ParallelMe 对应：

- 不是“问 AI 怎么办”，而是“把五声请到桌面上”。
- 不是滚动聊天记录，而是阶段化会谈记录。
- 用户不靠 prompt 控制一切，而是点击声音牌、追问、换位、修正。

参考：

- https://www.designersforest.com/the-chat-box-isnt-a-ui-paradigm-its-what-shipped/
- https://www.mmntm.net/articles/beyond-chat-interfaces
- https://medium.com/user-experience-design-1/where-should-ai-sit-in-your-ui-1710a258390e

## 2. Multi-Voice Orchestration

旧多 agent 辩论范式有价值，但 v0.6 不追求“更像辩论”。

保留：

- 多个声音分别表达。
- 用户手动介入。
- 声音之间提出盲点和代价。

删除：

- 攻击性辩论。
- 自动召唤新角色。
- 复杂组装和升格。

v0.6 编排：

- Focus：整理工作焦点。
- Voices：固定五声激活。
- Dialogue：表态、点名追问、换位回答。
- Clarify：互问代价与盲点。
- NowMe：清明句与 24h 承诺。

参考：

- https://docs.ag2.ai/latest/docs/user-guide/basic-concepts/introducing-group-chat/
- https://microsoft-autogen-85.mintlify.app/guides/multi-agent-workflows
- https://arxiv.org/abs/2305.14325

## 3. User Intervention As Product Value

ParallelMe 的价值不是更强自动化，而是恰到好处的摩擦。

关键设计：

- 工作焦点必须用户确认。
- 五声后必须至少追问一声。
- 用户可换位回答。
- 用户可指出表达不准。
- 记忆必须用户同意。

这类摩擦不是阻碍，而是用户主权。

## 4. Long-Term Memory

长期价值不是“AI 记得更多隐私”，而是用户能观察固定五声的变化。

保留的长期指标：

- 最响声音
- 被压住声音
- 被追问声音
- 被换位回答声音
- 与 24h 承诺相关的声音
- 与暂停、逃避、复盘相关的声音

不做：

- 偷偷记忆。
- 情感依赖式回访。
- 角色亲密关系模拟。
- 打卡和连胜。

参考：

- https://research.google/pubs/pub51202/
- https://memgpt.ai/
- https://mem0.ai/
