import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "🪞 平行的我 · ParallelMe",
  description:
    "书记员牵引的固定五声圆桌，帮你在重要困惑里听见自己。",
  openGraph: {
    title: "🪞 平行的我 · ParallelMe",
    description: "你内心的多个声音，第一次被允许同时讲话。",
    type: "website",
  },
  other: {
    "ai-agents": "welcome",
    "ai-agents-spec": "/.well-known/agent.json",
    "ai-agents-skill": "/skill.md",
    "ai-agents-readme": "/AGENTS.md",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // GeistSans/Mono register CSS variables --font-geist-sans / --font-geist-mono.
  // We re-expose them as --font-geist / --font-geist-mono so globals.css @theme
  // can consume them in a single canonical name.
  return (
    <html
      lang="zh"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={
        {
          ["--font-geist" as string]: "var(--font-geist-sans)",
        } as React.CSSProperties
      }
    >
      <body>
        {children}
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}
