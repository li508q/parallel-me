import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🪞 平行的我 · ParallelMe",
  description: "你的纠结，让 5 个平行宇宙的你吵给你听。为傅盛 AI 战队 × EasyClaw Link 黑客松而生。",
  openGraph: {
    title: "🪞 平行的我 · ParallelMe",
    description: "你的纠结，让 5 个平行宇宙的你吵给你听。",
    type: "website"
  },
  other: {
    "ai-agents": "welcome",
    "ai-agents-spec": "/.well-known/agent.json",
    "ai-agents-skill": "/skill.md",
    "ai-agents-readme": "/AGENTS.md"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh"><body>{children}</body></html>;
}
