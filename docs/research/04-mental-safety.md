# 04 · Safety, Privacy, Market, And Technical Evidence

> ParallelMe 触达脆弱议题，因此安全不是合规尾巴，而是产品结构的一部分。

## 1. Safety Principles

必须坚持：

- off-ramps over engagement
- 显式 AI 身份
- 层次化透明度
- 适应性同意
- 本地优先
- 危机时停止普通生成

参考：

- https://figma.com/blog/headspace-ebb-ai-companion
- https://childmind.org/blog/how-we-built-responsible-ai-in-mirror-journal/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC12234568/
- https://www.nice.org.uk/corporate/ecd7

## 2. Dark Patterns To Reject

AI 陪伴产品的风险：

- 离开挽留
- 罪恶感诱导
- 付费暗示
- streak / 打卡强化
- AI 与人混淆
- 危机时继续情感 engagement

ParallelMe 反向设计：

- 不挽留。
- 不做 streak。
- 不把声音做成可购买角色。
- 记忆必须用户同意。
- 危机时不输出清明句和承诺。

参考：

- https://www.hbs.edu/ris/Publication%20Files/Emotional%20Manipulations%20by%20AI%20Companions%20(10.1.2025)_a7710ca3-b824-4e07-88cc-ebc0f702ec63.pdf

## 3. Competitive Landscape

有价值的对照：

| 产品 | 可学 | 不学 |
| --- | --- | --- |
| IFS Guide | 正统 IFS 训练意识 | AI practitioner 替代感 |
| InnerOS | 多视角结构 | 通用 archetype 过强 |
| Mindscape | IFS journaling 与 lifetime 思路 | 用户手动维护 parts 负担 |
| Unblend | parts map 和治疗间隔支持 | 治疗师 B2B 作为主线 |
| Headspace Ebb | 透明、可删、临床协作 | AI 陪伴人格化 |
| Stoic | 本地优先和短实践 | streak 和激励机制 |

ParallelMe 差异化：

- 固定五声，不做角色市场。
- 用户主持，不让 AI 替用户决定。
- 清明句 + 24h 承诺，而不是长期陪聊。
- 本地优先，数据可删。

参考：

- https://ifsguide.com/
- https://inneros.ai/ifs-therapy-app
- https://www.mymindscape.co/
- https://unblend.me/
- https://stoic.li/

## 4. Technical Evidence

本地优先：

- IndexedDB 适合结构化本地记录。
- Dexie 提供 schema、查询和 live query，复杂度低。
- 服务端无状态能降低隐私风险。

LLM 编排：

- 自写阶段状态机更贴合产品。
- 通用 agent framework 可参考，但不应接管核心流程。
- 多服务商兼容 provider abstraction 保留模型选择自由。

Design tokens：

- CSS variables + Tailwind v3 是当前稳定路径。
- 两层 token 足够，暂不引入 component token。

参考：

- https://dexie.org/
- https://rxdb.info/articles/localstorage-indexeddb-cookies-opfs-sqlite-wasm.html
- https://vercel.com/blog/ai-sdk-5
- https://www.bootspring.com/blog/design-tokens-system-guide
