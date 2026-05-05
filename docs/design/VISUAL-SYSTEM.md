# ParallelMe · 视觉系统

> 这份文档定义 ParallelMe 的色彩、字体、动效、材质规范。
> 配套 `PRODUCT-DESIGN.md` 永恒原则 § 11"纸是本体，玻璃只在三处出现"。

---

## 1 · 设计哲学（视觉层 7 条军规）

```
1. 纸是本体，玻璃只在三处出现
   弹层 / 当前焦点 / 状态反馈
   Liquid Glass refraction 永远不进 ParallelMe

2. 字体双轨：Sans 干活、Serif 仪式、Mono 证据
   CJK letter-spacing = 0
   工作台禁用 fluid 大字（clamp）

3. 席位色只做身份点 / 边框 / 关系线
   永远不写文字
   永远不做卡片大背景
   状态必须同时有文字

4. 动效是纸墨，不是果弹
   默认 spring damping 高于 Material 推荐
   席位入席：纸卡轻轻"落桌"
   签字：墨痕从中心扩散，不是印章砸下

5. 高级感来自档案感、秩序感、可追溯感、私密感
   不是手账、不是创意 H5、不是文艺心理测试

6. 大留白
   页面区块像纸张上的区域，不是浮动面板
   固定格式控件要有稳定尺寸，避免流式内容跳动

7. 一切色彩 / 字体 / 间距 / 动效 / 圆角走 token
   组件中不允许 hex / rgb / hsl / font-family 字面量
   单一 source of truth：CSS variables in app/globals.css
```

---

## 2 · 色彩系统

### 2.1 · 总命题

> **墨色定秩序，矿物色定席位。**

大部分界面由纸、墨、线构成；席位色只作为低饱和识别符，用于点、线、边框和短标签。

### 2.2 · 比例（V0.5 锁定）

```
中性档案 (paper / ink / line) : 78%
纸面议案 (paper.lift)         : 14%
席位识别色                    : 5%
签字 / 状态色                 : 3%
```

V0.5 加入了 `surface.deep` 深色仪式空间，所以 `paper` 类比例从 88%+8% 调整为 78%+14%。

### 2.3 · 基础 Token

```css
/* Paper (78%) */
--color-paper-base: #F4F1EC;  /* 页面底色，去黄、向 Quiet Luxury 收敛 */
--color-paper-lift: #FBF9F4;  /* 议案纸 / 主内容 */
--color-paper-sunk: #EDE2D0;  /* 次级区域 / 档案层 */
--color-paper-edge: #D8CBB8;  /* 细线 / 纸边 */

/* Surface (深色仪式) */
--color-surface-deep: #1A1816;  /* 仅裁决 / 签字页 */

/* Ink */
--color-ink-core: #191713;  /* 主文字 / 主 CTA */
--color-ink-body: #3C3932;  /* 正文 */
--color-ink-mute: #7C7568;  /* 侧记 / meta */
--color-ink-faint: #B7AC9B; /* disabled / 低存在 */
```

### 2.4 · 席位 Token（5%）

仅用于身份点 / 边框 / 关系线 / 短标签。**永远不写正文，永远不做卡片大背景**。

| Token | Hex | 气质 | 对应席位 |
|---|---|---|---|
| `--color-seat-rest` | `#556F7A` | 雨石蓝、低消耗 | 躺平的我 |
| `--color-seat-money` | `#8A6F3D` | 旧铜金、现实 | 搞钱的我 |
| `--color-seat-roam` | `#3F6B5A` | 杜松绿、出口 | 出走的我 |
| `--color-seat-filial` | `#8C5042` | 茜土色、亲缘 | 讨妈欢心的我 |
| `--color-seat-future` | `#5E5369` | 烟紫、时间 | 5 年后的我 |
| `--color-seat-temporary` | `#76684D` | 茶褐、未定 | V0.6 临时席 |
| `--color-seat-silent` | `#899199` | 石灰蓝、轻退场 | 沉默席 |
| `--color-seat-exiled` | `#6F3F35` | 暗陶土、被压住 | 被流放席 |

### 2.5 · 状态 Token（3%）

```css
--color-seal-action:      #8E3F32;  /* 火漆红 · 签字 / 重要确认 */
--color-attention-copper: #A8844D;  /* 老铜金 · 等待转正 / 重点（禁写小字） */
--color-safe-green:       #536E5A;  /* 已完成 / 低风险 */
--color-trace-blue:       #455F70;  /* 证据链 / 可追溯引用 */
```

### 2.6 · 调研支撑

- [Color Labs · Mineral Silence palette](https://colorlabs.net/palettes/mineral-silence-2025-12-31)
- [ColorArchive · 2026 Quiet Luxury Neutrals](https://colorarchive.org/collections/2026-quiet-luxury-trend/)
- [ColorUXLab · Trends 2026 (Eco-Brutalism / Synthetic Naturalism)](https://coloruxlab.com/guides/trends-2026-january)
- [ColorArchive · Earth tones in digital interfaces](https://colorarchive.org/notes/april-2026-earth-tones-digital-interfaces/)

详见 `docs/research/03-design-references.md`。

---

## 3 · 字体系统

### 3.1 · 双轨架构

| 场景 | 字体栈 | 用途 |
|---|---|---|
| **Productive UI** | `"Geist", "PingFang SC", "Noto Sans SC", "HarmonyOS Sans", system-ui, sans-serif` | 导航 / 表单 / 阶段轨 / 按钮 / 设置 / 所有密集信息 |
| **Expressive Ritual** | `"Source Han Serif SC", "Noto Serif SC", "Songti SC", ui-serif, Georgia, serif` | 议题纸标题 / NowMe 裁决正文 / 签字页 / 档案标题 |
| **Mono · Evidence** | `"Geist Mono", "IBM Plex Mono", "SF Mono", ui-monospace, monospace` | 证据链 ID / provider config / API base URL / 导出文件名 |

理由：[Lucky Graphics · Serif vs Sans for SaaS in 2026](https://lucky.graphics/learn/serif-vs-sans-saas-2026/) 共识——SaaS 顶级 typography 用 serif 表达 + sans UI 是**deliberate system**，不是妥协。

### 3.2 · 字体加载

- **Geist + Geist Mono**：通过 `geist/font/sans` + `geist/font/mono` 在 `app/layout.tsx` 注册，曝露 CSS variable `--font-geist` / `--font-geist-mono`
- **Source Han Serif SC**：subset + 按需 lazy load
- **PingFang SC / Noto Sans SC**：依赖系统字体回退，不打包

### 3.3 · 红线

```
❌ CJK letter-spacing 不为 0
❌ 工作台用 fluid 大字（clamp()）
❌ 大标题进入卡片内部
❌ Sans 写仪式正文
❌ Serif 写按钮 / 表单
```

### 3.4 · Type Scale

| Token | Desktop | Mobile | 字体 | 用途 |
|---|---:|---:|---|---|
| `type.display` | 44/52 | 36/44 | Sans | 登录、空状态 |
| `type.headline` | 30/38 | 26/32 | Sans | 页面标题 |
| `type.title` | 22/30 | 20/28 | Sans | 阶段标题 |
| `type.title-sm` | 18/26 | 17/24 | Sans | 组件标题 |
| `type.body` | 16/26 | 15/24 | Sans | 正文 / 席位发言 |
| `type.body-long` | 16/28 | 15/26 | Sans | 档案长文 |
| `type.body-sm` | 14/22 | 13/20 | Sans | 卡片说明 |
| `type.label` | 12/16 | 12/16 | Sans (Latin uppercase tracking 0.04em only) | 标签 |
| `type.verdict` | 24/36 | 22/32 | **Serif** | NowMe 裁决正文 |
| `type.signature` | 20/32 | 18/28 | **Serif italic** | 签字 / 席位判词 |

字号在 `:root` 用 CSS variables 定义；mobile 媒体查询覆写：

```css
@media (max-width: 767px) {
  :root {
    --text-display: 36px;  --text-display--line-height: 44px;
    /* ... */
  }
}
```

### 3.5 · Body 默认设置

```css
body {
  font-family: var(--font-sans);
  font-weight: 450;          /* 不是 400，中文细字在高 DPR 屏更稳定 */
  letter-spacing: 0;         /* CJK 红线 */
  font-feature-settings: "kern" 1, "liga" 1, "ss01" 1;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

---

## 4 · 动效系统

### 4.1 · 哲学

PRODUCT-DESIGN 锁定：默认 spring damping **高于** Material 推荐。"纸墨"质感而非"果冻"。

### 4.2 · Spring Token

```ts
export const spring = {
  paper:           { stiffness: 200, damping: 28, mass: 1 },     // 默认
  seatLanding:     { stiffness: 180, damping: 32, mass: 1 },     // 席位入席
  stageTransition: { stiffness: 240, damping: 30, mass: 0.8 },   // 阶段切换
  signature:       { stiffness: 100, damping: 18, mass: 1.2 },   // 签字
};
```

### 4.3 · Duration Token

```ts
export const duration = {
  fast:   "150ms",
  base:   "200ms",
  slow:   "300ms",
  ritual: "500ms",  // 仅签字 / 裁决进入
};
```

### 4.4 · Easing

```css
--ease-paper: cubic-bezier(0.2, 0.7, 0.2, 1);    /* Apple-ish soft ease */
--ease-ink:   cubic-bezier(0.16, 0.84, 0.44, 1); /* Ink spread */
```

### 4.5 · 关键动效

| 场景 | 实施 |
|---|---|
| 席位入席 | 纸卡轻轻"落桌"，不弹跳 |
| 签字 | 墨痕从中心扩散，不是印章砸下 |
| 阶段切换 | 横向 8px slide + 透明度交叉，不要 bounce |
| 裁决页进入 | 上一页淡出，裁决从 90% 缩放到 100%，伴 200ms 模糊收紧 |
| 当前发言 dot | `animate-soft-pulse`（2400ms 慢闪烁） |

### 4.6 · 系统 keyframes

```css
@keyframes inkIn   { 0% { opacity: 0; filter: blur(6px); transform: translateY(10px); } 100% { ...} }
@keyframes fadeUp  { 0% { opacity: 0; transform: translateY(16px); } 100% { ...} }
@keyframes typeIn  { 0% { width: 0; } 100% { width: 100%; } }
@keyframes softPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
```

每个对应一个 Tailwind utility class（`animate-ink-in` / `animate-fade-up` / `animate-type` / `animate-soft-pulse`）。

---

## 5 · 材质语言（Liquid Glass 取舍）

V0.5 锁定的方针：**借美学，拒绝 refraction**——参考 Linear 的 ProKit 路径。

### 5.1 · Apple Liquid Glass 状况

- 官方红线：`reserve for navigation and controls, not content` / `use sparingly` / `no glass-on-glass` / `if glass makes text harder to read, remove the glass`
- 业界批评：The Verge "the wrong idea" / WIRED "divisive" / Fast Company "the liquid works, but the glass is broken" / Infinum 实测对比度低至 1.5:1

### 5.2 · Linear 给的标准答案

[A Linear spin on Liquid Glass (2025-10-21)](https://linear.app/now/linear-liquid-glass)：

> "We decided to **recreate our own version** of Liquid Glass. We wanted to capture what we loved about it while retaining the flexibility..."
>
> "Apply with a **ProKit philosophy: purpose-built, disciplined, designed for sustained focus**."
>
> "**The one effect we chose not to reproduce was Liquid Glass's refraction.** Refraction can make dense professional interfaces harder to read."

### 5.3 · ParallelMe 方针

| 借用 | 拒绝 |
|---|---|
| Adaptive translucency：弹层、点名当前发言层、签字印章动效 | Refraction（折射）：在密集纸面上让正文糊化 |
| Depth & layering：议案纸 → 席位牌 → 用户操作底栏的三层 z-order | Glass-on-glass：席位牌不能浮在议案纸玻璃上 |
| Specular highlight on interaction：按钮 hover / press 微光 | Translucent toolbar over text：会议页底部主操作栏必须实色 + 上边线 |
| Tinted Glass：席位被点名时发言区微染席位色（5–8% 透明） | 默认 Liquid Glass 全屏：所有页面背景都是纸面，玻璃只在三处 |

### 5.4 · Accessibility 自动响应

跟系统 Reduce Transparency / Increase Contrast 走（CSS media queries）：

```css
@media (prefers-reduced-transparency: reduce) {
  /* 所有 backdrop-blur 移除 */
}
@media (prefers-contrast: more) {
  /* 所有边线加粗 + 字色加深 */
}
```

---

## 6 · 圆角与间距

### 6.1 · Radius

```css
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 8px;
--radius-xl: 12px;
```

### 6.2 · Spacing

V0.5 用 Tailwind 默认 spacing scale（4px 网格 · `0/1/2/3/4/6/8/10/12/16/20/24...`），未引入自定义 spacing token。

如需扩展，按 Tailwind 默认增量：4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 80 / 96。

---

## 7 · Elevation（阴影）

```ts
export const elevation = {
  none:    "none",
  rest:    "0 1px 0 rgba(25, 23, 19, 0.04), 0 2px 6px rgba(25, 23, 19, 0.04)",     // 议案纸轻 lift
  raised:  "0 2px 4px rgba(25, 23, 19, 0.06), 0 8px 24px -8px rgba(25, 23, 19, 0.10)", // 浮起卡片
  ritual:  "0 8px 16px rgba(25, 23, 19, 0.12), 0 24px 48px -16px rgba(25, 23, 19, 0.18)", // 仪式弹层
};
```

主要用于 SignatureSlip / MemoryConsentGate / DocketPaper。

---

## 8 · 视觉验收

V0.5 应满足 WCAG AA：

- 所有正文、小标签、按钮文字 contrast ≥ 4.5:1
- UI 组件边界 contrast ≥ 3:1
- 中文 letter-spacing = 0
- 组件内不使用 viewport-fluid font size
- Serif 只用于仪式性文本，不用于表单按钮
- 页面不能被 beige / cream / gold 支配
- 席位色不能成为卡片大背景

---

## 9 · 开发规则

### 9.1 · CSS 变量是 source of truth

- 全部 token 在 `app/globals.css` 的 `:root` 块定义
- `tailwind.config.ts` 通过 `var(--...)` 引用
- TS source `lib/design/tokens/*.ts` 镜像同样的值（供 SVG 内联或 Canvas 等无法走 CSS variable 的场景使用）

### 9.2 · ESLint 红线（V0.6 启用）

```
- 禁止 hex literal 在 *.tsx / *.ts 中（除 lib/design/tokens/*.ts）
- 禁止 inline font-family string
- 禁止 inline style with rgb/hsl/hex
```

### 9.3 · Storybook（V0.7+ 探索）

V0.5 不引入 Storybook。组件少（11 个），可在 `/test-components`（如需）单独 sandbox 路由验证。

---

**最后更新**：V0.5 → V0.6 整理后定稿。
