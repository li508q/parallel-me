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
    booting: "书记员正在落座…",
    connecting: "正在和你的钥匙打招呼…",
    retrying: "这一句没听清，让书记员再试一次…",
    interrupted: "已经记下你说到这里。",
  },
  taskFrame: {
    reading: "书记员正在阅读你的问题…",
    extractingTension: "正在把冲突从叙述里拎出来…",
    questioning: "正在准备追问…",
    proposing: "正在拟制议题提案…",
    refining: "正在根据你的反馈修正…",
    done: "提案已完成。",
  },
  opening: {
    seating: "五位正在依次入席…",
    voiceSpeaking: ({ 角色名 }) => `「${角色名}」正在开口…`,
    voiceRotating: ({ 角色名, 下一位 }) => `「${角色名}」收声，「${下一位}」接过来…`,
    done: "第一轮立论已经写在桌上。",
  },
  roundtable: {
    inquiryDrafting: "主持人正在想下一个问题…",
    duelPicking: "正在挑出最尖锐的两声…",
    duelOngoing: ({ X, Y }) => `「${X}」和「${Y}」开始正面交锋…`,
    voiceThinking: ({ 角色名 }) => `「${角色名}」正在深入思考…`,
    voiceSpeaking: ({ 角色名 }) => `「${角色名}」正在回应…`,
    mirrorStructure: "书记员正在观察当前的对话结构…",
    done: "这一轮讨论告一段落。",
  },
  inquiry: {
    reviewing: "书记员在回看刚才的圆桌…",
    drafting: "正在挑出还没说清楚的那几处…",
    done: ({ n }) => `写好了 ${n} 个问题，请你慢慢答。`,
    analyzing: "正在分析你的回答…",
    followup: "你的回答让书记员发现了新的线索…",
  },
  settlement: {
    drafting: "书记员在试着写清明句…",
    revising: ({ i }) => `第 ${i} 稿不太对，再改一次…`,
    commitment: "正在为你写出今天能做的那一小步…",
    done: "落定了。请你看一眼是不是这个意思。",
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
