# ParallelMe v0.6 · Visual System

> 视觉方向：纸墨建立秩序，矿物色标记五声。高级感来自档案感、克制、可追溯和私密，而不是装饰性心理测试风格。

## 1. Visual Principles

- 纸是本体：主界面以纸面、墨色、细线组织信息。
- 声音色只做识别：身份点、左边框、关系线、短标签。
- 文字不能靠颜色表达含义：状态必须有文字。
- 中文字距为 0，不使用负字距。
- 工作台不使用 viewport-fluid 字号。
- 不做玻璃折射、不做大面积彩色卡片。
- 卡片半径保持克制，重复对象使用 `8px` 以下圆角。

## 2. Color Tokens

### Paper / Ink

| Token | Hex | 用途 |
| --- | --- | --- |
| `paper.base` | `#F4F1EC` | 页面底色 |
| `paper.lift` | `#FBF9F4` | 主纸面、纸页 |
| `paper.sunk` | `#EDE2D0` | 次级区域、档案层 |
| `paper.edge` | `#D8CBB8` | 细线、纸边 |
| `surface.deep` | `#1A1816` | 清明落定、承诺峰值 |
| `ink.core` | `#191713` | 主文字、主 CTA |
| `ink.body` | `#3C3932` | 正文 |
| `ink.mute` | `#7C7568` | 侧记、meta |
| `ink.faint` | `#B7AC9B` | disabled、低存在 |

### Voice Colors

| Token | Hex | 声音 |
| --- | --- | --- |
| `seat.rest` | `#556F7A` | 躺平的我 |
| `seat.money` | `#8A6F3D` | 搞钱的我 |
| `seat.roam` | `#3F6B5A` | 出走的我 |
| `seat.filial` | `#8C5042` | 怕妈担心的我 |
| `seat.future` | `#5E5369` | 5 年后的我 |
| `seat.silent` | `#899199` | 长期低出现提示 |
| `seat.exiled` | `#6F3F35` | 被压住声音的小面积提示 |

### State Colors

| Token | Hex | 用途 |
| --- | --- | --- |
| `seal.action` | `#8E3F32` | 承诺、重要确认 |
| `attention.copper` | `#A8844D` | 最响、重点 |
| `safe.green` | `#536E5A` | 已完成、低风险 |
| `trace.blue` | `#455F70` | 证据链、可追溯 |

比例建议：纸墨 78%，纸面层 14%，五声识别色 5%，状态色 3%。

## 3. Typography

| 场景 | 字体栈 | 用途 |
| --- | --- | --- |
| Productive UI | Geist + PingFang SC + Noto Sans SC + system-ui | 导航、按钮、表单、阶段轨 |
| Expressive Ritual | Source Han Serif SC + Noto Serif SC + Songti SC | 陈情大字、清明句、承诺 |
| Mono Evidence | Geist Mono + IBM Plex Mono + SF Mono | API、证据 ID、导出文件名 |

规则：

- Sans 处理密集操作。
- Serif 只用于仪式性文本，不用于按钮和表单。
- Mono 只用于技术和证据链。
- 中文 letter-spacing 必须是 0。

## 4. Motion

动效是纸墨，不是弹跳。

| 场景 | 方向 |
| --- | --- |
| 声音入席 | 纸卡轻落，不 bounce |
| 阶段推进 | 轻微横移 + 透明度交叉 |
| 当前声音 | 慢闪身份点 |
| 清明落定 | 墨色聚焦，避免戏剧化 |

默认使用 CSS transition。除非交互复杂，不引入重型 motion 库。

## 5. Layout

会谈页三层结构：

- 顶部：返回、阶段轨、当前体验名。
- 中部：时间轴与纸面记录。
- 底部：主持人台，承载输入与主动作。

`我的声音` 页面：

- 总览不是 dashboard 炫技，而是长期自我观察。
- 五声卡片按长期出现状态排序。
- 统计数字必须服务于“我如何被某一声带走/如何重新介入”。

## 6. SVG Assets

保留并同步五张设计图：

- [COLOR-SYSTEM-DIAGRAM.svg](./COLOR-SYSTEM-DIAGRAM.svg)
- [INTERACTION-WIREFLOW.svg](./INTERACTION-WIREFLOW.svg)
- [IA-OBJECT-MAP.svg](./IA-OBJECT-MAP.svg)
- [UI-BOARD.svg](./UI-BOARD.svg)
- [UI-BOARD-REFINED.svg](./UI-BOARD-REFINED.svg)

它们是设计讨论用图，不是代码生成源。真实 token 以 `app/globals.css` 与 `lib/design/tokens/*` 为准。
