import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF8F3",       // 主背景：米白纸感
        ink: "#0E0F12",         // 主文字：墨黑
        ink2: "#3A3D45",        // 次文字
        ink3: "#7A7E88",        // 弱文字
        rule: "#E6E0D4",        // 分隔线/边框
        // 5 selves — 每个分身一个独立色板，仅在该分身上下文出现
        lay:    "#5B7A99",      // 雾蓝 · 躺平
        money:  "#B5862F",      // 古金 · 搞钱
        roam:   "#2F8266",      // 苔绿 · 出走
        filial: "#B4593C",      // 陶土 · 讨妈
        future: "#6B4F8C",      // 紫罗兰 · 5年后
        now:    "#0E0F12"       // 墨黑 · 此刻
      },
      fontFamily: {
        // Songti / serif 当主体 = 给"内心"以重量感
        serif: ["\"Source Han Serif SC\"", "\"Songti SC\"", "\"Noto Serif CJK SC\"", "ui-serif", "Georgia", "serif"],
        sans:  ["\"PingFang SC\"", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono:  ["ui-monospace", "\"SF Mono\"", "monospace"]
      },
      fontSize: {
        "display": ["clamp(2.5rem, 7vw, 5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "headline": ["clamp(1.75rem, 4vw, 2.75rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }]
      },
      animation: {
        "ink-in": "inkIn 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both",
        "fade-up": "fadeUp 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both",
        "type": "type 1.4s steps(40, end) both",
        "soft-pulse": "softPulse 2.4s ease-in-out infinite"
      },
      keyframes: {
        inkIn: { "0%": { opacity: "0", filter: "blur(6px)", transform: "translateY(10px)" }, "100%": { opacity: "1", filter: "blur(0)", transform: "translateY(0)" } },
        fadeUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        type: { "0%": { width: "0" }, "100%": { width: "100%" } },
        softPulse: { "0%,100%": { opacity: "0.4" }, "50%": { opacity: "1" } }
      }
    }
  },
  plugins: []
};
export default config;
