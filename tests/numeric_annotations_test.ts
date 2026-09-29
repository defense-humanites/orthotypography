import assert from "node:assert/strict";
import {
  IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
  NUMERIC_PROTECTION_RULE,
  runTextNodePipeline,
  SAFE_PUNCTUATION_RULES,
} from "../src/mod.ts";
import type { TextSegment } from "../src/model.ts";
import { type Annotation, defineRunRule, type LogicalRun } from "../src/run.ts";

function fixNodes(values: readonly (string | TextSegment)[]): string[] {
  const nodes = values.map((value, index) => ({
    id: `n${index}`,
    ...(typeof value === "string" ? { value } : value),
  }));
  return runTextNodePipeline(nodes, IMPRIMERIE_NATIONALE_PUNCTUATION_RULES, {
    locale: "fr-FR",
    mode: "fix",
  }).nodes.map(({ value }) => value);
}

Deno.test("numeric contexts split across text nodes are protected", () => {
  // Before the logical run, each node was classified alone: `10` and `:30`
  // were not a time, and colon spacing turned them into `10 : 30`.
  assert.deepEqual(fixNodes(["Rendez-vous à 10", ":30 demain"]), [
    "Rendez-vous à 10",
    ":30 demain",
  ]);
  assert.deepEqual(fixNodes(["Ratio 3 ", ": 4"]), ["Ratio 3 ", ": 4"]);
});

Deno.test("protected nodes still separate numeric contexts", () => {
  assert.deepEqual(fixNodes(["10", { value: "x", protected: true }, ":30"]), [
    "10",
    "x",
    " : 30",
  ]);
});

/** Records the numeric annotations a later rule sees. */
function observer(seen: Annotation[][]) {
  return defineRunRule(
    {
      ...SAFE_PUNCTUATION_RULES[0].definition,
      id: "x-test.observe-numeric",
      phase: "numeric-spacing",
      dependsOn: ["classify.numeric-constructs"],
    },
    (run: LogicalRun) => {
      seen.push([...run.annotations("numeric")]);
      return {};
    },
  );
}

Deno.test("numeric annotations carry kind and disposition", () => {
  const seen: Annotation[][] = [];
  runTextNodePipeline(
    [{ id: "a", value: "À 10" }, { id: "b", value: ":30, 25 % en plus" }],
    [NUMERIC_PROTECTION_RULE, observer(seen)],
    { locale: "fr-FR", mode: "lint" },
  );
  assert.deepEqual(
    seen[0].map(({ start, end, protect, data }) => ({
      start,
      end,
      protect,
      data,
    })),
    [
      {
        start: 2,
        end: 7,
        protect: true,
        data: { kind: "time", disposition: "protect" },
      },
      {
        start: 9,
        end: 13,
        protect: undefined,
        data: { kind: "percentage", disposition: "target" },
      },
    ],
  );
});

Deno.test("numeric annotations follow earlier edits", () => {
  const seen: Annotation[][] = [];
  const result = runTextNodePipeline(
    [{ id: "a", value: "Oui , à 10" }, { id: "b", value: ":30 , 25 %" }],
    [NUMERIC_PROTECTION_RULE, ...SAFE_PUNCTUATION_RULES, observer(seen)],
    { locale: "fr-FR", mode: "fix" },
  );
  const text = result.nodes.map(({ value }) => value).join("");
  assert.equal(text, "Oui, à 10:30, 25 %");
  assert.deepEqual(
    seen[0].map(({ start, end }) => text.slice(start, end)),
    ["10:30", "25 %"],
  );
});
