// lib/provider.ts — Provider Setup
// Local-first: ProviderConfig + apiKey are stored on the user's device only.
// Server never persists them. See docs/design/TECH-ARCHITECTURE.md § 4.

export type ProviderType = "deepseek" | "openai" | "openai-compatible" | "mock";

export interface ProviderConfig {
  id: string;
  provider: ProviderType;
  label: string;
  baseUrl: string;        // empty for mock
  model: string;          // empty for mock
  apiKeyRef: "browser" | "session" | "env";
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
  baseUrl: string;
  model: string;
  hint?: string;
}

export const PRESETS: Record<ProviderType, ProviderPreset> = {
  deepseek: {
    provider: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    hint: "推荐：便宜、中文好、不卡。注册地：platform.deepseek.com",
  },
  openai: {
    provider: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    hint: "标准且稳定。需要 OpenAI 账号。",
  },
  "openai-compatible": {
    provider: "openai-compatible",
    label: "自定义 OpenAI 兼容",
    baseUrl: "",
    model: "",
    hint: "Moonshot / 智谱 / Together / Groq / 本地 Ollama 都走这条。",
  },
  mock: {
    provider: "mock",
    label: "演员模式",
    baseUrl: "",
    model: "",
    hint: "无需 key。声音是预设剧本，体验产品流程用。",
  },
};

const KEY_ACTIVE = "parallelme:v3:provider:active";
const KEY_SECRET_PREFIX = "parallelme:v3:provider:secret:";

export function loadActiveProvider(): ProviderConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const s = window.localStorage.getItem(KEY_ACTIVE);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function saveActiveProvider(c: ProviderConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_ACTIVE, JSON.stringify(c));
}

export function loadProviderSecret(id: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY_SECRET_PREFIX + id);
}

export function saveProviderSecret(id: string, apiKey: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_SECRET_PREFIX + id, apiKey);
}

export function clearProvider() {
  if (typeof window === "undefined") return;
  const active = loadActiveProvider();
  if (active) {
    window.localStorage.removeItem(KEY_SECRET_PREFIX + active.id);
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

// Status pill computation
export type ProviderStatusVariant =
  | "actor" | "ok" | "warn" | "untested" | "missing";

export interface ProviderStatusInfo {
  variant: ProviderStatusVariant;
  label: string;
  detail?: string;
}

export function providerStatus(p: ProviderConfig | null): ProviderStatusInfo {
  if (!p)
    return { variant: "missing", label: "钥匙未配置", detail: "去设置一把" };
  if (p.provider === "mock")
    return { variant: "actor", label: "演员模式", detail: "声音是预设剧本" };
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

// For passing into /api/parallel and other LLM endpoints.
export interface RuntimeProviderPayload {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export function toRuntimePayload(
  p: ProviderConfig | null
): RuntimeProviderPayload | null {
  if (!p || p.provider === "mock") return null;
  const apiKey = loadProviderSecret(p.id);
  if (!apiKey) return null;
  return { baseUrl: p.baseUrl, model: p.model, apiKey };
}
