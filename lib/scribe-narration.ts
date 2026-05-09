// lib/scribe-narration.ts — DC-02 书记员状态条叙事文案库
// 所有对外可见文案的唯一来源，组件不直接持有中文字符串。

export type NarrationText = string | ((payload: Record<string, string | number>) => string);
export type NarrationStage = Record<string, NarrationText>;

export interface ScribeNarration {
  common: NarrationStage;
  taskFrame: NarrationStage;
  opening: NarrationStage;
  roundtable: NarrationStage;
  inquiry: NarrationStage;
  settlement: NarrationStage;
  error: NarrationStage;
}

export const SCRIBE_NARRATION: ScribeNarration = {
  common: {
    booting: "正在准备这一步…",
    connecting: "正在和你的钥匙打招呼…",
    retrying: "这一句没听清，再试一次…",
    interrupted: "已经记下你说到这里。",
  },
  taskFrame: {
    reading: "正在为这次圆桌建案。",
    extractingTension: "正在确认这件事真正的选择岔路。",
    questioning: "还缺一个关键边界，需要先问清楚。",
    proposing: "正在写 4-Key 议题提案。",
    refining: "正在按你的校对重写案由。",
    done: "提案写好了，请你校对。",
  },
  opening: {
    seating: "五声正在写第一轮立论…",
    voiceSpeaking: ({ 角色名 }) => `「${角色名}」正在整理自己的立论…`,
    voiceRotating: ({ 下一位 }) => `「${下一位}」也在整理自己的立论…`,
    done: "第一轮立论已经写在桌上。",
  },
  roundtable: {
    inquiryDrafting: "主持人正在想下一个问题…",
    duelPicking: "正在组织这两声的对话…",
    duelOngoing: ({ X, Y }) => `「${X}」和「${Y}」正在对话…`,
    voiceThinking: ({ 角色名 }) => `${角色名 === "五声" ? "五声" : `「${角色名}」`}正在组织这一轮…`,
    voiceSpeaking: ({ 角色名 }) => `${角色名 === "五声" ? "五声" : `「${角色名}」`}正在写下这一轮发言…`,
    done: "这一轮完成了。",
  },
  inquiry: {
    reviewing: "书记员在回看刚才的圆桌…",
    drafting: "正在挑出还没说清楚的那几处…",
    done: ({ n }) => `写好了 ${n} 个问题，请你慢慢答。`,
    analyzing: "正在分析你的回答…",
    followup: "你的回答让书记员发现了新的线索…",
  },
  settlement: {
    drafting: "书记员在写本心落定…",
    revising: ({ i }) => `第 ${i} 稿不太对，再改一次…`,
    commitment: "正在为你写出今天能做的那一小步…",
    done: "本心落定写好了。请你看一眼是不是这个意思。",
  },
  error: {
    modelSlow: "这次有点慢，书记员还在等回音…",
    networkLost: "和外面断了线，正在重新接通…",
    keyExpired: "钥匙好像不认了，需要你回头看看…",
    safetyOfframp: "这里有点重。书记员先停一下，等你愿意再走。",
    unknown: "出了点问题，书记员正在想办法…",
  },
};

/**
 * 查表渲染文案。保证类型安全 + 缺 key 时降级（永不空白）。
 */
export function narrate(
  stage: keyof ScribeNarration,
  key: string,
  payload?: Record<string, string | number>,
): string {
  const entry = SCRIBE_NARRATION[stage]?.[key];
  if (!entry) return SCRIBE_NARRATION.common.booting as string;
  return typeof entry === "function" ? entry(payload ?? {}) : entry;
}
