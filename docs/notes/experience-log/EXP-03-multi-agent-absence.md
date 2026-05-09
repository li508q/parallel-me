# EXP-03 ·「再来一轮」缺席声音不可见

- 记录时间：2026-05-06
- 涉及阶段：`stage === "roundtable"` · `moveType === "continue_all"`
- 严重度：🔴 高（影响产品核心价值"五声齐鸣"的成立）
- 关联调研：[ER-01 多 Agent 结构化输出可靠性](../engineering-research/ER-01-multi-agent-structured-output.md)
- 关联设计：[DC-01 Scribe Activity · Layer 4 完成回收](../design-concepts/DC-01-scribe-activity.md)
- 关联需求：[S7 单次调用改 Slot-based / Fan-out](../requirements/backlog.md#s7) · [S8 Schema Gate + Repair Loop](../requirements/backlog.md#s8) · [S9 占位卡 + 重试按钮 UI 兜底](../requirements/backlog.md#s9)

---

## 触发场景
五声第一轮立论结束后，用户点击底部"再来一轮"按钮，期望五个声音都对当前局面给出新一轮回应。但实际渲染中只有 3 个声音（如「妈妈期待」「未来视角」等）出现新发言，**另外 2 个声音直接缺席**，UI 上没有任何提示——既看不到"它没说话"的占位，也没有任何错误信息。

## 根因（代码读出来的，非猜测）

**这不是 UI bug，是 LLM 没按预期返回。** 完整证据链：

1. **前端按钮**（`app/meeting/page.tsx:484-491`）触发 `submitRoundtableMove("continue_all")`
2. **前端处理**（`app/meeting/page.tsx:323-330`）：拿到后端 `turns` 后直接 `[...prev.turns, ...turns]` 追加，**不校验数量**——后端给几条就显示几条
3. **后端 prompt**（`lib/llm.ts:367-369`）只示范了 1 条 turn 的 example：
   ```
   - continue_all / user_to_table：{"turns":[{"voice_id":"lay","text":"...","refers_to":["money"]}], ...}
   ```
   **没有明确写"必须返回 5 条"**，LLM 容易照着 example 只生成几条
4. **后端 normalize**（`lib/llm.ts:1019-1023`）：`turns.length > 0` 就直接透传，只有"一条都没有"才整体回退到 fallback。**部分缺失不会被发现**
5. **fallback 逻辑**（`lib/llm.ts:1007-1024`）本身是对的——`continue_all` 时会用 `VOICE_IDS` 全量生成 5 条——**但永远到不了这一步**，因为 LLM 已经返回了 3 条非空数据

## 这是单点 bug 还是模式性问题
**模式性问题。** 任何"一次 LLM 调用产出 N 个 Agent 输出"的场景都会同时遇到：
- Schema 完整性风险（漏字段/漏数组项）
- 角色串味风险（互相风格污染）
- 可观测性盲区（黑盒，失败原因不明）

详细的工程方法论见：[ER-01 多 Agent 结构化输出可靠性](../engineering-research/ER-01-multi-agent-structured-output.md)。

## 关联设计概念
- **Schema Gate Pattern** — JSON Schema 不只校验"格式合法"，还要校验"业务完整性"
- **Self-Healing Fallback** — 部分缺失要补齐，不能"有就行"
- **Map-Reduce Fan-Out** — 多 Agent 场景下，每个 Agent 一次独立 LLM 调用，再聚合
- **Observable Failure** — 失败要被用户看见（占位 UI），而不是静默吞掉
