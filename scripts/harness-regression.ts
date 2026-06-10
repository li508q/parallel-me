import assert from "node:assert/strict";
import {
  extractAnchorTerms,
  extractJsonObjectCandidates,
  hasVisibleReasoningLeak,
  sanitizeVisibleReasoning,
  validateJsonWithSchema,
} from "../lib/llm-harness.ts";
import {
  StrictInquiryResultSchema,
  StrictProbeResultSchema,
} from "../lib/schema.ts";

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
  assert.doesNotMatch(sanitized, /选项设计|JSON|schema|Surface Dilemma|Current Constraints|missing_modules/);
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
