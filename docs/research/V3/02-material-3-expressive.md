# 02 · Google Material 3 Expressive 2025

> **命题**：Material 3 Expressive 是 Google 在 2025 年宣布的"情感设计"转向 —— 用 springy motion + 更鲜艳色彩 + 形态对比制造愉悦感。ParallelMe 的取舍是 **借鉴动效系统化（spring tokens）但不采用其情感方向**。

---

## 关键结论

```
1. M3 Expressive 是 Material 3 上的"情感放大器"，不是替代
2. 核心：springy motion 物理 + dynamic color 更高 chroma + shape morph + 多形按钮
3. 目标：boost engagement / usability / desire
4. 与 Apple Liquid Glass 同向（情感 + 物理感），但用形态而非材质
5. ParallelMe 借鉴 spring token 系统化思路，但 default damping 比 Material 推荐值更高（克制）
```

---

## 1 · 官方资料

### 1.1 官方发布
- [Google Blog · Material 3 Expressive launch (2025-05-13)](https://blog.google/products/android/material-3-expressive-android-wearos-launch)
- [m3.material.io · Building with M3 Expressive](https://m3.material.io/blog/building-with-m3-expressive)
- [Google I/O 2025 · Build next-level UX with M3 Expressive](https://io.google/2025/explore/technical-session-24/)
- [Introducing Material 3 Expressive · YouTube (Google Design)](https://www.youtube.com/watch?v=n17dnMChX14)
- [Build next-level UX with Material 3 Expressive · YouTube (Android Developers)](https://www.youtube.com/watch?v=6IsFP3gD28E)

### 1.2 核心定义

> "Material 3 Expressive — one of our biggest updates in years — is all about making your device feel unique to you. Material 3 Expressive gives you new ways to show your style and personality, delivers smooth interactions and surfaces glanceable, helpful information."
> —— Google Blog

> "Today we're introducing an expansion pack of new components and capabilities designed to add even more emotional oomph to your UIs and ensuring your end users have a deeper connection to your product, find it easier to use, and get a bit more joy from key interactions."
> —— Build next-level UX session

### 1.3 五个核心更新

1. **Springy motion**：基于 physics 的 spring tokens，全系统化
   - "Springy animations meant to bring a moment of delight to everyday routines"
   - 例：dismiss 通知时其他通知 subtly respond to your drag
   - 配 dynamic haptics

2. **Dynamic color 升级**：更高 chroma，更多 hue 变化
   - "Brighter text and icons to better express colors like brand or dynamic themes"
   - 升级了 dynamic color algorithm，主题更多样

3. **Shape morph**：按钮可在状态间 morph 形态
   - 多种 button shape variant
   - Label 字重多样化

4. **Bidirectional compatibility**：M3 Classic 与 M3 Expressive 主题双向兼容
   - 一个 codebase 可同时支持两种 mood

5. **Status bar / 图标统一**：更易 parse

---

## 2 · 业界评论

### 2.1 Ars Technica：M3 Expressive 是 Material You 的更大胆版本
[Google announces Material 3 Expressive (Ars Technica, 2025-05-13)](https://arstechnica.com/gadgets/2025/05/google-reveals-vibrant-material-3-expressive-coming-soon-to-a-pixel-near-you/)

- "Bolder take on the same aesthetic, featuring 'springy' animations, brighter colors, and new shapes"
- 不是完全 rethink，是 Material You 之上加情感放大器

### 2.2 设计意图分析

Google 的核心论点：**emotion → engagement → usability**。这与 IBM Carbon、Apple HIG 的"productive UI 优先 utilitarian"哲学是一个分叉。

---

## 3 · 与 Apple Liquid Glass 对比

| 维度 | Material 3 Expressive | Apple Liquid Glass |
|---|---|---|
| 时间 | 2025-05 公布 | 2025-06 公布 |
| 核心载体 | 形态 (shape) + 动效 (motion) + 色彩 (color) | 材质 (material) |
| 触感哲学 | Springy + 高 chroma | Translucent + refraction |
| 风险 | 过度活泼 / 卡通化 | 可读性 / 性能 |
| 默认基调 | 愉悦、活泼 | 优雅、流动 |
| 适合产品 | 大众消费、青少年、社交 | 视觉强势品牌、premium |

两者在 2025 几乎同时推出，标志着两大平台都从"信息工具"转向"情感载体"。但**对密集信息产品（生产力、阅读、决策）都不太合适**。

---

## 4 · 对 ParallelMe V3 的应用

### 4.1 借鉴清单

| 借鉴什么 | 怎么用 |
|---|---|
| **Spring token 系统化** | V3 motion token 用 spring（stiffness / damping / mass），不是 timing function |
| **Bidirectional compatibility 思路** | V3 light + surface.deep 双模式必须无缝切换 |
| **形态作为 token** | DocketPaper 在不同状态下尺寸 / 圆角 / 阴影通过 token 切换 |

### 4.2 拒绝清单

| 拒绝什么 | 原因 |
|---|---|
| 高 chroma 色彩 | ParallelMe 调性是私密、克制，用低饱和矿物色 |
| Bouncy / playful spring | 默认 damping 必须高于 Material 推荐，"纸墨"质感而非"果冻" |
| Shape morph 装饰 | 形态变化只服务于状态（如席位被点名 → 牌子轻微 elevate），不为情感而变 |

### 4.3 V3 motion token 推荐值

```ts
// lib/design/tokens/motion.ts
export const motion = {
  spring: {
    // ParallelMe 默认：stiffness 200, damping 28（比 Material 默认更克制）
    paper: { stiffness: 200, damping: 28, mass: 1 },

    // 席位入席：纸卡轻轻"落桌"
    seatLanding: { stiffness: 180, damping: 32, mass: 1 },

    // 阶段切换：横向 8px slide + 透明度交叉
    stageTransition: { stiffness: 240, damping: 30, mass: 0.8 },

    // 签字：墨痕扩散
    signature: { stiffness: 100, damping: 18, mass: 1.2 },
  },
  duration: {
    fast: 150,
    base: 200,
    slow: 300,
    ritual: 500,  // 仅签字 / 裁决进入用
  },
};
```

详见 `V3-TECH-DIRECTION.md` 第 8 节与 `V3-IVY-FINAL-DIRECTION.md` 第 2.4 节。

---

## 5 · 完整 URL 清单

```
https://blog.google/products/android/material-3-expressive-android-wearos-launch
https://m3.material.io/blog/building-with-m3-expressive
https://io.google/2025/explore/technical-session-24/
https://www.youtube.com/watch?v=n17dnMChX14
https://www.youtube.com/watch?v=6IsFP3gD28E
https://arstechnica.com/gadgets/2025/05/google-reveals-vibrant-material-3-expressive-coming-soon-to-a-pixel-near-you/
```
