import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  extractAnchorTerms,
  extractJsonObjectCandidates,
  hasVisibleReasoningLeak,
  sanitizeVisibleReasoning,
  validateJsonWithSchema,
} from "../lib/llm-harness.ts";
import {
  StrictAlignmentReportSchema,
  StrictInquiryResultSchema,
  StrictProposalResultSchema,
  StrictRefineResultSchema,
  StrictDuelQuestionSchema,
  StrictDuelResponseSchema,
  StrictRoundtableVoiceTurnSchema,
  StrictScribeObservationLedgerSchema,
  StrictVoiceOpeningPayloadResultSchema,
  StrictProbeResultSchema,
  StrictTasteProfileSchema,
} from "../lib/schema.ts";
import { scribeModelStream, type ScribeStreamEvent } from "../lib/agents/events.ts";
import { strictRepairGuidance } from "../lib/llm-strict.ts";

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

check("visible reasoning removes technical and internal labels", () => {
  const raw = [
    "检查：没有技术词汇，没有JSON，完全符合要求。直接输出。",
    "Surface Dilemma: 辞职读博 vs 继续业务代码。",
    "Current Constraints: 28 岁，父母要稳定。",
    "schema_version=inquiry_v2, missing_modules=core_value_axis",
    "选项设计：这里不应该给用户看",
  ].join("\n");

  const sanitized = sanitizeVisibleReasoning(raw);
  assert.equal(hasVisibleReasoningLeak(sanitized), false);
  assert.match(sanitized, /具象化困惑/);
  assert.match(sanitized, /现实处境/);
  assert.doesNotMatch(sanitized, /检查|直接输出|选项设计|JSON|schema|Surface Dilemma|Current Constraints|missing_modules/);
});

check("visible reasoning removes structured retry noise", () => {
  const raw = [
    "检查：没有技术词汇，没有JSON，完全符合要求。",
    "直接输出。追问结构化生成失败，正在做一次 JSON 修复：JSON schema 校验失败：questions.0.text: Too big: expected string to have <=120 characters。",
    "追问输出还不够稳，正在第 2 次重新出题：追问没有引用用户材料里的具体锚点，例如：Constraints、Resolution、Expected、Surface、Dilemma、Current。",
    "真正需要问的是：28 岁、父母要稳定和每天打开 code 都提不起兴趣之间，哪一个先卡住你？",
  ].join("\n");

  const sanitized = sanitizeVisibleReasoning(raw);
  assert.equal(hasVisibleReasoningLeak(sanitized), false);
  assert.doesNotMatch(sanitized, /JSON|schema|Too big|Constraints|Resolution|Surface|Dilemma|重新出题|结构化生成失败/);
  assert.match(sanitized, /28 岁/);
  assert.match(sanitized, /code/);
});

check("anchor extraction keeps user material and ignores harness vocabulary", () => {
  const anchors = extractAnchorTerms(
    "Surface Dilemma Current Constraints Expected Resolution schema key core_value_axis code 28 6k 2.5w 读博",
    { dictionary: ["code", "读博"], limit: 12 },
  );

  assert.ok(anchors.includes("code"));
  assert.ok(anchors.includes("读博"));
  assert.ok(anchors.includes("2.5w"));
  assert.ok(anchors.includes("6k"));
  assert.ok(anchors.includes("28"));
  assert.equal(anchors.includes("Surface"), false);
  assert.equal(anchors.includes("Constraints"), false);
  assert.equal(anchors.includes("schema"), false);
  assert.equal(anchors.includes("core_value_axis"), false);
});

check("inquiry anchor extraction ignores settlement module vocabulary", () => {
  const anchors = extractAnchorTerms(
    "falsified_fantasy core_value_axis cost_acceptance minimum_action dialectic_synthesis action=ask_more 读博 28 岁 父母 稳定 code",
    { dictionary: ["读博", "父母", "稳定", "code"], limit: 12 },
  );

  assert.ok(anchors.includes("读博"));
  assert.ok(anchors.includes("父母"));
  assert.ok(anchors.includes("稳定"));
  assert.ok(anchors.includes("code"));
  assert.ok(anchors.includes("28"));
  assert.equal(anchors.includes("core_value_axis"), false);
  assert.equal(anchors.includes("cost_acceptance"), false);
  assert.equal(anchors.includes("minimum_action"), false);
  assert.equal(anchors.includes("dialectic_synthesis"), false);
  assert.equal(anchors.includes("ask_more"), false);
});

check("scribe model stream attaches source to lifecycle events", () => {
  const events: ScribeStreamEvent[] = [];
  const handlers = scribeModelStream((event) => events.push(event), "inquiry");

  handlers.onToken("hello");
  handlers.onReasoning("thinking", { mode: "public" });
  handlers.onEvent({
    type: "validation_failed",
    operation: "generateAlignmentInquiry",
    attempt: 1,
    errors: ["问询题干和选项必须引用本轮议题。"],
  });
  handlers.onEvent({ type: "narration", stage: "inquiry", key: "drafting" });

  assert.deepEqual(events[0], { type: "model_delta", source: "inquiry", text: "hello" });
  assert.deepEqual(events[1], { type: "reasoning_delta", source: "inquiry", text: "thinking", mode: "public" });
  assert.equal(events[2]?.type, "validation_failed");
  assert.equal("source" in events[2] ? events[2].source : undefined, "inquiry");
  assert.equal(events[3]?.type, "narration");
  assert.equal("source" in events[3], false);
});

check("strict repair guidance turns schema errors into user-safe instructions", () => {
  const guidance = strictRepairGuidance([
    "JSON schema 校验失败：questions.0.text: Too big: expected string to have <=120 characters",
    "问题 module=core_value_axis 不在 missing_modules 中",
  ]).join("\n");

  assert.match(guidance, /题干压缩成一句清楚的问句/);
  assert.match(guidance, /不同缺口|落点|信息/);
  assert.doesNotMatch(guidance, /questions\.0\.text|core_value_axis|missing_modules|JSON schema/);
});

check("legacy task-frame fallback path stays retired", () => {
  const llmSource = readFileSync(new URL("../lib/llm.ts", import.meta.url), "utf8");
  const taskFrameRoute = readFileSync(new URL("../app/api/task-frame/route.ts", import.meta.url), "utf8");
  const streamRoute = readFileSync(new URL("../app/api/task-frame/stream/route.ts", import.meta.url), "utf8");

  assert.doesNotMatch(llmSource, /generateValidated\(|generateTaskFrame|fallbackTaskFrame|fallbackChoiceCards/);
  assert.match(taskFrameRoute, /Use probe, propose, or refine/);
  assert.doesNotMatch(taskFrameRoute, /generateTaskFrame|choiceAnswers/);
  assert.match(streamRoute, /status:\s*410/);
});

check("runtime generation paths do not use scripted fallbacks", () => {
  const llmSource = readFileSync(new URL("../lib/llm.ts", import.meta.url), "utf8");
  const eventSource = readFileSync(new URL("../lib/agents/events.ts", import.meta.url), "utf8");
  const storeSource = readFileSync(new URL("../lib/store/meeting-store.ts", import.meta.url), "utf8");

  assert.doesNotMatch(
    llmSource,
    /fallbackOpeningTurns|fallbackOpeningPayload|fallbackRoundtableMove|fallbackContinuationText|fallbackObservationLedger|fallbackAlignmentReport|Promise\.allSettled\(/,
  );
  assert.doesNotMatch(eventSource, /fallback_used/);
  assert.doesNotMatch(storeSource, /fallback_used|保守版本/);
});

check("product docs describe no scripted fallback policy", () => {
  const docs = [
    "../README.md",
    "../docs/03-five-voices-roundtable.md",
    "../docs/04-scribe-observation-and-inquiry.md",
    "../docs/06-system-architecture.md",
  ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n\n");

  assert.doesNotMatch(docs, /补一次观察摘要|单声失败才保守降级/);
  assert.match(docs, /不会用脚本发言补齐这一声/);
  assert.match(docs, /不会补写模板观察/);
  assert.match(docs, /不静默返回模板报告/);
});

check("JSON extraction tolerates prose and fenced objects", () => {
  const raw = `先说一句废话。
\`\`\`json
{"schema_version":"probe_v2","action":"ask_more","readyToPropose":false,"confidence":0.42,"missing_keys":["surface_dilemma"],"questions":[{"id":"q_surface","text":"你说想辞职读博，真正卡住你的具体岔路是什么？","options":[{"id":"opt_a","label":"我怕继续做业务代码会越来越麻木"},{"id":"opt_b","label":"我怕读博只是另一种逃离现实"},{"id":"custom","label":"都不准，我自己说"}],"purpose":"surface_dilemma"}]}
\`\`\`
后面又补一句。`;

  assert.equal(extractJsonObjectCandidates(raw).length, 1);
  const parsed = validateJsonWithSchema(raw, StrictProbeResultSchema);
  assert.equal(parsed.schema_version, "probe_v2");
  assert.equal(parsed.questions.length, 1);
});

check("strict probe schema accepts detailed questions longer than 120 chars", () => {
  const detailedQuestion =
    "你说“28 岁、父母觉得稳定最重要、每天打开 code 处理业务就提不起兴趣”，如果这三件事不能同时被满足，哪一个现实信号最能说明你不是一时心烦，而是真的需要重切职业方向，并且这个信号出现后你愿意把它当成圆桌要验证的判断规则，而不是继续在情绪里反复打转？";
  assert.ok(detailedQuestion.length > 120);

  const raw = JSON.stringify({
    schema_version: "probe_v2",
    action: "ask_more",
    readyToPropose: false,
    confidence: 0.46,
    missing_keys: ["expected_resolution"],
    questions: [{
      id: "q_expected_resolution",
      text: detailedQuestion,
      purpose: "expected_resolution",
      options: [
        { id: "opt_a", label: "连续一个月只要处理业务代码就明显耗竭" },
        { id: "opt_b", label: "我已经能说清读博要验证的具体问题" },
        { id: "custom", label: "都不准，我自己说" },
      ],
    }],
  });

  const parsed = validateJsonWithSchema(raw, StrictProbeResultSchema);
  assert.equal(parsed.questions[0]?.text, detailedQuestion);
});

check("strict probe schema rejects malformed display questions", () => {
  const raw = JSON.stringify({
    schema_version: "probe_v2",
    action: "ask_more",
    readyToPropose: false,
    confidence: 0.4,
    missing_keys: ["surface_dilemma"],
    questions: [{
      id: "q_bad",
      text: "这不是一个合格问题",
      purpose: "surface_dilemma",
      options: [
        { id: "a", label: "选项太短" },
        { id: "custom", label: "都不准，我自己说" },
      ],
    }],
  });

  assert.throws(() => validateJsonWithSchema(raw, StrictProbeResultSchema), /schema 校验失败/);
});

check("strict probe schema rejects duplicated custom options", () => {
  const raw = JSON.stringify({
    schema_version: "probe_v2",
    action: "ask_more",
    readyToPropose: false,
    confidence: 0.4,
    missing_keys: ["current_constraints"],
    questions: [{
      id: "q_constraints",
      text: "如果先不谈读博热情，现实里最先卡住你的约束是哪一个？",
      purpose: "current_constraints",
      options: [
        { id: "opt_a", label: "我最担心辞职后现金流撑不住" },
        { id: "custom", label: "都不准，我自己说" },
        { id: "custom_2", label: "我想自己说另一条" },
      ],
    }],
  });

  assert.throws(() => validateJsonWithSchema(raw, StrictProbeResultSchema), /exactly one custom/);
});

check("strict probe schema rejects contradictory confidence", () => {
  const askMoreTooHigh = JSON.stringify({
    schema_version: "probe_v2",
    action: "ask_more",
    readyToPropose: false,
    confidence: 0.91,
    missing_keys: ["core_fears"],
    questions: [{
      id: "q_core",
      text: "如果读博和留下都不完美，你最怕失去的那条底线到底是什么？",
      purpose: "core_fears",
      options: [
        { id: "opt_a", label: "我怕失去还能认真选择自己的感觉" },
        { id: "opt_b", label: "我怕失去父母眼里稳定可靠的身份" },
        { id: "custom", label: "都不准，我自己说" },
      ],
    }],
  });
  const proposalTooLow = JSON.stringify({
    schema_version: "probe_v2",
    action: "issue_proposal",
    readyToPropose: true,
    confidence: 0.62,
    missing_keys: [],
    questions: [],
  });

  assert.throws(() => validateJsonWithSchema(askMoreTooHigh, StrictProbeResultSchema), /confidence <= 0\.74/);
  assert.throws(() => validateJsonWithSchema(proposalTooLow, StrictProbeResultSchema), /confidence >= 0\.75/);
});

check("strict proposal schema accepts concrete 4-key issue proposal", () => {
  const raw = JSON.stringify({
    schema_version: "issue_proposal_v2",
    proposal: {
      issue_sentence: "你不是单纯在问要不要辞职读博，而是在确认如何验证主动选择感是否值得你承担稳定和收入的不确定。",
      surface_dilemma: {
        title: "具象化的困惑",
        content: "一边是继续在大厂处理业务代码、保留稳定现金流；另一边是认真启动读博验证，承认它会带来收入和关系压力。",
        details: ["继续大厂业务代码", "启动读博验证", "稳定现金流与长期兴趣冲突"],
      },
      current_constraints: {
        title: "真实的处境",
        content: "你已经 28 岁，父母把稳定看得很重，而当前工作收入和职业惯性都在拉住你，读博路径还没有被现实验证。",
        details: ["28 岁", "父母重视稳定", "当前工作收入", "读博路径未验证"],
      },
      core_fears: {
        title: "隐秘的关切",
        content: "真正刺痛的不是读博标签本身，而是担心自己继续耗在不感兴趣的业务里，会越来越不相信自己的判断和主动选择能力。",
        details: ["失去主动选择感", "不再相信判断", "长期兴趣被耗掉"],
      },
      expected_resolution: {
        title: "渴望的终局",
        content: "这次圆桌要产出一个验证规则：用哪些现实信号判断读博是在服务长期主轴，还是只是在逃离业务代码的厌倦。",
        details: ["验证规则", "现实信号", "区分长期主轴与逃离厌倦"],
      },
    },
  });

  const parsed = validateJsonWithSchema(raw, StrictProposalResultSchema);
  assert.equal(parsed.schema_version, "issue_proposal_v2");
  assert.equal(parsed.proposal.expected_resolution.title, "渴望的终局");
});

check("strict proposal schema rejects placeholders and repeated fear as resolution", () => {
  const raw = JSON.stringify({
    schema_version: "issue_proposal_v2",
    proposal: {
      issue_sentence: "你不是单纯在问职业选择，而是在确认一个待明确的问题。",
      surface_dilemma: {
        title: "具象化的困惑",
        content: "待补充。",
        details: ["待补充", "未知"],
      },
      current_constraints: {
        title: "真实的处境",
        content: "现实条件还不清楚，需要之后再看。",
        details: ["不清楚", "未知"],
      },
      core_fears: {
        title: "隐秘的关切",
        content: "用户害怕失去安全感、体面和掌控。",
        details: ["安全感", "体面"],
      },
      expected_resolution: {
        title: "渴望的终局",
        content: "用户害怕失去安全感、体面和掌控。",
        details: ["安全感", "体面"],
      },
    },
  });

  assert.throws(() => validateJsonWithSchema(raw, StrictProposalResultSchema), /schema 校验失败/);
});

check("strict taste profile schema accepts specific compact profile", () => {
  const raw = JSON.stringify({
    schema_version: "taste_profile_v2",
    themes: ["漂泊", "记忆", "自由"],
    moods: ["冷静", "幽微"],
    identity_hint: "在边界处发光的人",
  });

  const parsed = validateJsonWithSchema(raw, StrictTasteProfileSchema);
  assert.equal(parsed.schema_version, "taste_profile_v2");
  assert.equal(parsed.identity_hint, "在边界处发光的人");
});

check("strict taste profile schema rejects generic placeholders", () => {
  const raw = JSON.stringify({
    schema_version: "taste_profile_v2",
    themes: ["普通", "未知", "待补充"],
    moods: ["普通", "复杂"],
    identity_hint: "有趣的人",
  });

  assert.throws(() => validateJsonWithSchema(raw, StrictTasteProfileSchema), /schema 校验失败/);
});

check("strict refine schema accepts update proposal action", () => {
  const raw = JSON.stringify({
    schema_version: "proposal_refine_v2",
    action: "update_proposal",
    needMoreInfo: false,
    confidence: 0.82,
    missing_keys: [],
    questions: [],
    proposal: {
      issue_sentence: "你不是单纯在问要不要辞职读博，而是在确认如何用观察期验证读博是否真的服务主动选择感。",
      surface_dilemma: {
        title: "具象化的困惑",
        content: "一边是立刻把读博当成出路，另一边是先用观察期验证它是否只是逃离业务代码的厌倦。",
        details: ["立刻读博", "先设观察期", "区分长期主轴与逃离厌倦"],
      },
      current_constraints: {
        title: "真实的处境",
        content: "父母看重稳定，当前工作仍提供收入和职业惯性，而读博的研究问题、收入变化和关系压力还没有被验证。",
        details: ["父母看重稳定", "当前工作收入", "读博路径未验证"],
      },
      core_fears: {
        title: "隐秘的关切",
        content: "真正被触动的是担心继续耗在业务代码里，会越来越不相信自己还能主动选择长期投入的方向。",
        details: ["主动选择感", "长期投入", "不再相信判断"],
      },
      expected_resolution: {
        title: "渴望的终局",
        content: "这次圆桌要帮你确定观察期的验证规则：哪些现实信号足以说明读博值得承担稳定和收入的不确定。",
        details: ["观察期", "验证规则", "现实信号"],
      },
    },
  });

  const parsed = validateJsonWithSchema(raw, StrictRefineResultSchema);
  assert.equal(parsed.action, "update_proposal");
  assert.equal(parsed.proposal?.expected_resolution.title, "渴望的终局");
});

check("strict refine schema rejects contradictory action payloads", () => {
  const askMoreWithProposal = JSON.stringify({
    schema_version: "proposal_refine_v2",
    action: "ask_more",
    needMoreInfo: false,
    confidence: 0.91,
    missing_keys: [],
    questions: [],
    proposal: {
      issue_sentence: "你不是单纯在问职业选择，而是在确认观察期规则是否足够支撑下一步行动。",
      surface_dilemma: { title: "具象化的困惑", content: "一边继续当前工作，另一边启动读博验证。", details: ["当前工作", "读博验证"] },
      current_constraints: { title: "真实的处境", content: "父母期待稳定，当前收入仍然重要。", details: ["父母稳定", "当前收入"] },
      core_fears: { title: "隐秘的关切", content: "担心失去主动选择长期方向的能力。", details: ["主动选择", "长期方向"] },
      expected_resolution: { title: "渴望的终局", content: "圆桌要验证观察期的判断规则。", details: ["观察期", "判断规则"] },
    },
  });
  const updateWithoutProposal = JSON.stringify({
    schema_version: "proposal_refine_v2",
    action: "update_proposal",
    needMoreInfo: false,
    confidence: 0.8,
    missing_keys: [],
    questions: [],
  });

  assert.throws(() => validateJsonWithSchema(askMoreWithProposal, StrictRefineResultSchema), /schema 校验失败/);
  assert.throws(() => validateJsonWithSchema(updateWithoutProposal, StrictRefineResultSchema), /requires proposal/);
});

check("strict roundtable schemas accept grounded voice outputs", () => {
  const opening = validateJsonWithSchema(JSON.stringify({
    schema_version: "voice_opening_v2",
    thesis: "厌倦正在逼你重看方向。",
    pull: "先把读博验证成事实。",
    concern: "稳定感会被短期摇动。",
    protected_value: "主动选择的能力",
    task_evidence: "每天打开 code 就提不起兴趣",
  }), StrictVoiceOpeningPayloadResultSchema);
  const turn = validateJsonWithSchema(JSON.stringify({
    schema_version: "roundtable_voice_turn_v2",
    text: "我不反对读博，但先把安全垫算清；不然你会把自由变成另一种被动。",
    refers_to: ["roam"],
  }), StrictRoundtableVoiceTurnSchema);
  const question = validateJsonWithSchema(JSON.stringify({
    schema_version: "duel_question_v2",
    question: "出走的我，如果读博也很枯燥，你还坚持它是出口吗？",
  }), StrictDuelQuestionSchema);
  const response = validateJsonWithSchema(JSON.stringify({
    schema_version: "duel_response_v2",
    response: "我坚持的不是读博标签，而是别让业务惯性继续替他决定方向。",
  }), StrictDuelResponseSchema);

  assert.equal(opening.schema_version, "voice_opening_v2");
  assert.equal(turn.refers_to[0], "roam");
  assert.match(question.question, /？$/);
  assert.match(response.response, /方向/);
});

check("strict roundtable schemas reject empty or generic advice outputs", () => {
  const badOpening = JSON.stringify({
    schema_version: "voice_opening_v2",
    thesis: "",
    pull: "我建议你慢慢考虑。",
    concern: "未知",
    protected_value: "",
    task_evidence: "待补充",
  });
  const badTurn = JSON.stringify({
    schema_version: "roundtable_voice_turn_v2",
    text: "大家都有道理，我建议你综合考虑。",
    refers_to: [],
  });
  const badQuestion = JSON.stringify({
    schema_version: "duel_question_v2",
    question: "你怎么看",
  });

  assert.throws(() => validateJsonWithSchema(badOpening, StrictVoiceOpeningPayloadResultSchema), /schema 校验失败/);
  assert.throws(() => validateJsonWithSchema(badTurn, StrictRoundtableVoiceTurnSchema), /schema 校验失败/);
  assert.throws(() => validateJsonWithSchema(badQuestion, StrictDuelQuestionSchema), /schema 校验失败/);
});

check("strict observation ledger schema accepts grounded hidden ledger", () => {
  const raw = JSON.stringify({
    schema_version: "observation_ledger_v2",
    observations: [{
      id: "obs_code_avoidance",
      round_index: 2,
      trigger: "user_reaction",
      observation: "用户把打开 code 时的耗竭和读博冲动并置，需要区分长期价值转向和短期厌倦。",
      attribution: "这不是职业结论，只是后续问询要验证的张力。",
      module: "core_values",
      evidence: ["每天打开 code 处理业务就提不起兴趣", "再不试是不是就来不及了"],
    }],
    unanswered_questions: [{
      id: "unanswered_minimum_test",
      from_voice_id: "future",
      from_name: "未来我",
      question: "如果先不辞职，你愿意用哪一个现实信号验证读博不是逃离业务代码？",
      why_it_matters: "它会决定最终落定能否给出最小行动线索。",
    }],
    module_signals: {
      creative_hopelessness: ["不能同时保留稳定、立刻热爱和无风险转向"],
      core_values: ["自主选择感"],
      cost_acceptance: ["父母期待稳定带来的关系压力"],
      minimum_action: ["先设一段观察期"],
    },
  });

  const parsed = validateJsonWithSchema(raw, StrictScribeObservationLedgerSchema);
  assert.equal(parsed.schema_version, "observation_ledger_v2");
  assert.equal(parsed.observations[0]?.module, "core_values");
});

check("strict observation ledger schema rejects empty hidden ledger", () => {
  const raw = JSON.stringify({
    schema_version: "observation_ledger_v2",
    observations: [],
    unanswered_questions: [],
    module_signals: {
      creative_hopelessness: [],
      core_values: [],
      cost_acceptance: [],
      minimum_action: [],
    },
  });

  assert.throws(() => validateJsonWithSchema(raw, StrictScribeObservationLedgerSchema), /at least one observation/);
});

check("strict inquiry schema accepts contextual UI questions", () => {
  const raw = JSON.stringify({
    schema_version: "inquiry_v2",
    action: "ask_more",
    readyForReport: false,
    confidence: 0.55,
    missing_modules: ["core_value_axis"],
    questions: [{
      id: "inquiry_core_value_1",
      module: "core_value_axis",
      question: "你在圆桌里一直被“别被稳定耗掉”这句话牵动，这更像是在守住读博本身，还是守住自己还能主动选择的感觉？",
      options: [
        { id: "opt_a", label: "更像是在守住读博这条具体路径", meaning: "用户把读博视为核心方向" },
        { id: "opt_b", label: "更像是在守住自己还能主动选择的感觉", meaning: "用户核心主轴是自主感" },
        { id: "custom", label: "都不准，我自己说", meaning: "用户自述" },
      ],
    }],
  });

  const parsed = validateJsonWithSchema(raw, StrictInquiryResultSchema);
  assert.equal(parsed.schema_version, "inquiry_v2");
  assert.equal(parsed.questions[0]?.module, "core_value_axis");
});

check("strict inquiry schema rejects contradictory confidence", () => {
  const askMoreTooHigh = JSON.stringify({
    schema_version: "inquiry_v2",
    action: "ask_more",
    readyForReport: false,
    confidence: 0.88,
    missing_modules: ["cost_acceptance"],
    questions: [{
      id: "inquiry_cost_1",
      module: "cost_acceptance",
      question: "如果这一个月验证后发现科研也很枯燥，你愿意承认并吞下哪一种代价？",
      options: [
        { id: "opt_a", label: "我愿意吞下继续留在业务代码里的不甘", meaning: "用户接受留下的痛" },
        { id: "opt_b", label: "我愿意吞下读博后收入和关系压力的痛", meaning: "用户接受转向的痛" },
        { id: "custom", label: "都不准，我自己说", meaning: "用户自述" },
      ],
    }],
  });
  const reportTooLow = JSON.stringify({
    schema_version: "inquiry_v2",
    action: "settlement_report",
    readyForReport: true,
    confidence: 0.63,
    missing_modules: [],
    questions: [],
    alignmentProfile: {
      falsified_fantasy: "读博不会自动消除枯燥。",
      core_value_axis: "自主选择感。",
      offended_voices: [],
      accepted_costs: [],
      refused_costs: [],
      unresolved_tensions: [],
      hegelian_synthesis: { thesis: "想守住主动选择", antithesis: "现实成本仍在", synthesis: "先用观察期验证" },
      user_self_statements: [],
    },
  });

  assert.throws(() => validateJsonWithSchema(askMoreTooHigh, StrictInquiryResultSchema), /confidence <= 0\.74/);
  assert.throws(() => validateJsonWithSchema(reportTooLow, StrictInquiryResultSchema), /confidence >= 0\.75/);
});

check("strict alignment report schema accepts grounded settlement card", () => {
  const raw = JSON.stringify({
    schema_version: "alignment_report_v2",
    creative_hopelessness: {
      title: "创造性无望宣判",
      report: "这条完美路不存在：既保留父母眼里的稳定，又立刻逃离业务代码的枯燥，还完全不承担读博的不确定性。继续等一个无痛答案，只会把选择推回内耗里。",
      evidence: ["父母觉得稳定最重要", "每天打开 code 处理业务就提不起兴趣"],
    },
    core_value_axis: {
      title: "核心价值主轴提取",
      report: "真正要优先服务的不是读博这个标签，而是你仍然能主动选择、能把注意力交给长期问题的感觉。读博只有在服务这个主轴时才成立。",
      evidence: ["再不试是不是就来不及了", "自己还能主动选择的感觉"],
    },
    cost_acceptance_contract: {
      title: "痛苦接纳契约",
      report: "我同意：如果要守住主动选择，我必须承认父母会担心稳定、收入会有不确定、业务代码的厌倦也不能自动证明读博正确。",
      evidence: ["父母觉得稳定最重要", "读博后收入和关系压力"],
    },
    minimum_viable_commitment: {
      title: "最小阻力行动承诺",
      report: "今晚 24:00 前写一页验证清单：列出读博真正想研究的问题、现有工作最消耗的三个触发点，以及下周能联系的一位博士生。",
      evidence: ["先设一段观察期", "用现实信号验证"],
    },
    dialectic_synthesis: {
      thesis: "我想守住主动选择和长期投入的能力。",
      antithesis: "稳定期待、收入风险和厌倦情绪都不能被抹掉。",
      synthesis: "我先不把辞职读博当成逃离按钮，而是用一周验证它是否真的服务主动选择；如果证据不成立，我也承认需要调整路径。",
    },
  });

  const parsed = validateJsonWithSchema(raw, StrictAlignmentReportSchema);
  assert.equal(parsed.schema_version, "alignment_report_v2");
  assert.match(parsed.dialectic_synthesis.synthesis, /验证/);
});

check("strict alignment report schema rejects advice tone and hollow modules", () => {
  const raw = JSON.stringify({
    schema_version: "alignment_report_v2",
    creative_hopelessness: {
      title: "创造性无望宣判",
      report: "我建议你先稳定下来，然后慢慢考虑。",
      evidence: ["父母稳定"],
    },
    core_value_axis: {
      title: "核心价值主轴提取",
      report: "自主。",
      evidence: ["自主"],
    },
    cost_acceptance_contract: {
      title: "痛苦接纳契约",
      report: "我同意承担一些代价，但还没有说清楚具体代价。",
      evidence: ["代价"],
    },
    minimum_viable_commitment: {
      title: "最小阻力行动承诺",
      report: "今天想一下。",
      evidence: ["想一下"],
    },
    dialectic_synthesis: {
      thesis: "主动选择",
      antithesis: "现实风险",
      synthesis: "先想想。",
    },
  });

  assert.throws(() => validateJsonWithSchema(raw, StrictAlignmentReportSchema), /schema 校验失败/);
});
