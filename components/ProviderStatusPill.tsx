"use client";

// V3 Provider Status Pill — small badge that shows current provider state and
// links to /setup. Used in the cabinet workbench header and could be reused on
// any V3 page later.

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  loadActiveProvider,
  providerStatus,
  type ProviderConfig,
  type ProviderStatusInfo,
} from "@/lib/provider";

const DOT_COLOR: Record<ProviderStatusInfo["variant"], string> = {
  ok:       "bg-safe-green",
  actor:    "bg-attention-copper",
  untested: "bg-ink-faint",
  warn:     "bg-seal-action",
  missing:  "bg-ink-faint",
};

const RING_COLOR: Record<ProviderStatusInfo["variant"], string> = {
  ok:       "ring-safe-green/30",
  actor:    "ring-attention-copper/30",
  untested: "ring-ink-faint/30",
  warn:     "ring-seal-action/30",
  missing:  "ring-ink-faint/30",
};

export function ProviderStatusPill() {
  const [p, setP] = useState<ProviderConfig | null>(null);
  useEffect(() => {
    setP(loadActiveProvider());
    const onStorage = () => setP(loadActiveProvider());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const status = providerStatus(p);

  return (
    <Link
      href="/setup"
      title={status.detail}
      className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper-lift border border-paper-edge text-xs text-ink-body hover:border-ink-mute transition-colors ring-2 ring-transparent hover:${RING_COLOR[status.variant]}`}
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
