# ParallelMe v0.6 · Technical Architecture

> 工程方向：轻便、本地优先、服务产品形态。技术复杂度必须服务于五声会谈，而不是反过来定义产品。

## 1. Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind v3.4 + CSS variables
- Dexie / IndexedDB
- 多服务商兼容 provider abstraction

不引入：

- UI 组件库
- 全局状态管理库
- 服务端数据库
- 账号系统
- 大型 agent framework

## 2. Data Model

新库名：`ParallelMeV4`。不读取旧档案，不迁移旧结构。

核心字段：

- `petition`
- `clarifyingAnswers`
- `workingFocus`
- `activatedVoices`
- `voiceTurns`
- `calledVoice`
- `followups`
- `roleReversalTurns`
- `crossClarifications`
- `claritySentence`
- `nowMe`
- `commitment24h`
- `memoryConsent`

v0.6 不新增用户自定义声音表，不新增声音升格表。五声长期演化通过现有会谈记录派生。

## 3. API

当前主端点：

- `POST /api/focus`：追问与工作焦点生成。
- `POST /api/voices`：固定五声激活理由与表态。
- `POST /api/clarify`：点名追问、换位回应、五声互问。
- `POST /api/nowme`：清明句、NowMe、24h 承诺草案。

保留：

- `POST /api/provider/test`
- `POST /api/taste`
- `POST /api/share`
- `GET /api/agent`

可新增：

- `POST /api/intent`：轻量意图理解。
- `POST /api/weekly`：固定五声周度侧记。

不恢复旧会谈主链路。

## 4. LLM Runtime

Provider config 可来自：

- 浏览器本地保存
- session 保存

服务端规则：

- 不持久化 API key。
- 不持久化用户内容。
- 不打印 API key。
- API route 只接受本次请求携带的 provider payload，做编排和转发。

内置 provider：

- DeepSeek：默认推荐 `deepseek-chat`，长期部署可手动改 `deepseek-v4-flash`
- 阿里云百炼：默认 `qwen-plus`
- Kimi：默认 `kimi-k2.6`
- MiniMax：默认 `MiniMax-M2.7`
- 豆包 / 火山方舟：默认 `doubao-seed-1-6-251015`，也允许填 `ep-...` 接入点
- 自定义兼容接口：用于其他 `/chat/completions` 服务

## 5. Derived Voice Layer

`lib/voices.ts` 从 `db.meetings` 派生：

- 五声统计
- 单声活动史
- 承诺复盘状态
- 最响声音
- 被追问 / 被换位次数

优点：

- 删除单次记录后统计自然更新。
- 不需要双写一致性。
- 先把固定五声做深。

## 6. Intent Recognition

实现方向：

- 客户端先根据当前选中的声音和 stage 做显性绑定。
- 文本意图只分类为 pause / continue / ask_voice / note / correct。
- 高置信度才触发流程动作。
- 触发动作前允许用户改成“只记录”。

不要做复杂正则命令语言。

## 7. Safety

危机检测在普通链路前执行。

检测到明确自伤、自杀或伤害他人表达时：

- 返回 `crisis: true`
- 不继续普通会谈生成
- 前端显示安全提示和专业资源

## 8. Build And Verification

每次结构性改动后至少验证：

- `npm run build`
- 首页无旧模式选择。
- `/meeting` 不重复插入陈情。
- `/api/voices` 只返回固定五声。
- `我的声音` 不展示新增声音入口。
- 危机表达不进入普通会谈。
