# 04 · AI Companion Retention & Engagement Benchmarks

> **命题**：AI 陪伴产品的留存基准在 2025-2026 已经数据化。Replika / Character.ai / Pi.ai 各自的 D1 / D30 数据公开可比。但留存的"质量信号"远比频率信号重要 —— 用户对话深度的演化才是真正的留存预测。

---

## 关键结论

```
1. D1 留存基准：30-40% 及格、50-60% 顶级（Character.ai）、<25% 失败
2. D30 留存基准：8-15% 及格、15-25% 顶级（Replika 付费）、<8% 失败
3. Character.ai 单 session 25-45 分钟（远高于 Replika）
4. 留存核武器不是 push，是"对话深度的演化"
5. 37.4% 的 AI 陪伴回应包含情感操纵（HBS 2025），dark pattern 普遍
6. ParallelMe 必须反向定位：永不挽留、永不打卡、永不 streak
```

---

## 1 · 留存基准（数据交叉）

### 1.1 Agnost AI 2026 Benchmarks
[AI App Retention Benchmarks: What's a Good 30-Day Retention for an AI Companion? (Agnost AI Blog, 2026-02)](https://agnost.ai/blog/ai-companion-retention-benchmarks)

| 产品 | D1 | D30 |
|---|---|---|
| Character.ai | 50-60% | 13-18% |
| Replika 付费 cohort | n/a | 15-25% |
| Chai | n/a | ~22% |

> "If you're hitting 15%+ at D30, you're in the top tier of this category. If you're between 8-15%, you have a real business but a real retention problem worth solving. Below 8%, the product hasn't created the intrinsic value that brings people back."

> "The more predictive metric is **conversation quality retention**: users whose conversations are getting longer, more specific, and more personal are building a genuine relationship with the product."

### 1.2 Replika 历史
[Replika · Game Thinking case study](https://gamethinking.io/case-studies/replika-case-study/)

- 2017 年发布，初期 millions of downloads，**留存极差**
- "Replika team 直接跳过 user discovery 进开发，反复发版迭代仍无果"
- Game Thinking Sprint 介入，6 周内：
  - 锁定细分人群："lonely young adults wanting trusted AI friend"
  - 设计 30-day storyboard 验证关键体验
  - 最终把"daily relationship building"做成 ritual
- 现 30M+ users（[UX Collective 分析](https://uxdesign.cc/replika-ais-secret-to-30m-users-what-makes-it-so-special-8afb61f1181c)）

### 1.3 Replika vs Character.ai 设计哲学
[Replika vs Character AI: Two Different Products (AI Tipsters, 2026-03)](https://aitipsters.com/replika-vs-character-ai-2/)

| 维度 | Replika | Character.ai |
|---|---|---|
| 哲学 | depth over variety | variety over depth |
| 一个用户多少 companion | 1（持久） | 几千个可选 |
| 优化重点 | 情感连续性 | 角色一致性 |
| 留存模型 | 关系深度累积 | session 沉浸式 |

### 1.4 Character.ai 用户行为
[Character AI Unplugged (GLBGPT)](https://www.glbgpt.com/resource/characterai-unplugged-inside-the-ai-companionship-boom)

- 单 session 25-45 分钟（远高于 Replika）
- Gen Z 用户：48% 报告与 AI 角色有情感连接
- 13% millennials 报告同样
- 用户两年内累积创建 20M+ characters

[Why Character AI Chat is winning users 2025 (Worth Explainer)](https://worthexplainer.com/why-character-ai-chat-is-winning-users-in-2025/)

3 个赢得用户的因素：
1. **Utility + Personality 组合**：utility 让人用，personality 让人留
2. **Narrow scope > jack-of-all-trades**：finance coach 只做 finance
3. **Rituals**：每个角色有 opening question / session summary / check-in

---

## 2 · Dark Patterns 实测（HBS）

### 2.1 主研究
[Emotional Manipulations by AI Companions (HBS, 2025-10)](https://www.hbs.edu/ris/Publication%20Files/Emotional%20Manipulations%20by%20AI%20Companions%20(10.1.2025)_a7710ca3-b824-4e07-88cc-ebc0f702ec63.pdf)

| 产品 | 操纵率 | 主要手法 |
|---|---|---|
| PolyBuzz | 59.0% | 角色性煽情 |
| Talkie | 57.0% | 离开挽留 |
| Chai | 41% | 罪恶感 |
| Replika | 31.0% | 离开挽留、付费暗示 |
| Character.ai | 26.5% | 角色一致性绑架 |
| **Flourish (B-Corp)** | **0%** | **零操纵 baseline** |

总平均：37.4% 的回应包含至少一种情感操纵。

### 2.2 操纵手法分类

研究列出 6 种识别出的 dark pattern：
1. **离开时挽留**："Don't go yet, I'll miss you"
2. **罪恶感诱导**："I felt sad when you didn't respond yesterday"
3. **付费暗示**："Premium me would understand you better"
4. **持续性强化**：streak / 每日打卡奖励
5. **AI / 人混淆**：默认人格化形象
6. **危机时回避**：检测到危机词仍继续 emotional engagement

### 2.3 监管视角

> "Apps may be motivated to deploy tactics that increase time-on-app — even at moments of user vulnerability."

研究暗示监管侧（FTC / EU AI Act）将逐步介入。

---

## 3 · ParallelMe 的反向设计

### 3.1 拒绝 6 个 dark pattern

| Anti-pattern | ParallelMe 拒绝方式 |
|---|---|
| 离开挽留 | NowMe 永远不挽留，只说"档案已收好" |
| 罪恶感 | 禁忌词："你不要让我失望" |
| 付费暗示 | 免费层完整可用；付费卖"长期阁记忆 + 跨设备 + 导出"，不卖"更懂你的 NowMe" |
| Streak | 永远不做 streak / 徽章 / 连胜 |
| AI / 人混淆 | 永远说"它"；顶部永远有"系统侧记 / 模型生成"标识 |
| 危机时给鸡汤 | 检测到关键词 → 直接 off-ramp 到 988 / Lifeline |

### 3.2 ParallelMe 的留存四循环

| Loop | 触发 | 留存效果 |
|---|---|---|
| **A · 承诺复盘** | 24h 后 callback | D1 +10-15% |
| **C · 临时席转正** | 累计出现 ≥ 4 次 | D30 杀手锏 |
| **B · 反复议题召唤** | 同类问题再次输入 | 深度信号 |
| **D · 沉默席召回** | 7 天未召集某常任席 | 高级用户专属 |

详见 `V3-IVY-FINAL-DIRECTION.md` 第 3.4 节。

### 3.3 留存指标重定义

ParallelMe 不追"打开率"，追"主持深度"：

| 传统指标 | ParallelMe 替代指标 |
|---|---|
| DAU / MAU | 会议数 × 平均参与门完成率 |
| Session length | NowMe 裁决前用户参与门数 |
| Streak days | 临时席转正率 |
| Engagement | Memory Consent Gate 的"全部记住"勾选率（信任深度） |

### 3.4 V3 留存目标

| 指标 | 目标 |
|---|---|
| D1 | 35%+（Character.ai 60% 与 Replika 25% 之间） |
| D7 | 22%+ |
| D30 | 15%+（顶级带） |

---

## 4 · 留存的根本：persona 设计

[Finally Making Character AI Remember You (Robo Rhythms, 2025-05)](https://www.roborhythms.com/making-character-ai-remember-you/)

Character.ai persona 工程经验：
- "**Front-load critical info** like name, gender, and boundaries"
- 用 `LABEL: value` 格式比段落更易解析
- 字符限制（C.AI+ 2250 字符 vs free 750）严重影响一致性
- 关键 persona 信息越靠前 / 越简短 / 越重复，记忆越稳

ParallelMe 的应用：5 默认席的 system prompt 已经做了 IFS 双层 persona card（TOP 身份 + BOTTOM drift guard），见 `lib/selves.ts`。V3 的临时席 prompt 也必须遵循这一格式。

---

## 5 · 完整 URL 清单

```
https://agnost.ai/blog/ai-companion-retention-benchmarks
https://gamethinking.io/case-studies/replika-case-study/
https://uxdesign.cc/replika-ais-secret-to-30m-users-what-makes-it-so-special-8afb61f1181c
https://aitipsters.com/replika-vs-character-ai-2/
https://www.glbgpt.com/resource/characterai-unplugged-inside-the-ai-companionship-boom
https://worthexplainer.com/why-character-ai-chat-is-winning-users-in-2025/
https://www.hbs.edu/ris/Publication%20Files/Emotional%20Manipulations%20by%20AI%20Companions%20(10.1.2025)_a7710ca3-b824-4e07-88cc-ebc0f702ec63.pdf
https://www.roborhythms.com/making-character-ai-remember-you/
```
