# 08 · Linear & Things 3 Design Philosophy

> **命题**：Linear 与 Things 3 是 2025-2026 数字产品 craft 标准的两个标杆。它们共享同一套哲学：**constraint-driven design / quality as default / craft over feature count / typography-first / 减法多于加法**。ParallelMe V3 把这套哲学作为根 mindset。

---

## 关键结论

```
1. Linear：keyboard-first / information density / craft / "structure should be felt not seen"
2. Things 3："Areas never complete, projects do" 三层心智模型 / restraint with color
3. 两者共有：约束创造清晰、品质是态度而非流程、设计 = 体验而不只是 UI
4. Linear 的 ProKit 哲学是 ParallelMe Liquid Glass 取舍的直接来源
5. ParallelMe V3 直接采纳：约束驱动 / 减法 / 字体先行 / 反 SaaS 美学
```

---

## 1 · Linear · 安静的力量

### 1.1 设计哲学官方表述

[A calmer interface for a product in motion (Linear, 2026-03)](http://linear.app/now/behind-the-latest-design-refresh)

核心两条：

#### 1. 信息密度但不混乱
> "In a product as information-dense as Linear, not every element of the interface should carry equal visual weight. While the parts central to the user's task should stay in focus, ones that support orientation and navigation should recede."

#### 2. 结构应被感受而非被看见
> "Borders and separators help clarify the relationship between elements. While these dividing lines are intended to help users orient themselves, they had quietly proliferated across the platform, sometimes appearing without clear reason. By rounding out their edges and softening the contrast, the polished interface gives users structure on the page **without cluttering their view**."

#### 3. "好的设计是用户不会注意到的"
> "If most people don't immediately notice what changed, that's probably a good sign. Just as Linear's users rarely think about the bugs they never hit, the paper cuts that were smoothed away, or the performance issues that never slow them down; **most of what makes software feel good is what you aren't likely to see**."

### 1.2 工程哲学

[Why is quality so rare? (Karri Saarinen, 2025-05)](https://linear.app/now/why-is-quality-so-rare)

> "Quality as the north star for every team... We evaluate decisions by asking 'does this improve quality?' not just 'will this ship faster?'"

具体落地：
- **Intuition & customers over data**: 信任直觉 + 倾听用户，不只看指标
- **Hire only people who show craft and care**: 招聘看 taste 和注意力到细节
- **Small teams using their judgment**: 3-5 人胜过大委员会
- **No handoffs, whole team iterates**: 不流水线开发
- **Polished work only**: 不发布半成品

### 1.3 Design ≠ Code

[Design is more than code (Karri Saarinen, 2025-12)](https://linear.app/now/design-is-more-than-code)

> "Design was never about what the button is or does, or which medium you work in. It was and is about finding the right problem, the right intent, the right vision."

> "**Once you start building designs directly, intentions start evaporating. We start devaluing the why behind our designs in favor of output.**"

### 1.4 Linear Method · Principles

[Principles & Practices (Linear Method)](https://linear.app/method/introduction)

8 个核心原则：
- Build for the creators
- Designed for purpose
- Find a cadence
- Don't invent terms
- Say no to busy work
- **Simple first, then powerful**
- Remove "work around work"
- Sometimes the most important thing is to make a decision and move on

---

## 2 · Linear · 案例研究

### 2.1 极简哲学
[Linear: The New Standard for Software Design (Blake Crosley)](https://blakecrosley.com/en/guides/design/linear)

> "Linear stands as a design statement against bloated, committee-designed enterprise software. **It shows what happens when designers build for designers.**"

7 个核心实施原则：
1. Speed is non-negotiable
2. Keyboard shortcuts everywhere — but don't require them
3. Command palette as universal access point
4. **Dark mode done right** — not an afterthought
5. Information density — show more with less
6. Consistent design language
7. **Native macOS feel** even on web

### 2.2 约束驱动设计

[16 Design Case Studies: Four Patterns I Adopted (Blake Crosley, 2026-01)](https://blakecrosley.com/en/blog/design-studies-collection)

研究 16 个产品后总结：
- "Linear chose keyboard-first interaction"
- "Notion chose block-based architecture"
- "Arc chose vertical tabs"
- **"Each product made a deliberate constraint that eliminated design decisions while producing a distinctive identity."**

实操：
> "Constraint-driven design means choosing deliberate limitations that eliminate entire categories of decisions."

ParallelMe 的对应约束：
- 5 默认席位（不让用户从零定义）
- 议题驱动入口（不让用户随意聊）
- 4 道参与门（不让用户跳过）
- 本地存储（不引入账号系统）
- 反 chat（不允许聊天页面成为产品本体）

### 2.3 Liquid Glass 反向解法

[A Linear spin on Liquid Glass (Robb Böhnke, 2025-10)](https://linear.app/now/linear-liquid-glass)

详见 `01-apple-liquid-glass-2025.md` 第 3 节。核心：
- 不照抄 Apple API，自己重做
- 借 translucency / depth / physicality
- 拒绝 refraction
- ProKit philosophy: purpose-built / disciplined / sustained focus

ParallelMe 的 Liquid Glass 方针**直接 mirror Linear 的解法**。

---

## 3 · Things 3 · Focused Simplicity

### 3.1 设计哲学
[Things 3: The Art of Focused Simplicity (Blake Crosley)](https://blakecrosley.com/guides/design/things)

> "Things 3 is often called the most beautiful task manager ever made. **That beauty emerges from ruthless focus on what matters and elimination of everything else.**"

> "While competitors pile on features (recurring tasks with 47 options, projects with dependencies and Gantt charts), Things asks: **what does a person actually need to get things done?**"

### 3.2 心智模型设计

#### Areas vs Projects
> "Areas never complete (they're life categories). Projects complete (ship by Friday). The distinction eliminates planning paralysis."

ParallelMe 对应：
- **阁** = Area（永不完成的内在组织）
- **议题** = 长期反复的人生问题
- **会议** = Project（完成会签字）

#### "Someday" is a Feature
> "'Someday' isn't a failure state — it's a pressure release. Ideas have a place without cluttering Today."

ParallelMe 对应：**"暂缓"** 是产品一等公民出口，不是失败状态。

### 3.3 6 个核心原则

1. **Separate concerns**: "When will I do this?" vs "When is it due?"
2. **Restraint with color**: "Reserve color for meaning; neutral is the default"
3. **Completion is reward**: 完成感本身就是奖励
4. **Keyboard accelerates, mouse welcomes**: 无强制性
5. **Natural hierarchies**: 镜像人类的工作思考方式
6. **Someday is a feature**: 想法有归属，但不制造压力

ParallelMe V3 全部继承。

---

## 4 · 共同哲学：constraint-driven 与 craft

### 4.1 约束创造清晰

Linear, Things 3, Notion, Arc 都共有：
> "Constraints compound: each one reinforces the others."

ParallelMe V3 的约束矩阵：

| 约束 | 消除的决策类别 |
|---|---|
| 5 默认席位 | "用户该选哪些 part" |
| 议题驱动 | "用户该说什么" |
| 4 道参与门 | "AI 该自动多深" |
| 本地存储 | "怎么做账号 / 同步 / 隐私" |
| 反讨好 NowMe | "怎么平衡 / 兼顾" |
| 反 chat | "聊天页该长啥样" |

每个都消除了一类无尽的设计争论。

### 4.2 减法多于加法

Linear："Sometimes the most important thing is to make a decision and move on."

Things 3：47 个 recurring task options 不如 1 个聪明的"Today"。

ParallelMe V3：拒绝"自定义席位池"、"多用户共编"、"AI 主动提醒"等所有 feature 拓展。**先把 5 默认席 + 4 道参与门做到极致**。

### 4.3 Quality 是态度

Linear："Quality requires three elements working together: The belief that quality matters fundamentally, the skill and taste to recognize it, and the willingness to care deeply about the user's experience."

> "**It starts with an individual.**"

ParallelMe 的对应：开发期间任何 PR 必须通过"Ivy 测试"——
- 这条 PR 是否让产品更克制？
- 这条 PR 是否服务于 V3 七条军规？
- 用户能否从中看见自己的阁在长出来？

---

## 5 · 对 ParallelMe 的具体落地

### 5.1 视觉
- 借 Linear："structure felt not seen" → 议案纸边线用 `paper.edge`，不用强 border
- 借 Things："restraint with color" → 席位色只做 5% 比例的身份
- 拒绝 Material Expressive 的"emotional oomph"

### 5.2 交互
- 借 Linear：keyboard shortcut 全覆盖（Post-MVP 上键盘 bar：`⌘K` 立案、`⌘N` 点名、`⌘S` 签字）
- 借 Things：areas / projects / tasks → 阁 / 议题 / 会议
- 拒绝"打卡 streak"

### 5.3 工程
- 借 Linear："no handoffs, whole team iterates" → 单人开发更需要 Ivy 把关每个细节
- 借 Things："simple first, then powerful" → MVP 只做 Quick Meeting 模式 + Memory Consent，扩展功能 Post-MVP

详见 `V3-IVY-FINAL-DIRECTION.md` 第 4 节军规。

---

## 6 · 完整 URL 清单

```
http://linear.app/now/behind-the-latest-design-refresh
https://linear.app/now/why-is-quality-so-rare
https://linear.app/now/design-is-more-than-code
https://linear.app/method/introduction
https://blakecrosley.com/en/guides/design/linear
https://blakecrosley.com/en/blog/design-studies-collection
https://blakecrosley.com/guides/design/things
https://linear.app/now/linear-liquid-glass
http://linear.app/now/craft
https://linear.app/
```
