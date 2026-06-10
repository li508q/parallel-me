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
