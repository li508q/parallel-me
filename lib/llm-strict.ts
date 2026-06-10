import { generateObject, generateText } from "ai";
import { z } from "zod";

import { createProvider } from "./ai-provider.ts";
import type { ScribeStreamEvent } from "./agents/events.ts";
import { validateJsonWithSchema } from "./llm-harness.ts";

const ENV_API_KEY = process.env.OPENAI_API_KEY || "";

export type StrictMsg = { role: "system" | "user" | "assistant"; content: string };

export interface StrictLlmRuntime {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

type StrictLlmErrorCode =
  | "rate_limit"
  | "timeout"
  | "server_error"
  | "parse_error"
  | "empty_response"
  | "context_overflow"
  | "auth_error"
  | "safety_block"
  | "unknown";

class StrictLlmError extends Error {
  code: StrictLlmErrorCode;
  retryable: boolean;
  retryAfterMs?: number;

  constructor(
    message: string,
    code: StrictLlmErrorCode,
    retryable: boolean,
    retryAfterMs?: number,
  ) {
    super(message);
    this.name = "StrictLlmError";
    this.code = code;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}

interface StrictStreamHandlers {
  onReasoning?: (delta: string, meta?: { source?: string; mode?: "native" | "public" }) => void;
  onEvent?: (event: ScribeStreamEvent) => void;
}

function splitAiSdkPrompt(messages: StrictMsg[]) {
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n") || undefined;
  const modelMessages = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }));
  return { system, messages: modelMessages };
}

function classifyStrictHttpError(status: number, body: string, headers?: Headers): StrictLlmError {
  if (status === 429) {
    const retryAfter = headers?.get("retry-after-ms")
      ? Number(headers.get("retry-after-ms"))
      : headers?.get("retry-after")
        ? Number(headers.get("retry-after")) * 1000
        : undefined;
    return new StrictLlmError("请求过于频繁，请稍后再试 (429)", "rate_limit", true, retryAfter || 5000);
  }
  if (status === 401 || status === 403) {
    return new StrictLlmError(`API Key 无效或已过期 (${status})`, "auth_error", false);
  }
  if (status >= 500) {
    return new StrictLlmError(`模型服务暂时不可用 (${status})`, "server_error", true);
  }
  if (status === 400 && /context.*(length|limit|too long|max)/i.test(body)) {
    return new StrictLlmError("上下文过长，请缩短输入", "context_overflow", false);
  }
  return new StrictLlmError(`模型请求失败：HTTP ${status} ${body.slice(0, 200)}`, "unknown", status >= 500);
}

function errorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || "unknown");
  return raw.replace(/\s+/g, " ").slice(0, 360);
}

function isRetryableStrictError(error: unknown): error is { code: StrictLlmErrorCode; retryable: boolean } {
  return Boolean(
    error
    && typeof error === "object"
    && "retryable" in error
    && typeof (error as { retryable?: unknown }).retryable === "boolean"
    && "code" in error,
  );
}

export function strictRepairGuidance(errors: string[]): string[] {
  const guidance = new Set<string>();
  for (const rawError of errors) {
    const error = rawError.replace(/\s+/g, " ");
    if (/questions?\.\d+\.text|Too big|expected string|max|<=|at most|longer than/i.test(error)) {
      guidance.add("把题干压缩成一句清楚的问句；如果包含多个追问任务，拆掉次要任务。");
    }
    if (/没有返回|No object generated|could not parse|parse|JSON|schema|校验失败|结构化生成失败/i.test(error)) {
      guidance.add("重新生成完整结果；每道题都要有题干、自然语言选项和“都不准，我自己说”。");
    }
    if (/贴住用户原文|具体名词|具体锚点|用户材料|具体名词、数字、关系/.test(error)) {
      guidance.add("题干和至少两个选项必须引用用户原文或回答里的具体名词、数字、关系。");
    }
    if (/本轮议题|圆桌发言|用户回答|观察账本|具体张力/.test(error)) {
      guidance.add("问询题干和选项必须引用本轮议题、圆桌发言、用户回答或观察账本里的具体张力。");
    }
    if (/内部标记|技术词/.test(error)) {
      guidance.add("用户可见内容不要出现内部标记、英文模块名、格式说明或技术词。");
    }
    if (/固定模板|程序模板|模板/.test(error)) {
      guidance.add("不要使用固定句式；从用户刚说的话里挑具体张力重新发问。");
    }
    if (/重复|已经问过/.test(error)) {
      guidance.add("不要重复已经问过的问题；换一个能打开新信息的角度。");
    }
    if (/缺少至少两个真实可选回应|至少两个真实/.test(error)) {
      guidance.add("每道题至少给出两个真实可选回应，再加“都不准，我自己说”。");
    }
    if (/缺少“都不准|exactly one custom|custom\/free-text|自定义/.test(error)) {
      guidance.add("每道题必须且只能有一个“都不准，我自己说”。");
    }
    if (/同一类信息缺口|purpose|missing_keys|module|missing_modules|信息方向|偏离|落点/.test(error)) {
      guidance.add("同一轮的问题要分别服务不同缺口或落点，不要重复问同一种信息。");
    }
    if (/阶段一证据还不够|还不能进入提案|继续向用户/.test(error)) {
      guidance.add("当前材料还不能进入提案，请继续向用户追问事实、边界或圆桌要验证的规则。");
    }
    if (/不能进入本心落定|继续问询|已经可以进入本心落定/.test(error)) {
      guidance.add("当前材料还不能生成本心落定，请继续问最能改变最终结论的那个缺口。");
    }
    if (/占位符|建议口吻|待补充|待挖掘|未知|不清楚/.test(error)) {
      guidance.add("不要写占位符、建议句或诊断句；改成用户可以校对的具体表述。");
    }
    if (/吸收用户反馈|修正后的议题/.test(error)) {
      guidance.add("修正提案必须吸收用户反馈里的具体内容，不能只返回原提案。");
    }
  }

  if (!guidance.size) {
    guidance.add("重新生成一版能直接展示给用户的结果，语言自然、具体、不要解释生成过程。");
  }
  return [...guidance].slice(0, 5);
}

function strictRepairBlock(errors: string[]): string {
  if (!errors.length) return "";
  return [
    "",
    "",
    "上一版还不能直接展示给用户。请重新生成完整结果，只按下面的人话要求修正：",
    ...strictRepairGuidance(errors).map((item) => `- ${item}`),
    "",
    "不要解释，不要复述这些要求，不要输出任何自检文字。",
  ].join("\n");
}

async function repairJsonObject<T>({
  rawText,
  schema,
  runtime,
  maxOutputTokens,
  failurePrefix,
  errors,
}: {
  rawText: string;
  schema: z.ZodType<T>;
  runtime?: StrictLlmRuntime;
  maxOutputTokens: number;
  failurePrefix: string;
  errors: string[];
}): Promise<T> {
  const { model } = createProvider(runtime);
  const repairPrompt = `下面是一段本应符合 schema 的 JSON 输出，但它没有通过解析或校验。

错误：
- ${errors.join("\n- ")}

原始输出：
${rawText.slice(0, 6000)}

请只返回修复后的完整 JSON 对象：
- 不要解释
- 不要使用 Markdown
- 不要输出代码块
- 不要新增 schema 之外的字段
- 保留原本的问题语义，只修复结构和字段`;

  const repaired = await generateText({
    model,
    messages: [{ role: "user", content: repairPrompt }],
    temperature: 0,
    maxOutputTokens,
    abortSignal: AbortSignal.timeout(45_000),
  });

  return validateJsonWithSchema(repaired.text || "", schema);
}

async function repairStructuredJsonText<T>({
  rawText,
  schema,
  runtime,
  maxOutputTokens,
  failurePrefix,
  errors,
}: {
  rawText: string;
  schema: z.ZodType<T>;
  runtime?: StrictLlmRuntime;
  maxOutputTokens: number;
  failurePrefix: string;
  errors: string[];
}): Promise<string | null> {
  try {
    const parsed = validateJsonWithSchema(rawText, schema);
    return JSON.stringify(parsed);
  } catch {
    // Fall through to an explicit repair call when the raw text is not already salvageable.
  }

  try {
    const repaired = await repairJsonObject({
      rawText,
      schema,
      runtime,
      maxOutputTokens,
      failurePrefix,
      errors,
    });
    return JSON.stringify(repaired);
  } catch (error: any) {
    console.warn(`[${failurePrefix}] repair hook failed`, error?.message || error);
    return null;
  }
}

export async function generateStrictObjectAttempt<T>({
  messages,
  schema,
  runtime,
  maxOutputTokens,
  missingRuntimeMessage,
  timeoutMessage,
  failurePrefix,
  schemaName,
  schemaDescription,
  temperature,
}: {
  messages: StrictMsg[];
  schema: z.ZodType<T>;
  runtime?: StrictLlmRuntime;
  maxOutputTokens: number;
  missingRuntimeMessage: string;
  timeoutMessage: string;
  failurePrefix: string;
  schemaName?: string;
  schemaDescription?: string;
  temperature?: number;
}): Promise<T> {
  if (!(runtime?.apiKey || ENV_API_KEY)) {
    throw new StrictLlmError(missingRuntimeMessage, "auth_error", false);
  }

  const { model } = createProvider(runtime);

  try {
    const prompt = splitAiSdkPrompt(messages);
    const result = await generateObject({
      model,
      ...prompt,
      schema,
      schemaName,
      schemaDescription,
      temperature: temperature ?? 0.18,
      maxOutputTokens,
      abortSignal: AbortSignal.timeout(60_000),
      experimental_repairText: async ({ text, error }) =>
        repairStructuredJsonText({
          rawText: text,
          schema,
          runtime,
          maxOutputTokens,
          failurePrefix,
          errors: [errorMessage(error)],
        }),
    });
    return result.object as T;
  } catch (err: any) {
    if (isRetryableStrictError(err)) throw err;
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      throw new StrictLlmError(timeoutMessage, "timeout", true);
    }
    const status = err?.status || err?.statusCode;
    if (status) throw classifyStrictHttpError(status, err?.message || "", undefined);
    throw new StrictLlmError(`${failurePrefix}：${err?.message || "unknown"}`, "parse_error", true);
  }
}

export async function runStrictScribeLoop<TStrict, TResult>({
  handlers,
  retrySource,
  retryNotice,
  failureLogLabel,
  failureMessage,
  maxAttempts = 3,
  generate,
  accept,
}: {
  handlers: StrictStreamHandlers;
  retrySource: string;
  retryNotice: string;
  failureLogLabel: string;
  failureMessage: string;
  maxAttempts?: number;
  generate: (repairBlock: string) => Promise<TStrict>;
  accept: (strict: TStrict) => { result: TResult; errors: string[] };
}): Promise<TResult> {
  let lastErrors: string[] = [];
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const repairBlock = strictRepairBlock(lastErrors);
    if (attempt === 1) {
      handlers.onEvent?.({
        type: "llm_call_started",
        operation: failureLogLabel,
        attempt,
        source: retrySource,
      });
    }
    if (attempt > 1) {
      const publicErrors = strictRepairGuidance(lastErrors);
      handlers.onEvent?.({
        type: "repair_started",
        operation: failureLogLabel,
        attempt,
        errors: publicErrors,
        source: retrySource,
      });
      handlers.onReasoning?.(retryNotice, { source: retrySource, mode: "public" });
    }

    try {
      const strict = await generate(repairBlock);
      const accepted = accept(strict);
      if (accepted.errors.length) {
        lastErrors = accepted.errors;
        handlers.onEvent?.({
          type: "validation_failed",
          operation: failureLogLabel,
          attempt,
          errors: strictRepairGuidance(accepted.errors),
          source: retrySource,
        });
        continue;
      }
      return accepted.result;
    } catch (error) {
      if (isRetryableStrictError(error) && !error.retryable) throw error;
      lastError = error;
      lastErrors = [errorMessage(error)];
      handlers.onEvent?.({
        type: "recoverable_error",
        operation: failureLogLabel,
        code: isRetryableStrictError(error) ? error.code : "parse_error",
        message: "模型输出还没有整理成稳定结果，正在重试。",
        retryable: true,
        source: retrySource,
      });
    }
  }

  console.warn(`[${failureLogLabel}] strict generation failed`, lastError || lastErrors);
  throw new StrictLlmError(
    failureMessage,
    isRetryableStrictError(lastError) ? lastError.code : "parse_error",
    isRetryableStrictError(lastError) ? lastError.retryable : true,
  );
}
