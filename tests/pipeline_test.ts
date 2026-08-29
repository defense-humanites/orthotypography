import assert from "node:assert/strict";
import { compilePipeline, runPipeline } from "../src/mod.ts";
import type { RuntimeRule } from "../src/model.ts";

const cleanupRule: RuntimeRule = {
  definition: {
    id: "test.cleanup",
    description: "Collapse repeated spaces for the pipeline contract test.",
    locales: ["fr-FR"],
    phase: "cleanup",
    status: "VERIFIED",
    defaultMode: "fix",
    sources: [],
    outcome: { replacement: "U+0020" },
    exceptions: ["protected segments"],
  },
  apply(value) {
    return { value: value.replaceAll(/ {2,}/g, " ") };
  },
};

Deno.test("the pipeline preserves protected segments", () => {
  const result = runPipeline(
    [
      { value: "Bonjour  monde" },
      { value: "  code  ", protected: true },
    ],
    [cleanupRule],
    { locale: "fr-FR" },
  );

  assert.equal(result.value, "Bonjour monde  code  ");
  assert.deepEqual(result.appliedRuleIds, ["test.cleanup"]);
});

Deno.test("compiled pipelines reject duplicate rule IDs", () => {
  assert.throws(
    () => compilePipeline([cleanupRule, cleanupRule]),
    Error,
    "Duplicate runtime rule",
  );
});
