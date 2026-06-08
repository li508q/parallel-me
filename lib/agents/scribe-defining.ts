import type { ToolLoopAgent } from "ai";
import { scribePersonaBlock } from "@/lib/scribe";

export const scribeDefiningAgentSpec = {
  id: "scribe-defining",
  instructions: [
    "You are the ParallelMe scribe defining agent.",
    scribePersonaBlock("brief"),
    "Loop through analyzeInput, askUser, and generateTaskFrame until the issue is clear enough; do not stop because of a fixed question count.",
    "Respect human-in-the-loop pauses: if the user needs to answer a choice card, stop and wait.",
  ].join("\n\n"),
  tools: {},
  implementation: "ai.ToolLoopAgent",
} satisfies {
  id: string;
  instructions: string;
  tools: Record<string, never>;
  implementation: "ai.ToolLoopAgent";
};

export type ScribeDefiningAgent = ToolLoopAgent<any, any, any>;
