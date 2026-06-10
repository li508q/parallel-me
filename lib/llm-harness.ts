import { z } from "zod";

const INTERNAL_ANCHOR_WORDS = new Set([
  "action",
  "alignment",
  "acceptance",
  "accepted",
  "axis",
  "answer",
  "antithesis",
  "ask",
  "constraints",
  "context",
  "core",
  "current",
  "dialogue",
  "dilemma",
  "expected",
  "fantasy",
  "fears",
  "falsified",
  "frame",
  "hegelian",
  "inquiry",
  "input",
  "issue",
  "json",
  "key",
  "keys",
  "missing",
  "module",
  "object",
  "option",
  "minimum",
  "probe",
  "purpose",
  "question",
  "questions",
  "ready",
  "refused",
  "report",
  "resolution",
  "schema",
  "scribe",
  "settlement",
  "stage",
  "surface",
  "synthesis",
  "task",
  "thesis",
  "thinking",
  "user",
  "value",
  "values",
]);

const VISIBLE_REASONING_LEAK_RE =
  /\b(JSON|schema|schema_version|falsified_fantasy|core_value_axis|cost_acceptance|minimum_action|dialectic_synthesis|Surface Dilemma|Current Constraints|Expected Resolution|No object generated|could not parse|expected string|Too big)\b|字段|直接输出|技术词汇|完全符合要求|结构化生成失败|校验失败/i;

export class StructuredOutputValidationError extends Error {
  errors: string[];

  constructor(message: string, errors: string[] = [message]) {
    super(message);
    this.name = "StructuredOutputValidationError";
    this.errors = errors;
  }
}

export function sanitizeVisibleReasoning(text: string): string {
  return text
    .replace(/(?:^|\n)[^\n]*(?:No object generated|could not parse|expected string|Too big|JSON\s*schema|schema\s*校验失败|结构化生成失败|JSON\s*修复|重新出题|技术词汇|完全符合要求)[^\n]*(?=\n|$)/gi, "\n")
    .replace(/Surface\s*Dilemma/gi, "具象化困惑")
    .replace(/Current\s*Constraints/gi, "现实处境")
    .replace(/Core\s*(Values?|Fears?)(?:\s*\/\s*Fears?)?/gi, "隐秘关切")
    .replace(/Expected\s*Resolution/gi, "圆桌任务")
    .replace(/falsified[_\s-]*fantasy/gi, "被证伪的幻想")
    .replace(/core[_\s-]*value[_\s-]*axis/gi, "核心价值主轴")
    .replace(/cost[_\s-]*acceptance/gi, "痛苦接纳")
    .replace(/minimum[_\s-]*action/gi, "最小行动")
    .replace(/dialectic[_\s-]*synthesis/gi, "正反合整合")
    .replace(/alignmentProfile/gi, "落定画像")
    .replace(/missing[_\s-]*(keys|modules)/gi, "仍缺的落点")
    .replace(/schema[_\s-]*version/gi, "格式版本")
    .replace(/\b4[-\s]?Key\b/gi, "四个关键面")
    .replace(/\bKey\s*([1-4])?\b/gi, "关键面$1")
    .replace(/\bJSON\b/gi, "格式")
    .replace(/\bschema\b/gi, "格式")
    .replace(/\bid\b/gi, "标识")
    .replace(/字段名?/g, "表达项")
    .replace(/检查[:：][^\n]*(?:\n|$)?/g, "")
    .replace(/直接输出。?/g, "")
    .replace(/(?:^|\n)\s*选项设计[:：][\s\S]*$/g, "")
    .replace(/输出判断过程。?/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hasVisibleReasoningLeak(text: string): boolean {
  return VISIBLE_REASONING_LEAK_RE.test(text);
}

export function extractAnchorTerms(
  text: string,
  options: {
    dictionary?: readonly string[];
    limit?: number;
  } = {},
): string[] {
  const anchors = new Set<string>();
  const source = sanitizeVisibleReasoning(text)
    .replace(/\b(?:Surface|Dilemma|Current|Constraints|Core|Values?|Fears?|Expected|Resolution|Key|Keys?|JSON|schema|action|proposal|probe|inquiry|module|missing|ready|confidence|question|questions|option|options)\b|[a-z]+(?:_[a-z]+)+/gi, " ")
    .replace(/\s+/g, " ");
  const lowerSource = source.toLowerCase();

  for (const term of options.dictionary || []) {
    if (lowerSource.includes(term.toLowerCase())) anchors.add(term);
  }

  const matches = source.match(/[A-Za-z][A-Za-z0-9.+#-]{1,24}|\d+(?:\.\d+)?(?:w|W|万|k|K|岁|年|个月|月|天)?/g) || [];
  for (const match of matches) {
    const cleaned = match.trim();
    const lower = cleaned.toLowerCase();
    if (cleaned.length < 2) continue;
    if (INTERNAL_ANCHOR_WORDS.has(lower)) continue;
    if (/^(the|and|or|vs|api)$/i.test(cleaned)) continue;
    anchors.add(cleaned);
  }

  return [...anchors]
    .sort((a, b) => b.length - a.length)
    .slice(0, options.limit ?? 12);
}

export function extractJsonObjectCandidates(text: string): string[] {
  const trimmed = text.trim();
  const candidates: string[] = [];
  const fencedMatches = [...trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const match of fencedMatches) {
    const block = match[1]?.trim();
    if (block?.startsWith("{")) candidates.push(block);
  }

  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
      continue;
    }
    if (char === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        candidates.push(trimmed.slice(start, index + 1));
        start = -1;
      }
    }
  }

  const unique = [...new Set(candidates.map((candidate) => candidate.trim()).filter(Boolean))];
  if (!unique.length) {
    throw new StructuredOutputValidationError("模型没有返回 JSON 对象");
  }
  return unique;
}

export function zodIssueMessages(error: z.ZodError, limit = 8): string[] {
  return error.issues
    .slice(0, limit)
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
}

export function validateJsonWithSchema<T>(rawText: string, schema: z.ZodType<T>): T {
  const candidates = extractJsonObjectCandidates(rawText);
  const errors: string[] = [];
  for (const candidate of candidates) {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(candidate);
    } catch (error: any) {
      errors.push(`JSON 解析失败：${error?.message || "unknown"}`);
      continue;
    }
    const parsed = schema.safeParse(parsedJson);
    if (parsed.success) return parsed.data;
    errors.push(`JSON schema 校验失败：${zodIssueMessages(parsed.error).join("；")}`);
  }

  throw new StructuredOutputValidationError(errors.at(-1) || "JSON schema 校验失败", errors);
}
