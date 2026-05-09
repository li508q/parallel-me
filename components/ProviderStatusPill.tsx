"use client";

// Provider Status Pill — small badge that shows current provider state and
// links to /setup. Used in the main workbench header and could be reused on
// any page later.

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchServerProviderStatus,
  loadActiveProvider,
  providerStatus,
  toRuntimePayload,
  type ProviderConfig,
  type ServerProviderStatus,
  type ProviderStatusInfo,
} from "@/lib/provider";

const DOT_COLOR: Record<ProviderStatusInfo["variant"], string> = {
  ok:       "bg-safe-green",
  untested: "bg-ink-faint",
  warn:     "bg-seal-action",
  missing:  "bg-ink-faint",
};

const HOVER_RING_COLOR: Record<ProviderStatusInfo["variant"], string> = {
  ok:       "hover:ring-safe-green/30",
  untested: "hover:ring-ink-faint/30",
  warn:     "hover:ring-seal-action/30",
  missing:  "hover:ring-ink-faint/30",
};

export function ProviderStatusPill() {
  const [p, setP] = useState<ProviderConfig | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerProviderStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const active = loadActiveProvider();
      if (cancelled) return;
      setP(active);
      if (toRuntimePayload(active)) {
        setServerStatus(null);
        return;
      }
      const status = await fetchServerProviderStatus();
      if (!cancelled) setServerStatus(status);
    };
    void refresh();
    const onStorage = () => void refresh();
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const localStatus = providerStatus(p);
  const status: ProviderStatusInfo =
    !toRuntimePayload(p) && serverStatus?.configured
      ? {
          variant: "ok",
          label: serverStatus.label || "服务器 API",
          detail: serverStatus.model,
        }
      : localStatus;

  return (
    <Link
      href="/setup"
      title={status.detail}
      className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper-lift border border-paper-edge text-xs text-ink-body hover:border-ink-mute transition-colors ring-2 ring-transparent ${HOVER_RING_COLOR[status.variant]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[status.variant]} ${
          status.variant === "ok" ? "animate-soft-pulse" : ""
        }`}
      />
      <span className="font-medium">{status.label}</span>
      {status.detail && (
        <span className="text-ink-mute hidden sm:inline">· {status.detail}</span>
      )}
      <span className="text-ink-faint group-hover:text-ink-body transition-colors">
        →
      </span>
    </Link>
  );
}
