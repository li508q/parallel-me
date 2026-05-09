"use client";

// Provider Setup · real API only.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  PRESETS,
  clearProvider,
  loadActiveProvider,
  maskKey,
  newProviderId,
  saveActiveProvider,
  saveProviderSecret,
  type ProviderConfig,
  type ProviderPreset,
  type ProviderType,
} from "@/lib/provider";

type Step = 1 | 2 | 3 | 4;
type SaveMode = "browser" | "session";

interface TestResult {
  ok: boolean;
  model?: string;
  latencyMs?: number;
  sampleReply?: string;
  error?: string;
}

const PROVIDERS: ProviderType[] = [
  "deepseek",
  "bailian",
  "kimi",
  "minimax",
  "doubao",
  "custom",
];

export default function SetupPage() {
  const router = useRouter();
  const existing = typeof window !== "undefined" ? loadActiveProvider() : null;

  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<ProviderType>("deepseek");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(PRESETS.deepseek.baseUrl);
  const [model, setModel] = useState(PRESETS.deepseek.model);
  const [saveMode, setSaveMode] = useState<SaveMode>("browser");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const preset = PRESETS[selected];
  const canContinue =
    step === 1 ||
    (step === 2 && !!apiKey.trim() && !!baseUrl.trim() && !!model.trim()) ||
    (step === 3 && !!testResult?.ok);

  function selectProvider(provider: ProviderType) {
    setSelected(provider);
    setBaseUrl(PRESETS[provider].baseUrl);
    setModel(PRESETS[provider].model);
    setApiKey("");
    setTestResult(null);
  }

  async function runTest() {
    if (!apiKey.trim() || !baseUrl.trim() || !model.trim()) {
      setTestResult({ ok: false, error: "API Key、Base URL、Model 三项都需要填写。" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const r = await fetch("/api/provider/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: baseUrl.trim(),
          model: model.trim(),
          apiKey: apiKey.trim(),
        }),
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
    if (!testResult?.ok) {
      setStep(3);
      return;
    }
    const id = newProviderId();
    const config: ProviderConfig = {
      id,
      provider: selected,
      label: preset.label,
      baseUrl: baseUrl.trim().replace(/\/+$/, ""),
      model: model.trim(),
      apiKeyRef: saveMode,
      maskedKey: maskKey(apiKey.trim()),
      createdAt: Date.now(),
      lastTestedAt: Date.now(),
      lastStatus: "ok",
      lastTestLatencyMs: testResult.latencyMs,
    };
    saveActiveProvider(config);
    saveProviderSecret(id, apiKey.trim(), saveMode);
    router.push("/");
  }

  function deleteExisting() {
    if (!confirm("将删除当前 API Key 与连接配置。确认？")) return;
    clearProvider();
    location.reload();
  }

  return (
    <main className="min-h-screen px-5 sm:px-10 py-10 sm:py-14 max-w-5xl mx-auto font-sans text-ink-body">
      <header className="mb-10">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-10">
          <Link
            href="/"
            className="text-xs tracking-[0.18em] text-ink-mute uppercase hover:text-ink-core transition-colors"
          >
            ← 我的声音
          </Link>
          <span className="text-xs tracking-[0.18em] text-ink-mute uppercase">
            ParallelMe · API Setup
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-end">
          <section>
            <p className="text-xs tracking-[0.18em] text-ink-mute uppercase mb-3">
              五声圆桌需要一把真实钥匙
            </p>
            <h1 className="font-serif text-headline sm:text-display text-ink-core leading-[1.05]">
              先把 API 接上，<br />
              再让五声开口。
            </h1>
            <p className="mt-5 text-body text-ink-body max-w-2xl leading-relaxed">
              ParallelMe 现在只接入真实模型。你的 API Key 只保存在这台设备或本次会话中，
              服务器只转发请求，不保存钥匙，也不保存会谈内容。
            </p>
          </section>

          <aside className="rounded-md border border-paper-edge bg-paper-lift p-4">
            <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
              当前配置
            </div>
            {existing ? (
              <div>
                <div className="font-medium text-ink-core">{existing.label}</div>
                <div className="mt-1 text-body-sm text-ink-mute font-mono break-all">
                  {existing.model}
                </div>
                <button
                  onClick={deleteExisting}
                  className="mt-4 text-body-sm text-seal-action hover:underline"
                >
                  删除并重新配置
                </button>
              </div>
            ) : (
              <p className="text-body-sm text-ink-mute leading-relaxed">
                还没有 API Key。完成下面四步后即可开始五声圆桌。
              </p>
            )}
          </aside>
        </div>
      </header>

      <StepRail step={step} />

      <section className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
        <div className="rounded-md border border-paper-edge bg-paper-lift p-5 sm:p-6 min-h-[460px]">
          {step === 1 && (
            <ProviderStep selected={selected} onSelect={selectProvider} />
          )}
          {step === 2 && (
            <CredentialStep
              preset={preset}
              apiKey={apiKey}
              baseUrl={baseUrl}
              model={model}
              onApiKey={setApiKey}
              onBaseUrl={(v) => {
                setBaseUrl(v);
                setTestResult(null);
              }}
              onModel={(v) => {
                setModel(v);
                setTestResult(null);
              }}
            />
          )}
          {step === 3 && (
            <TestStep
              providerLabel={preset.label}
              testing={testing}
              result={testResult}
              onTest={runTest}
            />
          )}
          {step === 4 && (
            <SaveStep value={saveMode} onChange={setSaveMode} configLabel={preset.label} />
          )}
        </div>

        <ConnectionCard
          label={preset.label}
          docsUrl={preset.docsUrl}
          baseUrl={baseUrl}
          model={model}
          keyReady={!!apiKey.trim()}
          testResult={testResult}
        />
      </section>

      <nav className="mt-8 flex items-center justify-between gap-4 border-t border-paper-edge pt-6">
        <button
          onClick={() => setStep((Math.max(1, step - 1) as Step))}
          disabled={step === 1}
          className="text-body-sm text-ink-mute hover:text-ink-core disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← 上一步
        </button>
        {step < 4 ? (
          <button
            onClick={() => setStep((Math.min(4, step + 1) as Step))}
            disabled={!canContinue}
            className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {step === 3 ? "选择保存方式" : "继续"} →
          </button>
        ) : (
          <button
            onClick={saveAndFinish}
            className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body transition-colors"
          >
            保存钥匙，进入我的声音 →
          </button>
        )}
      </nav>
    </main>
  );
}

function StepRail({ step }: { step: Step }) {
  const items = ["选服务商", "填钥匙", "测试连接", "保存"];
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {items.map((label, i) => {
        const active = step === i + 1;
        const done = step > i + 1;
        return (
          <div key={label} className="flex items-center gap-2 shrink-0">
            <span
              className={[
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-colors",
                active
                  ? "bg-ink-core text-paper-base border-ink-core"
                  : done
                    ? "bg-paper-lift text-ink-core border-ink-core/30"
                    : "bg-paper-base text-ink-mute border-paper-edge",
              ].join(" ")}
            >
              <span className="font-mono">{i + 1}</span>
              {label}
            </span>
            {i < items.length - 1 && <span className="w-8 h-px bg-paper-edge" />}
          </div>
        );
      })}
    </div>
  );
}

function ProviderStep({
  selected,
  onSelect,
}: {
  selected: ProviderType;
  onSelect: (provider: ProviderType) => void;
}) {
  return (
    <section>
      <Kicker>Step 1</Kicker>
      <h2 className="font-serif text-title text-ink-core mb-2">选择 API 服务商</h2>
      <p className="text-body-sm text-ink-mute mb-6">
        默认推荐 DeepSeek。所有预设都走兼容 `/chat/completions` 的接口形态，后续可手动改 Base URL 和 Model。
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {PROVIDERS.map((id) => {
          const p = PRESETS[id];
          const active = selected === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={[
                "group text-left rounded-md border p-4 transition-all min-h-[132px]",
                active
                  ? "bg-paper-base border-ink-core ring-1 ring-ink-core"
                  : "bg-paper-lift border-paper-edge hover:border-ink-mute",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-medium text-ink-core">{p.label}</div>
                  <div className="text-[10px] tracking-[0.18em] text-ink-faint uppercase mt-1">
                    {p.shortName}
                  </div>
                </div>
                {id === "deepseek" && (
                  <span className="text-[10px] tracking-[0.18em] text-attention-copper uppercase">
                    推荐
                  </span>
                )}
              </div>
              <p className="text-body-sm text-ink-mute leading-relaxed">{p.hint}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CredentialStep({
  preset,
  apiKey,
  baseUrl,
  model,
  onApiKey,
  onBaseUrl,
  onModel,
}: {
  preset: ProviderPreset;
  apiKey: string;
  baseUrl: string;
  model: string;
  onApiKey: (v: string) => void;
  onBaseUrl: (v: string) => void;
  onModel: (v: string) => void;
}) {
  const modelHints = useMemo(
    () => [
      "DeepSeek: deepseek-chat（可改 deepseek-v4-flash）",
      "百炼: qwen-plus",
      "Kimi: kimi-k2.6",
      "MiniMax: MiniMax-M2.7",
      "豆包: doubao-seed-1-6-251015 或 ep-...",
    ],
    [],
  );

  return (
    <section>
      <Kicker>Step 2</Kicker>
      <h2 className="font-serif text-title text-ink-core mb-2">填写连接信息</h2>
      <p className="text-body-sm text-ink-mute mb-6">{preset.keyHint}</p>

      <div className="space-y-5">
        <Field label="API Key">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2.5 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body font-mono"
            spellCheck={false}
            autoComplete="off"
          />
          <p className="mt-1.5 text-body-sm text-ink-mute">
            只保存在你选择的位置。服务器不会写入数据库。
          </p>
        </Field>

        <Field label="Base URL">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => onBaseUrl(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body font-mono"
            spellCheck={false}
            autoComplete="off"
          />
        </Field>

        <Field label="Model">
          <input
            type="text"
            value={model}
            onChange={(e) => onModel(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md bg-paper-base border border-paper-edge focus:border-ink-core focus:outline-none text-body font-mono"
            spellCheck={false}
            autoComplete="off"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {modelHints.map((hint) => (
              <span
                key={hint}
                className="text-[11px] px-2 py-1 rounded-sm bg-paper-sunk text-ink-mute"
              >
                {hint}
              </span>
            ))}
          </div>
        </Field>
      </div>
    </section>
  );
}

function TestStep({
  providerLabel,
  testing,
  result,
  onTest,
}: {
  providerLabel: string;
  testing: boolean;
  result: TestResult | null;
  onTest: () => void;
}) {
  return (
    <section>
      <Kicker>Step 3</Kicker>
      <h2 className="font-serif text-title text-ink-core mb-2">测试连接</h2>
      <p className="text-body-sm text-ink-mute mb-6">
        会向 {providerLabel} 发出一个极小的请求。只有测试通过，才保存为可用配置。
      </p>

      <button
        onClick={onTest}
        disabled={testing}
        className="px-5 py-2.5 rounded-md bg-ink-core text-paper-base text-body-sm font-medium hover:bg-ink-body disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {testing ? "正在测试…" : result ? "重新测试" : "测试 API 连接"}
      </button>

      {result && (
        <div
          className={[
            "mt-6 rounded-md border p-4",
            result.ok ? "border-safe-green/40 bg-safe-green/5" : "border-seal-action/40 bg-seal-action/5",
          ].join(" ")}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${result.ok ? "bg-safe-green" : "bg-seal-action"}`} />
            <span className="font-medium text-ink-core">
              {result.ok ? "连接成功" : "连接失败"}
            </span>
            {typeof result.latencyMs === "number" && (
              <span className="ml-auto text-body-sm text-ink-mute font-mono">
                {result.latencyMs} ms
              </span>
            )}
          </div>
          {result.ok ? (
            <div className="text-body-sm text-ink-body leading-relaxed">
              <div>
                <span className="text-ink-mute">model：</span>
                <span className="font-mono">{result.model}</span>
              </div>
              {result.sampleReply && (
                <div>
                  <span className="text-ink-mute">reply：</span>
                  <span className="italic">「{result.sampleReply}」</span>
                </div>
              )}
            </div>
          ) : (
            <pre className="text-body-sm text-ink-body whitespace-pre-wrap wrap-break-word font-mono">
              {result.error}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}

function SaveStep({
  value,
  onChange,
  configLabel,
}: {
  value: SaveMode;
  onChange: (v: SaveMode) => void;
  configLabel: string;
}) {
  const options: { id: SaveMode; label: string; hint: string }[] = [
    {
      id: "browser",
      label: "保存在这个浏览器",
      hint: "推荐。关闭浏览器后仍可使用，随时可删除。",
    },
    {
      id: "session",
      label: "只保存在本次会话",
      hint: "关闭标签页就消失。更克制，但下次需要重填。",
    },
  ];
  return (
    <section>
      <Kicker>Step 4</Kicker>
      <h2 className="font-serif text-title text-ink-core mb-2">选择钥匙放在哪里</h2>
      <p className="text-body-sm text-ink-mute mb-6">
        已确认 {configLabel} 可用。接下来只决定本机保存方式。
      </p>
      <div className="space-y-3">
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={[
                "w-full text-left rounded-md border p-4 transition-all",
                active
                  ? "bg-paper-base border-ink-core ring-1 ring-ink-core"
                  : "bg-paper-lift border-paper-edge hover:border-ink-mute",
              ].join(" ")}
            >
              <div className="font-medium text-ink-core">{option.label}</div>
              <p className="mt-1 text-body-sm text-ink-mute">{option.hint}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ConnectionCard({
  label,
  docsUrl,
  baseUrl,
  model,
  keyReady,
  testResult,
}: {
  label: string;
  docsUrl?: string;
  baseUrl: string;
  model: string;
  keyReady: boolean;
  testResult: TestResult | null;
}) {
  return (
    <aside className="rounded-md border border-paper-edge bg-paper-base p-4 sticky top-6">
      <Kicker>Connection</Kicker>
      <h3 className="font-medium text-ink-core mb-4">{label}</h3>
      <Meta label="Base URL">{baseUrl || "待填写"}</Meta>
      <Meta label="Model">{model || "待填写"}</Meta>
      <Meta label="API Key">{keyReady ? "已填写" : "未填写"}</Meta>
      <Meta label="Test">
        {testResult?.ok ? "已通过" : testResult ? "未通过" : "尚未测试"}
      </Meta>
      {docsUrl && (
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-block text-body-sm text-ink-mute hover:text-ink-core underline-offset-4 hover:underline"
        >
          打开官方文档 →
        </a>
      )}
    </aside>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] tracking-[0.18em] text-ink-mute uppercase mb-2">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[10px] tracking-[0.18em] text-ink-mute uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-paper-edge py-3">
      <div className="text-[10px] tracking-[0.18em] text-ink-faint uppercase mb-1">
        {label}
      </div>
      <div className="text-body-sm text-ink-body font-mono break-all">{children}</div>
    </div>
  );
}
