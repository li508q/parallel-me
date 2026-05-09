import type { LlmRuntime } from "@/lib/llm";

const ENV_API_BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const ENV_API_KEY = process.env.OPENAI_API_KEY || "";
const ENV_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export function hasServerRuntime() {
  return Boolean(ENV_API_KEY && ENV_API_BASE && ENV_MODEL);
}

export function serverRuntimeStatus() {
  return {
    configured: hasServerRuntime(),
    label: providerLabel(ENV_API_BASE),
    model: ENV_MODEL,
  };
}

export function runtimeFromProvider(provider: any): LlmRuntime | undefined {
  if (provider?.apiKey && provider?.baseUrl && provider?.model) {
    return {
      baseUrl: provider.baseUrl,
      model: provider.model,
      apiKey: provider.apiKey,
    };
  }
  return hasServerRuntime() ? {} : undefined;
}

function providerLabel(baseUrl: string) {
  if (/deepseek/i.test(baseUrl)) return "DeepSeek";
  if (/openai/i.test(baseUrl)) return "OpenAI";
  if (/dashscope|aliyun/i.test(baseUrl)) return "百炼";
  if (/moonshot/i.test(baseUrl)) return "Kimi";
  if (/minimax/i.test(baseUrl)) return "MiniMax";
  if (/volces|ark/i.test(baseUrl)) return "豆包";
  return "服务器 API";
}
