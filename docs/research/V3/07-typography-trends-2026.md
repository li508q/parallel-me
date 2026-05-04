# 07 · Typography Trends 2025-2026

> **命题**：2025-2026 SaaS / 产品字体已收敛到清晰的双轨制：**Productive sans (Inter / Geist / Satoshi) + Expressive serif (Fraunces / Source Serif / Instrument Serif)**。Variable fonts 全面普及。ParallelMe V3 锁定 Geist + Source Han Serif SC + Geist Mono 三栈。

---

## 关键结论

```
1. SaaS 默认字体单一化（"Inter 同质化"）已经成为反向差异化机会
2. 2025-2026 强趋势：双轨制（serif headlines + sans UI）
3. Variable fonts 从 2024 起非可选 → 2025 必备
4. 衬线字体回归（Instrument / Fraunces / Bodoni Moda）
5. CJK letter-spacing 在 2025-2026 仍是中文产品的硬伤（应永远为 0）
6. Geist (Vercel) + Satoshi (Fontshare) 是 Inter 的最佳替代，差异化 + 性能
```

---

## 1 · SaaS 字体决策表（2026 共识）

### 1.1 主表
[Serif vs Sans: Choosing the Right Typeface for SaaS in 2026 (Lucky Graphics, 2026-02)](https://lucky.graphics/learn/serif-vs-sans-saas-2026/)

| Product Type | Audience Expectation | Headline Font | UI Font |
|---|---|---|---|
| Developer tools | Precision, craft | Geist or IBM Plex Mono | Geist or Inter |
| Legal / Compliance | Trust, authority | Baskerville, Gambetta | Inter, IBM Plex |
| HR / People ops | Human, accessible | Instrument Serif | Satoshi |
| Fintech / Payments | Authority + modern | Bodoni Moda | Geist |
| Marketing analytics | Data-driven | Inter or DM Mono | Inter |
| **Healthcare** | **Careful, human** | **Fraunces** | **IBM Plex Sans** |
| AI-native products | Forward, technical | Clash Display | Geist Mono |

ParallelMe 对位（最接近 "Healthcare" + "AI-native"）：

| 用途 | 推荐 | ParallelMe 实际锁定 |
|---|---|---|
| Headline / Verdict | Fraunces / Source Serif | **Source Han Serif SC + Noto Serif SC**（CJK 优先） |
| UI / Body | IBM Plex Sans / Geist | **Geist + PingFang SC** |
| Mono / Evidence | Geist Mono | **Geist Mono + IBM Plex Mono** |

### 1.2 关键判断
> "The strongest SaaS typographic systems in 2026 use a serif for brand expressions and headlines, with a sans-serif for UI and body text. **This isn't a compromise — it's a deliberate system.**"

> "Inter (v4.1+): Still the most complete... Inter's neutrality is also its limitation — **if you're using it without typographic differentiation, you're invisible**."

> "**Geist (Vercel)**: A 2024 release designed specifically for coding interfaces and digital products. Distinctive letter shapes (the optical 'a' form, the clean 'l' and '1' differentiation) without sacrificing readability. Free and open source."

> "**Satoshi Variable (Fontshare)**: The best alternative for products that want Inter's utility with more character. Slightly more humanist letter construction. Available free from Fontshare."

---

## 2 · 2026 Google Fonts 新选

[Best New Sans-Serif Google Fonts for 2026 (Lexington Themes, 2025-12)](http://lexingtonthemes.com/blog/best-new-sans-serif-google-fonts-2026)

> "Google Fonts didn't reinvent typography in 2025 — and that's exactly why the year mattered. Instead of flashy releases, we got fonts designed for **real digital products**. Fonts that remain readable at 13px. Fonts that don't collapse when you introduce a second language."

特别提到 **Google Sans Flex**："a system font built for scale. It adapts across size, context, density."

---

## 3 · Variable Fonts：2025 必备

### 3.1 共识
[Modern Typography Guide: Fluid Type, Variable Fonts & Readability (FrontendTools, 2025-12)](http://frontendtools.tech/blog/modern-web-typography-techniques-2025-readability-guide)

核心要点：
- Variable fonts 减少请求 + 提供多 weight / width
- "Adjusting weights slightly (430-480 for body) can significantly improve readability on high-density screens"
- Fluid type with `clamp()` 适合 marketing，不适合 dashboards

### 3.2 多源交叉
[Typography Trends 2025: 5 Styles That Drive Engagement (TabFlash, 2025-12)](https://tabflash.com/en/typography-trends-2025/)
> "Variable fonts have been 'up and coming' for years, but 2025 is the year they finally become non-negotiable."

[Top 10 Typography Trends 2025 (Fontfabric, 2025-03)](https://www.fontfabric.com/blog/top-typography-trends-2025/)
> "Imagine typography that adapts as smoothly as your favorite playlist changes tracks."

[Typography in 2025: Modern Font Trends (graphicdesignjunction)](https://graphicdesignjunction.com/2024/12/typography-in-2025-modern-font-trends-for-engaging-ui)
> "Variable fonts continue to revolutionize typography by offering greater flexibility and customization."

[The biggest font trends for 2025 (Creative Boom)](https://www.creativeboom.com/insight/font-trends-2025/)
> "Variable typefaces allow messages to be more evocative in motion."

### 3.3 ParallelMe 应用
- Geist 全 weight 是单文件 260KB（Variable）
- Source Han Serif SC 加载策略：subset + 按需加载（CJK 字体很大）
- 默认 body 用 weight 450（不是 400）—— 中文细字在高 DPR 屏更稳定

---

## 4 · 衬线字体回归

### 4.1 共识
[Typography Trends 2025 (TabFlash)](https://tabflash.com/en/typography-trends-2025/)

> "For a decade, serifs were banished to the realms of academia and newspapers. Now, they are the biggest opportunity for differentiation I see in the market."

> "We aren't talking about Times New Roman. We are seeing high-contrast 'display' serifs — dramatic differences between thick and thin lines, unique ligatures. They signal **'editorial' and 'curated'** rather than 'automated'."

### 4.2 多源交叉

[Top 10 Font Trends in Graphic Design for 2025 (Verdi22, 2025-02)](https://www.verdi22.com/2025/02/01/2025-font-trends/)
> "After years of sans-serif domination, serif fonts are back in style. Known for their classic, authoritative, and elegant appearance."

[Top 10 Typography Trends 2025 (Fontfabric)](https://www.fontfabric.com/blog/top-typography-trends-2025/)
> "Serifs have come a long way from their days as mere ornamental flourishes. Today, they're bold storytellers."

### 4.3 ParallelMe 应用

V3 衬线只在三处出现：
1. **NowMe 裁决正文**（`type.verdict`）
2. **签字页文案**（`type.signature`，italic）
3. **议题纸标题 + 档案标题**

绝不用于：按钮、表单、阶段轨、导航。

---

## 5 · CJK 字体的 2026 实践

### 5.1 主流 CJK 字体

| 字体 | 来源 | 特点 |
|---|---|---|
| **PingFang SC** | Apple | 系统字体，Apple 设备默认 |
| **Source Han Sans SC** | Adobe + Google (Noto) | 开源、多语言、Variable |
| **HarmonyOS Sans** | 华为 | 中文优化、屏幕友好 |
| **Misans** | 小米 | 类似 Source Han |
| **Source Han Serif SC** | Adobe + Google | 中文衬线，开源 |
| **Noto Serif SC** | Google | 同上，更轻量 subset |

ParallelMe 选择：
- Sans 主路径：**PingFang SC（Apple 系统）→ Noto Sans SC（其它）**
- Serif：**Source Han Serif SC → Noto Serif SC → Songti SC fallback**

### 5.2 中文字距规则（V3 红线）

```
默认 letter-spacing: 0
仅英文 uppercase label 可用 tracking: 0.04em
绝不在 CJK 内容上用负字距 (-0.04em / -0.01em 一律删除)
```

V2 当前 `letterSpacing: -0.04em` 和 `.font-display { letter-spacing: -0.01em }` 必须在 V3 Week 0 全部清理。

### 5.3 字号系统

参考 IBM Carbon + Material 3：
- 中文 base 16px（不是 14px）—— 中文 14px 在 1.5x DPR 上太挤
- Line height 1.6（中文需要比英文更宽行高）
- 长文 line height 1.75

---

## 6 · ParallelMe V3 最终字体配置

### 6.1 字体栈（已锁定）

```css
:root {
  --font-sans:
    "Geist",
    "PingFang SC",
    "Noto Sans SC",
    "HarmonyOS Sans",
    system-ui,
    -apple-system,
    sans-serif;

  --font-serif:
    "Source Han Serif SC",
    "Noto Serif SC",
    "Songti SC",
    ui-serif,
    Georgia,
    serif;

  --font-mono:
    "Geist Mono",
    "IBM Plex Mono",
    "SF Mono",
    ui-monospace,
    monospace;
}
```

### 6.2 Type Scale（已锁定）

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

### 6.3 加载策略

- **Geist + Geist Mono**：通过 `next/font/local` 本地化打包（<260KB total，单文件 variable）
- **CJK Serif**：subset 仅打包 GB2312 常用 + Unicode subset，按需 lazy load
- **CJK Sans**：依赖系统字体回退，不打包（PingFang SC 在 Apple，Noto Sans SC fallback）

---

## 7 · 完整 URL 清单

```
https://lucky.graphics/learn/serif-vs-sans-saas-2026/
http://lexingtonthemes.com/blog/best-new-sans-serif-google-fonts-2026
https://graphicdesignjunction.com/2024/12/typography-in-2025-modern-font-trends-for-engaging-ui
https://www.creativeboom.com/insight/font-trends-2025/
http://frontendtools.tech/blog/modern-web-typography-techniques-2025-readability-guide
https://www.verdi22.com/2025/02/01/2025-font-trends/
https://tabflash.com/en/typography-trends-2025/
https://www.fontfabric.com/blog/top-typography-trends-2025/
```
