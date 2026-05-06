// lib/provider.ts — Provider Setup
// Local-first: ProviderConfig + apiKey are stored on the user's device only.
// Server never persists them.

export type ProviderType =
  | "deepseek"
  | "bailian"
  | "kimi"
  | "minimax"
  | "doubao"
  | "custom";

export interface ProviderConfig {
  id: string;
  provider: ProviderType;
  label: string;
  baseUrl: string;
  model: string;
  apiKeyRef: "browser" | "session";
  maskedKey?: string;
  createdAt: number;
  lastTestedAt?: number;
  lastStatus?: "ok" | "failed";
  lastTestLatencyMs?: number;
  lastTestError?: string;
}

export interface ProviderPreset {
  provider: ProviderType;
  label: string;
  shortName: string;
  baseUrl: string;
  model: string;
  hint?: string;
  keyHint?: string;
  docsUrl?: string;
}

export const PRESETS: Record<ProviderType, ProviderPreset> = {
  deepseek: {
    provider: "deepseek",
    label: "DeepSeek",
    shortName: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    hint: "默认推荐。中文稳定、成本友好，适合五声圆桌；长期部署可手动改为 deepseek-v4-flash。",
    keyHint: "在 DeepSeek 平台创建 API key。官方文档提示 deepseek-chat 将于 2026-07-24 弃用，本版本按产品默认保留。",
    docsUrl: "https://api-docs.deepseek.com/zh-cn/",
  },
  bailian: {
    provider: "bailian",
    label: "阿里云百炼",
    shortName: "百炼",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    hint: "通义千问与百炼 OpenAI 兼容接口。北京地域默认地址已填好。",
    keyHint: "使用 DASHSCOPE_API_KEY / 百炼 API Key。",
    docsUrl: "https://help.aliyun.com/zh/model-studio/what-is-model-studio",
  },
  kimi: {
    provider: "kimi",
    label: "Kimi",
    shortName: "Kimi",
    baseUrl: "https://api.moonshot.ai/v1",
    model: "kimi-k2.6",
    hint: "Moonshot / Kimi OpenAI 兼容接口，适合长上下文。",
    keyHint: "在 Kimi API Platform 创建 Moonshot API key。",
    docsUrl: "https://platform.kimi.ai/docs/api/overview",
  },
  minimax: {
    provider: "minimax",
    label: "MiniMax",
    shortName: "MiniMax",
    baseUrl: "https://api.minimax.io/v1",
    model: "MiniMax-M2.7",
    hint: "MiniMax OpenAI 兼容接口，当前默认 M2.7。",
    keyHint: "在 MiniMax 开发者平台创建 API key。",
    docsUrl: "https://platform.minimax.io/docs/api-reference/text-openai-api",
  },
  doubao: {
    provider: "doubao",
    label: "豆包 / 火山方舟",
    shortName: "豆包",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    model: "doubao-seed-1-6-251015",
    hint: "火山方舟 OpenAI 兼容接口。若你创建了推理接入点，可把 model 改成 ep- 开头的接入点 ID。",
    keyHint: "在火山方舟 API Key 管理中创建 ARK_API_KEY。",
    docsUrl: "https://www.volcengine.com/docs/82379/1330626",
  },
  custom: {
    provider: "custom",
    label: "自定义 OpenAI 兼容",
    shortName: "自定义",
    baseUrl: "",
    model: "",
    hint: "用于智谱、Ollama、OpenAI、代理网关或任何兼容 /chat/completions 的服务。",
    keyHint: "填入该服务商的 API key。",
  },
};

const KEY_ACTIVE = "parallelme:v4:provider:active";
const KEY_SECRET_PREFIX = "parallelme:v4:provider:secret:";

export function loadActiveProvider(): ProviderConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const s = window.localStorage.getItem(KEY_ACTIVE);
    const parsed = s ? JSON.parse(s) : null;
    if (!parsed || !isProviderType(parsed.provider)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveActiveProvider(c: ProviderConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_ACTIVE, JSON.stringify(c));
}

export function loadProviderSecret(id: string, ref: "browser" | "session" = "browser"): string | null {
  if (typeof window === "undefined") return null;
  const storage = ref === "session" ? window.sessionStorage : window.localStorage;
  return storage.getItem(KEY_SECRET_PREFIX + id);
}

export function saveProviderSecret(id: string, apiKey: string, ref: "browser" | "session" = "browser") {
  if (typeof window === "undefined") return;
  const storage = ref === "session" ? window.sessionStorage : window.localStorage;
  storage.setItem(KEY_SECRET_PREFIX + id, apiKey);
}

export function clearProvider() {
  if (typeof window === "undefined") return;
  const active = loadActiveProvider();
  if (active) {
    window.localStorage.removeItem(KEY_SECRET_PREFIX + active.id);
    window.sessionStorage.removeItem(KEY_SECRET_PREFIX + active.id);
  }
  window.localStorage.removeItem(KEY_ACTIVE);
}

export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}${"•".repeat(Math.min(key.length - 8, 8))}${key.slice(-4)}`;
}

export function newProviderId(): string {
  return `prov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isProviderType(value: unknown): value is ProviderType {
  return typeof value === "string" && value in PRESETS;
}

// Status pill computation
export type ProviderStatusVariant =
  | "ok" | "warn" | "untested" | "missing";

export interface ProviderStatusInfo {
  variant: ProviderStatusVariant;
  label: string;
  detail?: string;
}

export function providerStatus(p: ProviderConfig | null): ProviderStatusInfo {
  if (!p)
    return { variant: "missing", label: "未配置 API", detail: "先放一把钥匙" };
  if (!loadProviderSecret(p.id, p.apiKeyRef)) {
    return { variant: "missing", label: "API Key 不在当前会话", detail: "重新配置" };
  }
  if (p.lastStatus === "ok")
    return { variant: "ok", label: p.label, detail: p.model };
  if (p.lastStatus === "failed")
    return {
      variant: "warn",
      label: p.label,
      detail: (p.lastTestError || "上次测试失败").slice(0, 60),
    };
  return { variant: "untested", label: p.label, detail: "尚未测试" };
}

// For passing into focused LLM endpoints.
export interface RuntimeProviderPayload {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export function toRuntimePayload(
  p: ProviderConfig | null
): RuntimeProviderPayload | null {
  if (!p) return null;
  const apiKey = loadProviderSecret(p.id, p.apiKeyRef);
  if (!apiKey) return null;
  return { baseUrl: p.baseUrl, model: p.model, apiKey };
}
