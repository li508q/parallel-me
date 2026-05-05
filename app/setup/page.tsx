"use client";

// Provider Setup Wizard — 5 steps. Pure visual (no .scribble/.hand-box).
// See TECH-ARCHITECTURE.md § 4 for product spec.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PRESETS,
  newProviderId,
  saveActiveProvider,
  saveProviderSecret,
  maskKey,
  loadActiveProvider,
  clearProvider,
  type ProviderType,
  type ProviderConfig,
} from "@/lib/provider";

type Step = 1 | 2 | 3 | 4 | 5;
type SaveMode = "browser" | "session" | "env";

interface TestResult {
  ok: boolean;
  model?: string;
  latencyMs?: number;
  sampleReply?: string;
  error?: string;
}

const PROVIDERS_ORDER: ProviderType[] = [
  "deepseek",
  "openai",
  "openai-compatible",
  "mock",
];

export default function SetupPage() {
  const router = useRouter();
  const existing = typeof window !== "undefined" ? loadActiveProvider() : null;

  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<ProviderType | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saveMode, setSaveMode] = useState<SaveMode>("browser");

  function selectProvider(p: ProviderType) {
    setSelected(p);
    const preset = PRESETS[p];
    setBaseUrl(preset.baseUrl);
    setModel(preset.model);
    setApiKey("");
    setTestResult(null);
  }

  function next() {
    if (step === 1) {
      if (!selected) return;
      setStep(selected === "mock" ? 5 : 2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      saveAndFinish();
    }
  }

  function back() {
    if (step === 5 && selected === "mock") {
      setStep(1);
      return;
    }
    if (step > 1) setStep((step - 1) as Step);
  }

  async function runTest() {
    if (!apiKey || !baseUrl || !model) {
      setTestResult({ ok: false, error: "请填写完整 base URL / model / key" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const r = await fetch("/api/provider/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, model, apiKey }),
      });
      const j: TestResult = await r.json();
      setTestResult(j);
    } catch (e: any) {
      setTestResult({ ok: false, error: e?.message || "网络错误" });
    } finally {
      setTesting(false);
    }
  }

  function saveAndFinish() {
    if (!selected) return;
    const id = newProviderId();
    const config: ProviderConfig = {
      id,
      provider: selected,
      label: PRESETS[selected].label,
      baseUrl,
      model,
      apiKeyRef: saveMode === "env" ? "env" : saveMode,
      maskedKey: apiKey ? maskKey(apiKey) : undefined,
      createdAt: Date.now(),
      lastTestedAt: testResult ? Date.now() : undefined,
      lastStatus: testResult?.ok ? "ok" : testResult ? "failed" : undefined,
      lastTestLatencyMs: testResult?.latencyMs,
      lastTestError: testResult?.ok ? undefined : testResult?.error?.slice(0, 120),
    };
    saveActiveProvider(config);
    if (saveMode === "browser" && apiKey && selected !== "mock") {
      saveProviderSecret(id, apiKey);
    }
    setStep(5);
  }

  function finishMock() {
    const id = newProviderId();
    const config: ProviderConfig = {
      id,
      provider: "mock",
      label: PRESETS.mock.label,
      baseUrl: "",
      model: "",
      apiKeyRef: "browser",
      createdAt: Date.now(),
    };
    saveActiveProvider(config);
    router.push("/");
  }

  function finishReal() {
    router.push("/");
  }

  function deleteExisting() {
    if (!confirm("将删除当前钥匙与连接配置。确认？")) return;
    clearProvider();
    location.reload();
  }

  const canNext =
    (step === 1 && !!selected) ||
    (step === 2 && !!apiKey && !!baseUrl && !!model) ||
    step === 3 ||
    step === 4;

  return (
    <main className="min-h-screen px-5 sm:px-10 py-12 sm:py-16 max-w-2xl mx-auto font-sans text-ink-body">
      <header className="mb-12">
        <Link
          href="/"
          className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core transition-colors"
        >
          ← 返回我的阁
        </Link>
        <p className="mt-8 text-xs tracking-[0.18em] text-ink-mute uppercase mb-2">
          ParallelMe · 内阁会议
        </p>
        <h1 className="font-serif text-headline text-ink-core leading-tight">
          给你的阁<br />一把钥匙
        </h1>
        <p className="mt-4 text-body text-ink-body leading-relaxed">
          钥匙存在这台设备上，你随时可以更换或删除。
          <br />
          ParallelMe 的服务器永远不保存它。
        </p>

        {existing && (
          <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-md bg-paper-lift border border-paper-edge text-body-sm text-ink-mute">
            <span>当前已配置：{existing.label}</span>
            <button
              onClick={deleteExisting}
              className="text-seal-action hover:underline"
            >
              删除
            </button>
          </div>
        )}
      </header>

      <StepDots step={step} skipMock={selected === "mock"} />

      <section className="mt-10 mb-12 min-h-[280px]">
        {step === 1 && (
          <StepSelectProvider
            selected={selected}
            onSelect={selectProvider}
          />
        )}
        {step === 2 && selected && selected !== "mock" && (
          <StepFillCredentials
            providerType={selected}
            apiKey={apiKey}
            baseUrl={baseUrl}
            model={model}
            onApiKey={setApiKey}
            onBaseUrl={setBaseUrl}
            onModel={setModel}
          />
        )}
        {step === 3 && (
          <StepTest
            testing={testing}
            result={testResult}
            onTest={runTest}
          />
        )}
        {step === 4 && (
          <StepSaveMode value={saveMode} onChange={setSaveMode} />
        )}
        {step === 5 && (
          <StepFinish
            isMock={selected === "mock"}
            onFinish={selected === "mock" ? finishMock : finishReal}
          />
        )}
      </section>

      <BottomBar
        step={step}
        canNext={canNext}
        nextLabel={
          step === 4 ? "保存并完成" : step === 5 ? "" : "继续"
        }
        onBack={back}
        onNext={next}
      />
    </main>
  );
}

// ───────────────────────────────────────────────────────────
// Step indicator
// ───────────────────────────────────────────────────────────
function StepDots({ step, skipMock }: { step: Step; skipMock: boolean }) {
  // For mock path we collapse to 2 logical phases: Select → Done.
  const total = skipMock ? 2 : 5;
  const current = skipMock ? (step === 1 ? 1 : 2) : step;
  return (
    <div className="flex items-center gap-2 text-xs text-ink-mute">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i + 1 <= current;
        return (
          <span key={i} className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                filled ? "bg-ink-core" : "bg-paper-edge"
              }`}
            />
            {i < total - 1 && (
              <span
                className={`w-6 h-px ${
                  filled ? "bg-ink-core" : "bg-paper-edge"
                }`}
              />
            )}
          </span>
        );
      })}
      <span className="ml-3 tracking-wider uppercase">
        {labelOfStep(step, skipMock)}
      </span>
    </div>
  );
}

function labelOfStep(step: Step, skipMock: boolean) {
  if (skipMock) {
    return step === 1 ? "选择服务商" : "完成";
  }
  return (
    {
      1: "选择服务商",
      2: "填连接信息",
      3: "测试连接",
      4: "保存方式",
      5: "完成",
    } as const
  )[step];
}

// ───────────────────────────────────────────────────────────
// Step 1 · Select
// ───────────────────────────────────────────────────────────
function StepSelectProvider({
  selected,
  onSelect,
}: {
  selected: ProviderType | null;
  onSelect: (p: ProviderType) => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-title text-ink-core mb-2">
        选一个服务商
      </h2>
      <p className="text-body-sm text-ink-mute mb-6">
        ParallelMe 兼容任何 OpenAI-compatible endpoint。
      </p>
      <div className="space-y-3">
        {PROVIDERS_ORDER.map((p) => {
          const preset = PRESETS[p];
          const active = selected === p;
          return (
            <button
              key={p}
              onClick={() => onSelect(p)}
              className={`w-full text-left p-4 rounded-md border transition-all ${
                active
                  ? "bg-paper-lift border-ink-core ring-1 ring-ink-core"
                  : "bg-paper-base border-paper-edge hover:border-ink-mute"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-medium text-ink-core">{preset.label}</div>
                {p === "deepseek" && (
                  <span className="text-[10px] tracking-wider uppercase text-attention-copper">
                    推荐
                  </span>
                )}
                {p === "mock" && (
                  <span className="text-[10px] tracking-wider uppercase text-ink-mute">
                    无需 key
                  </span>
                )}
              </div>
              {preset.hint && (
                <p className="mt-1 text-body-sm text-ink-mute">{preset.hint}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Step 2 · Credentials
// ───────────────────────────────────────────────────────────
function StepFillCredentials({
  providerType,
  apiKey,
  baseUrl,
  model,
  onApiKey,
  onBaseUrl,
  onModel,
}: {
  providerType: ProviderType;
  apiKey: string;
  baseUrl: string;
  model: string;
  onApiKey: (v: string) => void;
  onBaseUrl: (v: string) => void;
  onModel: (v: string) => void;
}) {
  const preset = PRESETS[providerType];
  const baseUrlEditable = providerType === "openai-compatible";
  return (
    <div>
      <h2 className="font-serif text-title text-ink-core mb-2">
        填连接信息
      </h2>
      <p className="text-body-sm text-ink-mute mb-6">{preset.hint}</p>

      <div className="space-y-5">
        <Field label="API Key">
          <input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => onApiKey(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md bg-paper-lift border border-paper-edge focus:border-ink-core focus:outline-none text-body font-mono"
            spellCheck={false}
            autoComplete="off"
          />
          <p className="mt-1.5 text-body-sm text-ink-mute">
            只存在这台设备上。
          </p>
        </Field>

        <Field label="Base URL">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => onBaseUrl(e.target.value)}
            disabled={!baseUrlEditable}
            className={`w-full px-3 py-2.5 rounded-md bg-paper-lift border border-paper-edge focus:border-ink-core focus:outline-none text-body font-mono ${
              !baseUrlEditable ? "text-ink-mute" : ""
            }`}
            spellCheck={false}
            autoComplete="off"
          />
        </Field>

        <Field label="Model">
          <input
            type="text"
            value={model}
            onChange={(e) => onModel(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md bg-paper-lift border border-paper-edge focus:border-ink-core focus:outline-none text-body font-mono"
            spellCheck={false}
            autoComplete="off"
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-body-sm tracking-wider uppercase text-ink-mute">
        {label}
      </span>
      {children}
    </label>
  );
}

// ───────────────────────────────────────────────────────────
// Step 3 · Test
// ───────────────────────────────────────────────────────────
function StepTest({
  testing,
  result,
  onTest,
}: {
  testing: boolean;
  result: TestResult | null;
  onTest: () => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-title text-ink-core mb-2">
        测一下能开会吗
      </h2>
      <p className="text-body-sm text-ink-mute mb-6">
        ParallelMe 会发一个 5-token 的小请求，确认钥匙能用。
      </p>

      <button
        onClick={onTest}
        disabled={testing}
        className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {testing ? "正在测试…" : result ? "再测一次" : "测试连接"}
      </button>

      {result && (
        <div
          className={`mt-6 p-4 rounded-md border ${
            result.ok
              ? "bg-paper-lift border-safe-green/30"
              : "bg-paper-lift border-seal-action/40"
          }`}
        >
          <div className="flex items-baseline gap-2 mb-2">
            <span
              className={`w-2 h-2 rounded-full ${
                result.ok ? "bg-safe-green" : "bg-seal-action"
              }`}
            />
            <span className="font-medium text-ink-core">
              {result.ok ? "连上了" : "没连上"}
            </span>
            {typeof result.latencyMs === "number" && (
              <span className="ml-auto text-body-sm text-ink-mute font-mono">
                {result.latencyMs} ms
              </span>
            )}
          </div>
          {result.ok ? (
            <div className="text-body-sm text-ink-body space-y-1">
              <div>
                <span className="text-ink-mute">model：</span>
                <span className="font-mono">{result.model}</span>
              </div>
              {result.sampleReply && (
                <div>
                  <span className="text-ink-mute">回复：</span>
                  <span className="italic">「{result.sampleReply}」</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-body-sm text-ink-body whitespace-pre-wrap break-words font-mono">
              {result.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Step 4 · Save mode
// ───────────────────────────────────────────────────────────
function StepSaveMode({
  value,
  onChange,
}: {
  value: SaveMode;
  onChange: (v: SaveMode) => void;
}) {
  const options: { id: SaveMode; label: string; hint: string }[] = [
    {
      id: "browser",
      label: "仅这个浏览器",
      hint: "推荐。关闭浏览器后仍保留，删除随时可做。",
    },
    {
      id: "session",
      label: "仅本次会话",
      hint: "关闭标签页就消失。最隐私，但每次都要重填。",
    },
    {
      id: "env",
      label: "我用的是自部署 + 环境变量",
      hint: "不在浏览器存 key，靠 .env.local。适合开发者。",
    },
  ];
  return (
    <div>
      <h2 className="font-serif text-title text-ink-core mb-2">
        钥匙怎么放
      </h2>
      <p className="text-body-sm text-ink-mute mb-6">
        ParallelMe 服务器永远不存。
      </p>
      <div className="space-y-3">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              className={`w-full text-left p-4 rounded-md border transition-all ${
                active
                  ? "bg-paper-lift border-ink-core ring-1 ring-ink-core"
                  : "bg-paper-base border-paper-edge hover:border-ink-mute"
              }`}
            >
              <div className="font-medium text-ink-core">{o.label}</div>
              <p className="mt-1 text-body-sm text-ink-mute">{o.hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Step 5 · Finish
// ───────────────────────────────────────────────────────────
function StepFinish({
  isMock,
  onFinish,
}: {
  isMock: boolean;
  onFinish: () => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-title text-ink-core mb-3">
        {isMock ? "演员模式准备好了" : "钥匙已收好"}
      </h2>
      <p className="text-body text-ink-body mb-2 leading-relaxed">
        {isMock
          ? "可以打开你的阁。这些声音是预设剧本——它们足够带你跑完一遍流程，配 key 后会换成真实的模型。"
          : "可以打开你的阁了。"}
      </p>
      {!isMock && (
        <p className="text-body-sm text-ink-mute leading-relaxed">
          想换 / 删除钥匙：随时回到这里。
        </p>
      )}
      <button
        onClick={onFinish}
        className="mt-8 px-6 py-3 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body transition-colors"
      >
        进入我的阁 →
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Bottom navigation bar
// ───────────────────────────────────────────────────────────
function BottomBar({
  step,
  canNext,
  nextLabel,
  onBack,
  onNext,
}: {
  step: Step;
  canNext: boolean;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
}) {
  if (step === 5) {
    return (
      <div className="text-xs text-ink-faint">
        ParallelMe 服务器无状态 · 你的钥匙不离开这台设备
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t border-paper-edge">
      <button
        onClick={onBack}
        disabled={step === 1}
        className="text-body-sm text-ink-mute hover:text-ink-core disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← 上一步
      </button>
      <button
        onClick={onNext}
        disabled={!canNext}
        className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {nextLabel || "继续"} →
      </button>
    </div>
  );
}
