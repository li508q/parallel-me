// lib/ai-provider.ts — Vercel AI SDK provider factory.
// Creates an OpenAI-compatible provider from LlmRuntime config.

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LlmRuntime } from "./llm";

const ENV_API_BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const ENV_API_KEY = process.env.OPENAI_API_KEY || "";
const ENV_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export interface ResolvedProvider {
  model: ReturnType<ReturnType<typeof createOpenAICompatible>>;
  modelId: string;
}

/**
 * Create an AI SDK provider + model from LlmRuntime configuration.
 * Falls back to environment variables if no runtime provided.
 */
export function createProvider(runtime?: LlmRuntime): ResolvedProvider {
  const baseUrl = runtime?.baseUrl || ENV_API_BASE;
  const apiKey = runtime?.apiKey || ENV_API_KEY;
  const modelId = runtime?.model || ENV_MODEL;

  const provider = createOpenAICompatible({
    name: "parallelme-provider",
    baseURL: baseUrl.replace(/\/+$/, ""),
    apiKey,
  });

  return {
    model: provider(modelId),
    modelId,
  };
}
