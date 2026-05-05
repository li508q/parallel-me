# 03 · 设计参考

> **命题**：ParallelMe 视觉系统的色彩、字体、材质、设计哲学决策——每一个都来自 2025-2026 业界顶级实践的对照与权衡。本文是这些决策的完整证据链。

---

## 关键结论

```
1. Apple Liquid Glass 2025 — 借美学，拒绝 refraction（参考 Linear ProKit）
2. Material 3 Expressive — 借 spring token 系统化，拒绝高 chroma 与 bouncy
3. 色彩趋势 2026 — Quiet Luxury / Mineral Silence / Eco-Brutalism 三流派合一
4. 字体 2025-2026 — SaaS 顶级双轨：Geist sans + Source Han Serif SC ritual
5. Linear & Things 3 — 约束驱动设计 / craft over feature / 纸是本体
```

ParallelMe 视觉规范全集在 `docs/design/VISUAL-SYSTEM.md`。本文聚焦"为什么这样定"。

---

## 1 · Apple Liquid Glass 2025

### 1.1 · 官方定位

[Liquid Glass · Apple Developer Documentation](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass) + [Meet Liquid Glass · WWDC25](https://developers.apple.com/videos/play/wwdc2025/219)

跨 iOS 26 / iPadOS 26 / macOS Tahoe 26 / watchOS 26 / tvOS 26 的统一新材质："translucent, refracts surroundings, intelligently adapts light/dark"。两种 variant：Regular 和 Clear。

### 1.2 · 官方红线

[Acorn Design System · iOS 26 and Liquid Glass](https://acorn.firefox.com/latest/mobile/patterns/i-os-26-and-liquid-glass-w2oH48nk) 整理：

> - Reserve for navigation and controls, not content
> - Use glass sparingly to avoid distraction
> - Avoid glass-on-glass — stacking adds noise
> - Use tinting and color with restraint within glass
> - **Prioritize legibility. If glass makes text harder to read, remove the glass.**
> - Liquid Glass is a functional cue, not decoration.

### 1.3 · 业界批评（多源交叉）

- [The Verge · The problem with Liquid Glass](https://on.theverge.com/apple/778197/liquid-glass-iphone-watch-ipad-mac)：**"It's the wrong idea."** Apple Music 的搜索栏在彩色背景上几乎不可见
- [WIRED · Most Divisive System Design Yet](https://www.wired.com/story/liquid-glass-could-be-one-of-apples-most-divisive-system-designs-yet/)：Apple 自己的 press images 都难以辨认
- [Fast Company · The liquid works, but the glass is broken](https://www.fastcompany.com/91405580/apple-liquid-glass-the-liquid-works-but-the-glass-is-broken)：6 位 UX 专家共识"aesthetic-first, breaks usability"
- [Infinum · accessibility 实测](https://infinum.com/blog/apples-ios-26-liquid-glass-sleek-shiny-and-questionably-accessible)：**clocked 1.5:1 contrast in places, vs 4.5:1 standard**

### 1.4 · Linear 给的标准答案

[A Linear spin on Liquid Glass (Robb Böhnke, 2025-10-21)](https://linear.app/now/linear-liquid-glass) — 这是 ParallelMe 取舍的直接对标：

> "We decided to **recreate our own version** of Liquid Glass. We wanted to capture what we loved about it while retaining the flexibility to design a navigation experience that fits the way people use Linear."
>
> "Apply with a **ProKit philosophy: purpose-built, disciplined, and designed for sustained focus**."
>
> "**The one effect we chose not to reproduce was Liquid Glass's refraction.** Refraction can make dense professional interfaces harder to read."

### 1.5 · ParallelMe 方针

| 借用 | 拒绝 |
|---|---|
| Adaptive translucency：弹层、当前焦点、签字印章动效 | Refraction（折射）：在密集纸面上让正文糊化 |
| Depth & layering：议案纸→席位牌→操作底栏的三层 z-order | Glass-on-glass：席位牌不能浮在议案纸玻璃上 |
| Specular highlight on interaction：按钮 hover/press 微光 | Translucent toolbar over text：会议页底部主操作栏必须实色+上边线 |
| Tinted Glass：席位被点名时发言区微染席位色（5–8%） | 默认 Liquid Glass 全屏：所有页面背景都是纸面 |

**一句话原则**：**"纸"是产品本体，"玻璃"只在三处出现 —— 弹层、当前焦点、状态反馈。**

---

## 2 · Material 3 Expressive 2025

### 2.1 · 来源
[Google Blog · Material 3 Expressive launch (2025-05-13)](https://blog.google/products/android/material-3-expressive-android-wearos-launch) + [m3.material.io · Building with M3 Expressive](https://m3.material.io/blog/building-with-m3-expressive)

Google 2025 年宣布的"情感设计"转向：用 springy motion + 更鲜艳色彩 + 形态对比制造愉悦感。

### 2.2 · 五个核心更新

1. **Springy motion**：基于 physics 的 spring tokens，全系统化（"out-of-box motion physics"）
2. **Dynamic color 升级**：更高 chroma，更多 hue 变化
3. **Shape morph**：按钮可在状态间 morph 形态
4. **Bidirectional compatibility**：M3 Classic 与 M3 Expressive 双向兼容
5. **Status bar / 图标统一**

### 2.3 · 与 Apple Liquid Glass 对比

| 维度 | Material 3 Expressive | Apple Liquid Glass |
|---|---|---|
| 时间 | 2025-05 | 2025-06 |
| 核心载体 | 形态 + 动效 + 色彩 | 材质 |
| 触感哲学 | Springy + 高 chroma | Translucent + refraction |
| 风险 | 过度活泼 / 卡通化 | 可读性 / 性能 |
| 默认基调 | 愉悦、活泼 | 优雅、流动 |

两者在 2025 几乎同时推出，但**对密集信息产品（生产力、阅读、决策）都不太合适**。

### 2.4 · ParallelMe 的取舍

```
✓ 借鉴 Spring token 系统化
  motion token 用 spring（stiffness / damping / mass），不是 timing function

✗ 拒绝高 chroma 色彩
  ParallelMe 调性是私密、克制，用低饱和矿物色

✗ 拒绝 Bouncy / playful spring
  默认 damping 必须高于 Material 推荐，"纸墨"质感而非"果冻"

✗ 拒绝 Shape morph 装饰
  形态变化只服务于状态（如席位被点名 → 牌子轻微 elevate），不为情感而变
```

V0.5 的 spring tokens（`lib/design/tokens/motion.ts`）：

```ts
spring = {
  paper:           { stiffness: 200, damping: 28, mass: 1 },
  seatLanding:     { stiffness: 180, damping: 32, mass: 1 },
  stageTransition: { stiffness: 240, damping: 30, mass: 0.8 },
  signature:       { stiffness: 100, damping: 18, mass: 1.2 },
};
```

---

## 3 · 色彩趋势 2026

### 3.1 · 三大主导流派

| 流派 | 来源 | 关键词 |
|---|---|---|
| **Quiet Luxury Neutrals** | [ColorArchive](https://colorarchive.org/collections/2026-quiet-luxury-trend/) | cashmere oat / aged bone / warm alabaster / stone tones |
| **Mineral Silence** | [Color Labs](https://colorlabs.net/palettes/mineral-silence-2025-12-31) | grounded shadows / crystalline highlights / monochromatic value |
| **Eco-Brutalism / Synthetic Naturalism** | [ColorUXLab](https://coloruxlab.com/guides/trends-2026-january) | tactile realism / material honesty / visual weight |

### 3.2 · 共同方向

> "After a decade of cool, desaturated, 'accessible' color palettes in digital design, the design culture has reached a saturation point with coldness. 2026's dominant movement is a return to warmth: warm earth tones in interior and fashion, warm neutrals replacing cold whites in minimalist design."
> — [Earthy Color Palettes Dominating Branding in 2026 (Zeenesia)](https://zeenesia.com/2025/12/01/earthy-color-palettes/)

### 3.3 · 屏幕适配陷阱

[Earth tones in digital interfaces (ColorArchive, 2026-04)](https://colorarchive.org/notes/april-2026-earth-tones-digital-interfaces/) 警告：

> "Earth tones sourced directly from physical swatches often read as muddy on screens. Increase chroma by 5-15% in mid-tones, neutralize shadows."

Dark mode 大坑：
> "Designers often invert their light-mode earth tones, producing dark browns and deep olives that absorb too much light. Better: shift earth tones toward their lighter, more chromatic cousins in dark mode."

### 3.4 · ParallelMe 的色彩选择

**78%** 中性档案 + **14%** 纸面议案 + **5%** 席位识别色 + **3%** 状态色。

`paper.base #F4F1EC` 落在 Quiet Luxury Neutrals 的 "Cool Gray Whisper" 与 "Warm Gray Mist" 之间，去黄 5°。

`surface.deep #1A1816` 完全契合 Mineral Silence 的"deepest grounding shadow"。

席位色（休整 #556F7A 雨石蓝、资源 #8A6F3D 旧铜金、自由 #3F6B5A 杜松绿、依恋 #8C5042 茜土色、远望 #5E5369 烟紫）属于 **Eco-Heritage / Mineral palette**。

完整色彩规范见 `docs/design/VISUAL-SYSTEM.md` § 2。

### 3.5 · WCAG 与对比度

实测验证 V0.5 全部正文与 UI 边界过 WCAG AA：
- 正文（4.5:1）：`paper.base / ink.body` = 8.7:1 ✓
- UI 边界（3:1）：`paper.base / paper.edge` = 1.4:1 ⚠️（仅细线，不传递关键信息）
- 席位色不写文字（解决了大量低对比度问题）
- 状态必须同时有文字（不只靠颜色）

---

## 4 · 字体趋势 2025-2026

### 4.1 · SaaS 字体决策共识

[Serif vs Sans: Choosing the Right Typeface for SaaS in 2026 (Lucky Graphics, 2026-02)](https://lucky.graphics/learn/serif-vs-sans-saas-2026/)：

> "The strongest SaaS typographic systems in 2026 use a serif for brand expressions and headlines, with a sans-serif for UI and body text. **This isn't a compromise — it's a deliberate system.**"

| Product Type | Headline | UI |
|---|---|---|
| Developer tools | Geist or IBM Plex Mono | Geist or Inter |
| **Healthcare** | **Fraunces** | **IBM Plex Sans** |
| AI-native products | Clash Display | Geist Mono |

### 4.2 · ParallelMe 字体配置

最接近 "Healthcare" + "AI-native" 双重定位：

| 用途 | 字体栈 |
|---|---|
| **Productive UI** | `Geist + PingFang SC + Noto Sans SC + HarmonyOS Sans` |
| **Expressive Ritual** | `Source Han Serif SC + Noto Serif SC + Songti SC` |
| **Mono · Evidence** | `Geist Mono + IBM Plex Mono + SF Mono` |

为什么 **Geist** 而不是 Inter？[Lucky Graphics](https://lucky.graphics/learn/serif-vs-sans-saas-2026/)：

> "Inter (v4.1+): Still the most complete, but **its neutrality is also its limitation — if you're using it without typographic differentiation, you're invisible**."
>
> "Geist (Vercel): A 2024 release designed specifically for coding interfaces and digital products. Distinctive letter shapes (the optical 'a' form, the clean 'l' and '1' differentiation) without sacrificing readability. Free and open source."

### 4.3 · Variable Fonts 2025 共识

> "Variable fonts have been 'up and coming' for years, but 2025 is the year they finally become non-negotiable."
> — [Typography Trends 2025: 5 Styles That Drive Engagement (TabFlash, 2025-12)](https://tabflash.com/en/typography-trends-2025/)

ParallelMe：Geist 全 weight 是单文件 260KB（Variable）。Body 默认 weight 450（不是 400）—— 中文细字在高 DPR 屏更稳定。

### 4.4 · 衬线字体回归

> "For a decade, serifs were banished to the realms of academia and newspapers. Now, they are the biggest opportunity for differentiation. We're seeing high-contrast 'display' serifs that signal **'editorial' and 'curated'** rather than 'automated'."
> — [TabFlash 2025-12](https://tabflash.com/en/typography-trends-2025/)

ParallelMe：衬线只在三处出现：
1. **NowMe 裁决正文**（`type.verdict`）
2. **签字页文案**（`type.signature` italic）
3. **议题纸标题 + 档案标题**

绝不用于按钮、表单、阶段轨、导航。

### 4.5 · CJK 字体硬规则

V0.5 红线：**CJK letter-spacing 必须为 0**。任何 `-0.04em` 或 `-0.01em` 一律禁用——中文方块字本来就紧，再负字距等于把字挤死，且各 CJK 字体回退会让间距漂移。

工作台禁用 fluid 大字（`clamp()`）：营销 hero 才允许，进入产品后用离散断点。

完整 type scale 见 `docs/design/VISUAL-SYSTEM.md` § 3.4。

---

## 5 · Linear & Things 3 设计哲学

### 5.1 · 共同哲学：constraint-driven design

[16 Design Case Studies: Four Patterns I Adopted (Blake Crosley, 2026-01)](https://blakecrosley.com/en/blog/design-studies-collection)：

> "Linear chose keyboard-first interaction. Notion chose block-based architecture. Arc chose vertical tabs. **Each product made a deliberate constraint that eliminated design decisions while producing a distinctive identity.**"

ParallelMe 的约束矩阵：

| 约束 | 消除的决策类别 |
|---|---|
| 5 默认席位 | "用户该选哪些 part" |
| 议题驱动 | "用户该说什么" |
| 4 道参与门 | "AI 该自动多深" |
| 本地存储 | "怎么做账号 / 同步 / 隐私" |
| 反讨好 NowMe | "怎么平衡 / 兼顾" |
| 反 chat | "聊天页该长啥样" |

每个都消除了一类无尽的设计争论。

### 5.2 · Linear · Quality is a choice

[Why is quality so rare? (Karri Saarinen, Linear, 2025-05)](https://linear.app/now/why-is-quality-so-rare)：

- Quality as the north star for every team
- Intuition & customers over data
- Hire only people who show craft and care
- Small teams using their judgment（3-5 人胜过大委员会）
- No handoffs, whole team iterates
- Polished work only

[A calmer interface for a product in motion (Linear, 2026-03)](http://linear.app/now/behind-the-latest-design-refresh)：

> "If most people don't immediately notice what changed, that's probably a good sign. Just as Linear's users rarely think about the bugs they never hit, the paper cuts that were smoothed away — **most of what makes software feel good is what you aren't likely to see**."

### 5.3 · Things 3 · Focused Simplicity

[Things 3: The Art of Focused Simplicity (Blake Crosley)](https://blakecrosley.com/guides/design/things)：

> "While competitors pile on features (recurring tasks with 47 options, projects with dependencies and Gantt charts), Things asks: **what does a person actually need to get things done?**"

#### Areas vs Projects 心智模型

> "Areas never complete (they're life categories). Projects complete (ship by Friday). The distinction eliminates planning paralysis."

ParallelMe 对应：
- **阁** = Area（永不完成的内在组织）
- **议题** = 长期反复的人生问题
- **会议** = Project（完成会签字）

#### "Someday" is a Feature

> "'Someday' isn't a failure state — it's a pressure release. Ideas have a place without cluttering Today."

ParallelMe 对应：**「暂缓」** 是产品一等公民出口，不是失败状态；**「我在逃避」** 是诚实结果，不是 bug。

### 5.4 · 减法多于加法

Linear："Sometimes the most important thing is to make a decision and move on."

Things 3：47 个 recurring task options 不如 1 个聪明的"Today"。

ParallelMe：拒绝"自定义席位池"、"多用户共编"、"AI 主动提醒"等所有 feature 拓展。**先把 5 默认席 + 4 道参与门做到极致**。

详见 `docs/design/PRODUCT-DESIGN.md` § 6 永远不做。

---

## 6 · 完整 URL 清单

```
# Apple Liquid Glass
https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass
https://developers.apple.com/videos/play/wwdc2025/219
https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/
https://on.theverge.com/apple/778197/liquid-glass-iphone-watch-ipad-mac
https://www.wired.com/story/liquid-glass-could-be-one-of-apples-most-divisive-system-designs-yet/
https://www.fastcompany.com/91405580/apple-liquid-glass-the-liquid-works-but-the-glass-is-broken
https://infinum.com/blog/apples-ios-26-liquid-glass-sleek-shiny-and-questionably-accessible
https://acorn.firefox.com/latest/mobile/patterns/i-os-26-and-liquid-glass-w2oH48nk
https://linear.app/now/linear-liquid-glass

# Material 3 Expressive
https://blog.google/products/android/material-3-expressive-android-wearos-launch
https://m3.material.io/blog/building-with-m3-expressive

# 色彩趋势 2026
https://colorarchive.org/collections/2026-quiet-luxury-trend/
https://colorlabs.net/palettes/mineral-silence-2025-12-31
https://coloruxlab.com/guides/trends-2026-january
https://colorarchive.org/notes/april-2026-earth-tones-digital-interfaces/
https://zeenesia.com/2025/12/01/earthy-color-palettes/

# 字体趋势
https://lucky.graphics/learn/serif-vs-sans-saas-2026/
http://lexingtonthemes.com/blog/best-new-sans-serif-google-fonts-2026
https://tabflash.com/en/typography-trends-2025/
https://www.fontfabric.com/blog/top-typography-trends-2025/

# Linear & Things 3
http://linear.app/now/behind-the-latest-design-refresh
https://linear.app/now/why-is-quality-so-rare
https://linear.app/method/introduction
https://blakecrosley.com/en/guides/design/linear
https://blakecrosley.com/guides/design/things
https://blakecrosley.com/en/blog/design-studies-collection
```

---

**最后更新**：项目调研整合后定稿。
