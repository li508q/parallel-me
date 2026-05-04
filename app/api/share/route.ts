// /api/share — 生成「内心地图」分享卡片 (SVG)
// 输入：5 个分身的答案文本 → 输出：雷达图 + 大标题 + 关键句的 SVG，可右键存图

import { NextRequest } from "next/server";

export const runtime = "nodejs";

function score(t: string): number {
  let s = (t || "").length;
  s += ((t || "").match(/[!！？?]/g) || []).length * 8;
  s += ((t || "").match(/(必须|绝对|永远|一定|根本|真的|只是)/g) || []).length * 6;
  return s;
}

const SELF_META = {
  lay:    { name: "躺平", color: "#5B7A99", emoji: "🛋" },
  money:  { name: "搞钱", color: "#B5862F", emoji: "💰" },
  roam:   { name: "出走", color: "#2F8266", emoji: "✈" },
  filial: { name: "陪妈", color: "#B4593C", emoji: "🥟" },
  future: { name: "未来", color: "#6B4F8C", emoji: "🔮" }
} as const;

export async function POST(req: NextRequest) {
  const { input, selves, loudestId } = await req.json().catch(() => ({}));
  if (!Array.isArray(selves) || selves.length !== 5) {
    return new Response(JSON.stringify({ error: "selves must be array of 5" }), { status: 400 });
  }

  // normalize
  const raw = selves.map((s: any) => ({ id: s.id, score: score(s.text || "") }));
  const max = Math.max(...raw.map(r => r.score), 1);
  const norm = raw.map(r => ({ id: r.id, v: 0.35 + 0.6 * (r.score / max) }));

  // pentagon points
  const cx = 400, cy = 380, R = 180;
  const angles = [-Math.PI/2, -Math.PI/2 + 2*Math.PI/5, -Math.PI/2 + 4*Math.PI/5, -Math.PI/2 + 6*Math.PI/5, -Math.PI/2 + 8*Math.PI/5];
  const order = ["lay","money","roam","filial","future"] as const;
  const pts = order.map((id, i) => {
    const v = norm.find(n => n.id === id)?.v || 0.4;
    return { x: cx + Math.cos(angles[i]) * R * v, y: cy + Math.sin(angles[i]) * R * v, id, v };
  });
  const polygon = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // grid pentagons
  const gridLevels = [0.25, 0.5, 0.75, 1].map(g => order.map((_id, i) => {
    const x = cx + Math.cos(angles[i]) * R * g;
    const y = cy + Math.sin(angles[i]) * R * g;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" "));

  // labels
  const labelPos = order.map((id, i) => {
    const x = cx + Math.cos(angles[i]) * (R + 36);
    const y = cy + Math.sin(angles[i]) * (R + 36);
    return { x, y, id, ...SELF_META[id] };
  });

  const loudest = (loudestId && SELF_META[loudestId as keyof typeof SELF_META]) || SELF_META.lay;
  const inputText = (input || "").slice(0, 60);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 0.05  0 0 0 0 0.04  0 0 0 0 0.02  0 0 0 0.04 0"/>
    </filter>
  </defs>
  <rect width="800" height="1000" fill="#FBF8F3"/>
  <rect width="800" height="1000" fill="url(#grain)" opacity="0.5"/>

  <!-- Header -->
  <text x="60" y="80" font-family="Songti SC, Source Han Serif SC, serif" font-size="22" fill="#7A7E88" font-weight="500">🪞 平行的我 · ParallelMe</text>
  <text x="60" y="140" font-family="Songti SC, Source Han Serif SC, serif" font-size="44" fill="#0E0F12" font-weight="700">今天最响的那个我，是</text>
  <text x="60" y="200" font-family="Songti SC, Source Han Serif SC, serif" font-size="68" fill="${loudest.color}" font-weight="700">${loudest.emoji} ${loudest.name}的我</text>

  <!-- Question -->
  <text x="60" y="250" font-family="PingFang SC, sans-serif" font-size="16" fill="#3A3D45" font-style="italic">「${inputText}${input?.length > 60 ? '…' : ''}」</text>

  <!-- Pentagon grid -->
  ${gridLevels.map(g => `<polygon points="${g}" fill="none" stroke="#E6E0D4" stroke-width="1"/>`).join("")}
  ${order.map((_,i) => `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(angles[i])*R).toFixed(1)}" y2="${(cy + Math.sin(angles[i])*R).toFixed(1)}" stroke="#E6E0D4" stroke-width="1"/>`).join("")}

  <!-- User's pentagon -->
  <polygon points="${polygon}" fill="${loudest.color}" fill-opacity="0.18" stroke="${loudest.color}" stroke-width="2.5" stroke-linejoin="round"/>
  ${pts.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="${SELF_META[p.id].color}"/>`).join("")}

  <!-- Labels -->
  ${labelPos.map(l => `<g><text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" font-family="Songti SC, serif" font-size="22" fill="${l.color}" font-weight="600" text-anchor="middle" dominant-baseline="middle">${l.emoji} ${l.name}</text></g>`).join("")}

  <!-- Footer -->
  <line x1="60" y1="900" x2="740" y2="900" stroke="#E6E0D4" stroke-width="1"/>
  <text x="60" y="940" font-family="Songti SC, serif" font-size="18" fill="#0E0F12" font-weight="600">让 5 个平行宇宙的你吵一架</text>
  <text x="60" y="965" font-family="PingFang SC, sans-serif" font-size="14" fill="#7A7E88">parallelme.app</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache"
    }
  });
}
