import assert from "node:assert/strict";
import {
  applyTextChanges,
  runTextNodePipeline,
  SAFE_PUNCTUATION_RULES,
} from "../src/mod.ts";
import type { RuleApplicationEdit, RuntimeRule } from "../src/model.ts";
import { seededRandom } from "./support/invariants.ts";

const replacements = ["", "x", "yy", " ", "ZZZ"];

/** A rule proposing seeded, non-overlapping edits, some of them adjacent. */
function randomRule(id: string, seed: number): RuntimeRule {
  return {
    definition: { ...SAFE_PUNCTUATION_RULES[0].definition, id },
    apply(value, context) {
      const random = seededRandom(
        seed * 7919 + value.length * 31 + context.segmentIndex,
      );
      const edits: RuleApplicationEdit[] = [];
      let cursor = 0;
      while (cursor <= value.length && edits.length < 6) {
        const start = cursor + Math.floor(random() * 4);
        if (start > value.length) break;
        const end = Math.min(
          value.length,
          start + (random() < 0.4 ? 0 : Math.floor(random() * 3)),
        );
        const replacement =
          replacements[Math.floor(random() * replacements.length)];
        if (
          (end === start && replacement === "") ||
          edits.at(-1)?.start === start
        ) {
          cursor = start + 1;
          continue;
        }
        edits.push({ start, end, replacement });
        cursor = random() < 0.3 ? end : end + 1;
      }
      const diagnostics = edits.map(({ start, end }) => ({
        start,
        end,
        message: "test",
      }));
      if (context.mode !== "fix") return { value, diagnostics };
      let result = value;
      for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
        result = result.slice(0, edit.start) + edit.replacement +
          result.slice(edit.end);
      }
      return { value: result, edits, diagnostics };
    },
  };
}

Deno.test("stacked rules keep source changes consistent with their output", () => {
  const random = seededRandom(99);
  for (let run = 0; run < 2000; run++) {
    const rules = Array.from(
      { length: 1 + Math.floor(random() * 4) },
      (_, index) => randomRule(`test.random-${index}`, run * 10 + index),
    );
    const nodes = Array.from(
      { length: 1 + Math.floor(random() * 4) },
      (_, index) => ({
        id: `n${index}`,
        value: "abcdefghijklmnop".slice(0, Math.floor(random() * 12)),
        ...(random() < 0.1 ? { protected: true } : {}),
      }),
    );
    const result = runTextNodePipeline(nodes, rules, {
      locale: "fr-FR",
      mode: "fix",
    });
    assert.deepEqual(
      applyTextChanges(nodes, result.changes).map(({ value }) => value),
      result.nodes.map(({ value }) => value),
      JSON.stringify(nodes),
    );
  }
});
