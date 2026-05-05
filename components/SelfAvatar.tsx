"use client";
import type { SelfId } from "@/lib/selves";

// 每个声音有独特的表情：眉毛、眼睛、嘴的姿态都不一样
export function SelfAvatar({ id, size = 48 }: { id: SelfId | "now"; size?: number }) {
  const s = size;
  const stroke = ({
    lay: "#5B7A99", money: "#B5862F", roam: "#2F8266",
    filial: "#B4593C", future: "#6B4F8C", now: "#0E0F12"
  } as Record<string,string>)[id];
  const fill = ({
    lay: "rgba(91,122,153,0.12)", money: "rgba(181,134,47,0.13)", roam: "rgba(47,130,102,0.12)",
    filial: "rgba(180,89,60,0.13)", future: "rgba(107,79,140,0.12)", now: "rgba(14,15,18,0.07)"
  } as Record<string,string>)[id];

  const common = { width: s, height: s, viewBox: "0 0 48 48", fill: "none" as const, stroke, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (id === "lay") {
    return (
      <svg {...common}>
        <circle cx="24" cy="24" r="22" fill={fill} stroke={stroke}/>
        {/* 闭眼，半圆下弧；嘴歪 */}
        <path d="M19.5 21 Q21 22.5 22.5 21"/>
        <path d="M25.5 21 Q27 22.5 28.5 21"/>
        <path d="M21 27 Q24 27.5 26.5 26.5"/>
        {/* 微微歪头 */}
        <path d="M14 17 Q17 14 20 13" opacity="0.5"/>
      </svg>
    );
  }
  if (id === "money") {
    return (
      <svg {...common}>
        <circle cx="24" cy="24" r="22" fill={fill} stroke={stroke}/>
        {/* 锐利眉、戴眼镜 */}
        <path d="M18 18 L22 19" strokeWidth="2"/>
        <path d="M30 18 L26 19" strokeWidth="2"/>
        <circle cx="20" cy="22" r="2.4"/>
        <circle cx="28" cy="22" r="2.4"/>
        <line x1="22.4" y1="22" x2="25.6" y2="22"/>
        {/* 一字直嘴 */}
        <line x1="21" y1="29" x2="27" y2="29"/>
      </svg>
    );
  }
  if (id === "roam") {
    return (
      <svg {...common}>
        <circle cx="24" cy="24" r="22" fill={fill} stroke={stroke}/>
        {/* 风线在右后；眉毛上扬 */}
        <path d="M30 12 Q36 11 40 13" opacity="0.7"/>
        <path d="M30 16 Q34 15 38 16" opacity="0.5"/>
        {/* 眉上扬 */}
        <path d="M19 18 L22 17" strokeWidth="1.8"/>
        <path d="M29 18 L26 17" strokeWidth="1.8"/>
        <circle cx="21" cy="22" r="0.9" fill={stroke}/>
        <circle cx="27" cy="22" r="0.9" fill={stroke}/>
        {/* 嘴角上扬 */}
        <path d="M20 28 Q24 31 28 28"/>
      </svg>
    );
  }
  if (id === "filial") {
    return (
      <svg {...common}>
        <circle cx="24" cy="24" r="22" fill={fill} stroke={stroke}/>
        {/* 微皱眉 */}
        <path d="M19 18 Q21 17 22 18" strokeWidth="1.8"/>
        <path d="M29 18 Q27 17 26 18" strokeWidth="1.8"/>
        <circle cx="21" cy="22" r="0.9" fill={stroke}/>
        <circle cx="27" cy="22" r="0.9" fill={stroke}/>
        {/* 嘴角微抿 */}
        <path d="M20 28 Q24 27 28 28"/>
        {/* 一滴水/泪在右脸下 */}
        <path d="M32 28 Q33 30 32 31 Q31 30 32 28" fill={stroke} opacity="0.5" stroke="none"/>
      </svg>
    );
  }
  if (id === "future") {
    return (
      <svg {...common} strokeDasharray="2.5 2">
        <circle cx="24" cy="24" r="22" fill={fill} stroke={stroke}/>
        {/* 月亮、虚线轮廓表"未存在" */}
        <circle cx="21" cy="22" r="0.9" fill={stroke} strokeDasharray="0"/>
        <circle cx="27" cy="22" r="0.9" fill={stroke} strokeDasharray="0"/>
        <path d="M20 28 Q24 30 28 28" strokeDasharray="0"/>
        <path d="M34 11 a3 3 0 1 0 3 3 a2 2 0 0 1 -3 -3" fill={stroke} stroke="none" strokeDasharray="0"/>
      </svg>
    );
  }
  // now — 镜面，更深、更稳
  return (
    <svg {...common} strokeWidth={1.9}>
      <circle cx="24" cy="24" r="22" fill={fill} stroke={stroke}/>
      <circle cx="24" cy="24" r="19" stroke={stroke} strokeWidth="0.5" strokeDasharray="1 3" fill="none"/>
      {/* 平直眉、目光对视 */}
      <line x1="19" y1="18" x2="22" y2="18.4" strokeWidth="1.8"/>
      <line x1="29" y1="18" x2="26" y2="18.4" strokeWidth="1.8"/>
      <circle cx="21" cy="22" r="1.2" fill={stroke}/>
      <circle cx="27" cy="22" r="1.2" fill={stroke}/>
      <path d="M21 28 Q24 29.5 27 28"/>
    </svg>
  );
}
