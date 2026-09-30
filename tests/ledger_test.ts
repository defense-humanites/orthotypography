import assert from "node:assert/strict";
import { applyTextChanges, runTextNodePipeline } from "../src/mod.ts";
import type { RunEdit, RuntimeRule } from "../src/model.ts";
import { testRule } from "./support/rules.ts";
import { seededRandom } from "./support/invariants.ts";

const replacements = ["", "x", "yy", " ", "ZZZ"];

/** A rule proposing seeded, non-overlapping edits, some of them adjacent. */
function randomRule(id: string, seed: number): RuntimeRule {
  return testRule(id, (run) => {
    // An empty run may hold only protected nodes, where nothing can be
    // inserted.
    if (run.text.length === 0) return {};
    const random = seededRandom(seed * 7919 + run.text.length * 31);
    const edits: RunEdit[] = [];
    const blocked = (start: number, end: number) =>
      run.protectedRanges.some((range) =>
        start === end
          ? range.start <= start && start <= range.end
          : range.start < end && start < range.end
      );
    let cursor = 0;
    while (cursor <= run.text.length && edits.length < 12) {
      const start = cursor + Math.floor(random() * 4);
      if (start > run.text.length) break;
      const end = Math.min(
        run.text.length,
        start + (random() < 0.4 ? 0 : Math.floor(random() * 3)),
      );
      const replacement =
        replacements[Math.floor(random() * replacements.length)];
      if (
        (end === start && replacement === "") ||
        edits.at(-1)?.start === start || blocked(start, end)
      ) {
        cursor = start + 1;
        continue;
      }
      edits.push({
        start,
        end,
        replacement,
        bias: random() < 0.5 ? "left" : "right",
      });
      cursor = random() < 0.3 ? end : end + 1;
    }
    const diagnostics = edits.filter(({ start, end }) =>
      start === end ||
      run.nodeBoundaries.every((boundary) =>
        boundary <= start || boundary >= end
      )
    ).map(({ start, end }) => ({ start, end, message: "test" }));
    return run.mode === "fix" ? { edits, diagnostics } : { diagnostics };
  });
}

Deno.test("stacked rules keep source changes consistent with their output", () => {
  const random = seededRandom(99);
  for (let run = 0; run < 2000; run++) {
    const rules = Array.from(
      { length: 1 + Math.floor(random() * 4) },
      (_, index) => randomRule(`x-test.random-${index}`, run * 10 + index),
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
