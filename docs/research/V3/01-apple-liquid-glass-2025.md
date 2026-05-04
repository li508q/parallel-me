# 01 · Apple Liquid Glass 2025

> **命题**：Liquid Glass 是 Apple 自 iOS 7 以来最大的设计语言更新。它带来"半透明 + 折射 + 自适应"的新材质，但在密集信息产品上有显著可读性代价。ParallelMe 的取舍是 **借用 translucency / depth，拒绝 refraction，参考 Linear 的 ProKit 路径**。

---

## 关键结论

```
1. Liquid Glass 是跨 iOS / iPadOS / macOS Tahoe / watchOS / tvOS 的统一材质语言（26 系列发布）
2. 官方红线：sparingly used / not on content / no glass-on-glass / readability first
3. 业界共识：液态部分成功，玻璃部分有问题；Apple 自己仍在迭代修补
4. Linear 给出最佳第三方解法：自己重做一个，借美学拒绝 refraction
5. ParallelMe 不照抄 Liquid Glass，但局部借用 depth + adaptive tinting
```

---

## 1 · 官方资料

### 1.1 官方文档与发布
- [Liquid Glass · Apple Developer Documentation](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass)
- [Apple Newsroom · 2025-06 announcement](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)
- [Meet Liquid Glass · WWDC25 Session 219](https://developers.apple.com/videos/play/wwdc2025/219)
- [Get to know the new design system · WWDC25 Session 356](https://developers.apple.com/videos/play/wwdc2025/356)
- [Build a UIKit app with the new design · WWDC25 Session 284](https://developer.apple.com/videos/play/wwdc2025/284/)
- [Build an AppKit app with the new design · WWDC25 Session 310](https://developers.apple.com/videos/play/wwdc2025/310)

### 1.2 官方核心定义

> "Interfaces across Apple platforms feature a new dynamic material called Liquid Glass, which combines the **optical properties of glass with a sense of fluidity**. Learn how to adopt this material and embrace the design principles of Apple platforms."
> —— Apple Developer Documentation

> "Building off these learnings, rather than trying to simply recreate a material from the physical world, **Liquid Glass is a new digital meta-material that dynamically bends and shapes light**."
> —— Meet Liquid Glass session

### 1.3 两种 variant
- **Regular**：默认，用在 navigation / controls / sheets
- **Clear**：最大透明度，用于 photo / video 上的浮层
- 官方明确："**They should never be mixed.**"

### 1.4 Accessibility 自动响应
- Reduce Transparency → 玻璃变 frostier
- Increase Contrast → elements 变 black/white + 强对比 border
- Reduce Motion → 关闭 elastic 动效

---

## 2 · 业界批评（多源交叉）

### 2.1 The Verge：Liquid Glass 是错误方向
[The problem with Apple's new Liquid Glass design (David Pierce, 2025-09-15)](https://on.theverge.com/apple/778197/liquid-glass-iphone-watch-ipad-mac)

> "**It's the wrong idea.** Apple is trying to make a single interface metaphor work absolutely everywhere, and it just doesn't... Liquid Glass in particular, which is hell-bent on making everything feel deep and physical and layered, often just feels like clutter."

具体问题：
- Safari 搜索栏在彩色网页上几乎不可见
- Lock screen 通知文字"like a paint explosion"
- watchOS 26：找不到能稳定看清时间的表盘

### 2.2 WIRED：最具分裂性的系统设计
[Liquid Glass Could Be One of Apple's Most Divisive System Designs Yet (Craig Grannell, 2025-09-15)](https://www.wired.com/story/liquid-glass-could-be-one-of-apples-most-divisive-system-designs-yet/)

- Apple 自己的 press images 都难以辨认
- Apple Music 在 6 月和 8 月之间持续修补可读性

### 2.3 Fast Company：液态成功，玻璃失败
[iOS 26's Liquid Glass: The liquid works, but the glass is broken (Mark Wilson, 2025-09-17)](https://www.fastcompany.com/91405580/apple-liquid-glass-the-liquid-works-but-the-glass-is-broken)

> "Half a dozen UX experts agree that it's anywhere from mildly disappointing to outright broken, due to an aesthetic-first approach that could leave many users behind."

### 2.4 Infinum：实测对比度低至 1.5:1
[Apple's iOS 26 Liquid Glass: Sleek, Shiny, and Questionably Accessible (Davor Naumoski, 2025-06)](https://infinum.com/blog/apples-ios-26-liquid-glass-sleek-shiny-and-questionably-accessible)

> "We clocked 1.5:1 in places, and the bar is 4.5:1. Low contrast makes it difficult or impossible for users with low vision."

### 2.5 TechCrunch / 早期反应
[Love it or hate it? (Sarah Perez, 2025-06-10)](https://techcrunch.com/2025/06/10/love-it-or-hate-it-apples-new-liquid-glass-design-is-getting-mixed-reviews/)

类比 iOS 7 第一版：未完成度高，但 Apple 通常用一年时间修补。

### 2.6 Cupertino Lens：长期视角
[Liquid Glass Apple Design: Apple's Most Beautiful Mess Yet (2025-09-15)](https://cupertinolens.com/2025/09/15/liquid-glass-apple-design/)

> "Liquid Glass is meant to stick around, and while the first step might be messy, that's not unusual for Apple."

---

## 3 · 第三方应用的最佳实践

### 3.1 Linear 的 ProKit 路径（V3 直接学的对象）
[A Linear spin on Liquid Glass (Robb Böhnke, 2025-10-21)](https://linear.app/now/linear-liquid-glass)

关键判断：
> "We decided to **recreate our own version** of Liquid Glass. We wanted to capture what we loved about it while retaining the flexibility to design a navigation experience that fits the way people use Linear."

> "Liquid Glass is designed to feel fluid and friendly for a **broad consumer audience**. We saw an opportunity to apply it with a **ProKit philosophy: purpose-built, disciplined, and designed for sustained focus**."

> "**The one effect we chose not to reproduce was Liquid Glass's refraction.** Refraction can make dense professional interfaces harder to read."

工程理由：
- 不依赖 Apple API → 兼容 iOS 18 用户
- 不依赖 Apple beta 路线 → 避免 moving target

### 3.2 Acorn Design System（Mozilla Firefox）的整理
[iOS 26 and Liquid Glass · Acorn Design System](https://acorn.firefox.com/latest/mobile/patterns/i-os-26-and-liquid-glass-w2oH48nk)

把 Apple 红线整理成实操规则：

> - Reserve for navigation and controls, not content
> - Use glass sparingly to avoid distraction
> - Avoid glass-on-glass. Stacking glass surfaces adds noise and confusion.
> - Use tinting and color with restraint within glass
> - **Prioritize legibility and contrast. If glass makes text harder to read, remove the glass.**
> - Liquid glass is a functional cue, not a decoration.

---

## 4 · 设计师社区反应

### 4.1 WIRED 设计师圆桌
[Designers React to Apple's Liquid Glass Update (Reece Rogers, 2025-06-10)](https://www.wired.com/story/designers-react-to-apple-liquid-glass/)

意见两极：
- 正面："Beautiful, immersive, the future of UI"
- 负面："Hard to read, unfit for accessibility"

### 4.2 长期争议
[How "Liquid Design" Broke the iPhone (2026-02)](https://www.webdesignerdepot.com/how-liquid-design-broke-the-iphone-and-forced-apples-great-reset/)

>（来源观点，单一来源，谨慎引用）"iOS 26.2 推出了 Opaque Mode 作为补救。"

### 4.3 WWDC 全场综述
[WWDC 2025: What's new for the Apple community? (createwithswift, 2025-06-13)](https://createwithswift.com/wwdc-2025-whats-new-for-the-apple-community)

总结 Liquid Glass 三大特征：real-time rendering / contextual adaptation / responsive lensing。

---

## 5 · 对 ParallelMe V3 的应用

### 5.1 借用清单

| 借用什么 | 怎么用 | 落地位置 |
|---|---|---|
| Adaptive translucency | 弹层、点名当前发言层、签字印章 | 会议进行页 |
| Depth & layering | 议案纸 → 席位牌 → 用户操作底栏的三层 z-order | 全产品 |
| Specular highlight on interaction | 按钮 hover / press 微光 | 签字、点名按钮 |
| Tinted Glass 思路 | 席位被点名时发言区微染席位色（5–8% 透明） | 会议进行页 |
| Accessibility 自动响应 | 跟系统 Reduce Transparency / Increase Contrast 走 | 全产品 CSS media queries |

### 5.2 拒绝清单

| 拒绝什么 | 原因 |
|---|---|
| Refraction（折射） | 在密集纸面上让正文糊化（Linear 同样拒绝） |
| Glass-on-glass | 席位牌不能浮在议案纸玻璃上 |
| Translucent toolbar over text | 会议页底部主操作栏必须实色 + 上边线 |
| 默认 Liquid Glass 全屏 | 所有页面背景都是纸面，玻璃只在三处 |

### 5.3 一句话原则

> **"纸"是产品本体，"玻璃"只在三处出现 —— 弹层、当前焦点、状态反馈。**

详见 `V3-IVY-FINAL-DIRECTION.md` 第 2.3 节。

---

## 6 · 完整 URL 清单

```
https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass
https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/
https://developers.apple.com/videos/play/wwdc2025/219
https://developers.apple.com/videos/play/wwdc2025/356
https://developer.apple.com/videos/play/wwdc2025/284/
https://developers.apple.com/videos/play/wwdc2025/310
https://on.theverge.com/apple/778197/liquid-glass-iphone-watch-ipad-mac
https://www.wired.com/story/liquid-glass-could-be-one-of-apples-most-divisive-system-designs-yet/
https://www.fastcompany.com/91405580/apple-liquid-glass-the-liquid-works-but-the-glass-is-broken
https://infinum.com/blog/apples-ios-26-liquid-glass-sleek-shiny-and-questionably-accessible
https://techcrunch.com/2025/06/10/love-it-or-hate-it-apples-new-liquid-glass-design-is-getting-mixed-reviews/
https://cupertinolens.com/2025/09/15/liquid-glass-apple-design/
https://linear.app/now/linear-liquid-glass
https://acorn.firefox.com/latest/mobile/patterns/i-os-26-and-liquid-glass-w2oH48nk
https://www.wired.com/story/designers-react-to-apple-liquid-glass/
https://createwithswift.com/wwdc-2025-whats-new-for-the-apple-community
```
