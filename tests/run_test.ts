import assert from "node:assert/strict";
import {
  applyTextChanges,
  runPipeline,
  runTextNodePipeline,
  SAFE_PUNCTUATION_RULES,
} from "../src/mod.ts";
import type { RulePhase, RuntimeRule, TextSegment } from "../src/model.ts";
import {
  type Annotation,
  defineRunRule,
  type LogicalRun,
  type RunDiagnostic,
  type RunEdit,
} from "../src/run.ts";
import { seededRandom } from "./support/invariants.ts";

function runRule(
  id: string,
  apply: (run: LogicalRun) => {
    edits?: readonly RunEdit[];
    diagnostics?: readonly RunDiagnostic[];
    annotations?: readonly Annotation[];
  },
  phase: RulePhase = "punctuation-spacing",
): RuntimeRule {
  return defineRunRule(
    { ...SAFE_PUNCTUATION_RULES[0].definition, id, phase, dependsOn: [] },
    apply,
  );
}

function fixNodes(
  values: readonly (string | TextSegment)[],
  edits: readonly RunEdit[],
): string[] {
  const nodes = values.map((value, index) => ({
    id: `n${index}`,
    ...(typeof value === "string" ? { value } : value),
  }));
  const result = runTextNodePipeline(
    nodes,
    [runRule("x-test.edit", () => ({ edits }))],
    { locale: "fr-FR", mode: "fix" },
  );
  assert.deepEqual(
    applyTextChanges(nodes, result.changes).map(({ value }) => value),
    result.nodes.map(({ value }) => value),
  );
  return result.nodes.map(({ value }) => value);
}

Deno.test("run edits inside one node map to that node", () => {
  assert.deepEqual(
    fixNodes(["Bonjour ,", "monde"], [{ start: 7, end: 8, replacement: "" }]),
    ["Bonjour,", "monde"],
  );
});

Deno.test("run edits across nodes delete per node and place text by bias", () => {
  const edit = { start: 2, end: 4, replacement: " " };
  assert.deepEqual(fixNodes(["ab ", " ;cd"], [{ ...edit, bias: "right" }]), [
    "ab",
    " ;cd",
  ]);
  assert.deepEqual(fixNodes(["ab ", " ;cd"], [edit]), ["ab ", ";cd"]);
});

Deno.test("run insertions at a node boundary follow their bias", () => {
  const edit = { start: 1, end: 1, replacement: "!" };
  assert.deepEqual(fixNodes(["a", "b"], [edit]), ["a!", "b"]);
  assert.deepEqual(fixNodes(["a", "b"], [{ ...edit, bias: "right" }]), [
    "a",
    "!b",
  ]);
  assert.deepEqual(fixNodes(["a", "", "b"], [edit]), ["a!", "", "b"]);
  assert.deepEqual(fixNodes(["a"], [{ ...edit, start: 0, end: 0 }]), ["!a"]);
  assert.deepEqual(
    fixNodes(["ab", { value: "", protected: true }], [{
      start: 2,
      end: 2,
      replacement: "!",
      bias: "right",
    }]),
    ["ab!", ""],
  );
  assert.deepEqual(fixNodes(["a", "", "b"], [{ ...edit, bias: "right" }]), [
    "a",
    "",
    "!b",
  ]);
  assert.deepEqual(fixNodes(["", "b"], [{ ...edit, start: 0, end: 0 }]), [
    "",
    "!b",
  ]);
  const empty = { start: 0, end: 0, replacement: "!" };
  assert.deepEqual(fixNodes(["", ""], [empty]), ["", "!"]);
  assert.deepEqual(fixNodes(["", ""], [{ ...empty, bias: "right" }]), [
    "!",
    "",
  ]);
});

Deno.test("run edits never touch protected nodes", () => {
  const nodes = ["a", { value: "x", protected: true }, "b"];
  assert.deepEqual(fixNodes(nodes, [{ start: 1, end: 1, replacement: "!" }]), [
    "a!",
    "x",
    "b",
  ]);
  assert.throws(
    () =>
      fixNodes(nodes, [{ start: 1, end: 1, replacement: "!", bias: "right" }]),
    /inserts next to protected text/,
  );
  assert.throws(
    () => fixNodes(nodes, [{ start: 0, end: 2, replacement: "" }]),
    /edits protected text/,
  );
});

Deno.test("run edits are rejected when overlapping or sharing a start", () => {
  assert.throws(
    () =>
      fixNodes(["abcd"], [
        { start: 0, end: 2, replacement: "" },
        { start: 1, end: 3, replacement: "" },
      ]),
    /overlapping edits/,
  );
  assert.throws(
    () =>
      fixNodes(["abcd"], [
        { start: 1, end: 1, replacement: "x" },
        { start: 1, end: 2, replacement: "" },
      ]),
    /overlapping edits/,
  );
  assert.throws(
    () => fixNodes(["abcd"], [{ start: 3, end: 5, replacement: "" }]),
    /invalid edit range/,
  );
});

Deno.test("run rules cannot transform text outside fix mode", () => {
  const rule = runRule("x-test.edit", () => ({
    edits: [{ start: 0, end: 1, replacement: "" }],
  }));
  for (const mode of ["lint", "manual-review"] as const) {
    assert.throws(
      () => runPipeline("abc", [rule], { locale: "fr-FR", mode }),
      new RegExp(`cannot transform text in ${mode} mode`),
    );
  }
});

Deno.test("protected annotations protect later rules across nodes", () => {
  const classify = runRule(
    "x-test.classify",
    () => ({
      annotations: [{ kind: "test", start: 1, end: 5, protect: true }],
    }),
    "classify",
  );
  const nodes = [{ id: "a", value: "a ,b" }, { id: "b", value: " ,c ," }];
  const result = runTextNodePipeline(
    nodes,
    [classify, ...SAFE_PUNCTUATION_RULES],
    { locale: "fr-FR", mode: "fix" },
  );
  assert.deepEqual(result.nodes.map(({ value }) => value), ["a ,b", " ,c,"]);
  assert.throws(
    () =>
      runPipeline(
        "abc",
        [runRule("x-test.annotate", () => ({
          annotations: [{ kind: "test", start: 0, end: 1, protect: true }],
        }))],
        { locale: "fr-FR", mode: "fix" },
      ),
    /annotates outside the classify phase/,
  );
});

Deno.test("run diagnostics map to source coordinates by bias", () => {
  const rule = runRule("x-test.diagnose", () => ({
    diagnostics: [
      { start: 2, end: 2, message: "left" },
      { start: 2, end: 2, message: "right", bias: "right" },
      { start: 3, end: 4, message: "inside" },
    ],
  }));
  const result = runTextNodePipeline(
    [{ id: "a", value: "ab" }, { id: "b", value: "cde" }],
    [rule],
    { locale: "fr-FR", mode: "lint" },
  );
  assert.deepEqual(
    result.diagnostics.map(({ message, segmentId, start, end }) => [
      message,
      segmentId,
      start,
      end,
    ]),
    [["left", "a", 2, 2], ["right", "b", 0, 0], ["inside", "b", 1, 2]],
  );
  assert.throws(
    () =>
      runPipeline(
        [{ value: "ab" }, { value: "cd" }],
        [runRule("x-test.diagnose", () => ({
          diagnostics: [{ start: 1, end: 3, message: "cross" }],
        }))],
        { locale: "fr-FR", mode: "lint" },
      ),
    /diagnostic crossing fragments/,
  );
});

Deno.test("run rules cannot be applied per fragment", () => {
  const rule = runRule("x-test.edit", () => ({}));
  assert.throws(
    () =>
      rule.apply("a", {
        locale: "fr-FR",
        mode: "fix",
        segments: [{ value: "a" }],
        segmentIndex: 0,
      }),
    /runs on the logical run/,
  );
});

Deno.test("random run edits keep source changes consistent", () => {
  const random = seededRandom(20260926);
  for (let iteration = 0; iteration < 2000; iteration++) {
    const nodes = Array.from(
      { length: 1 + Math.floor(random() * 4) },
      (_, index) => ({
        id: `n${index}`,
        value: "abcdefgh".slice(0, Math.floor(random() * 6)),
        ...(random() < 0.2 ? { protected: true } : {}),
      }),
    );
    const rules = Array.from(
      { length: 1 + Math.floor(random() * 3) },
      (_, index) =>
        runRule(`x-test.random-${index}`, (run) => {
          const edits: RunEdit[] = [];
          let cursor = 0;
          const local = seededRandom(iteration * 31 + index);
          while (cursor <= run.text.length) {
            const start = cursor + Math.floor(local() * 3);
            if (start > run.text.length) break;
            const end = Math.min(
              run.text.length,
              start + (local() < 0.4 ? 0 : 1 + Math.floor(local() * 3)),
            );
            const blocked = run.protectedRanges.some((range) =>
              start === end
                ? range.start <= start && start <= range.end
                : range.start < end && start < range.end
            );
            const replacement = ["", "x", "yy"][Math.floor(local() * 3)];
            const empty = run.text.length === 0;
            if (!blocked && !empty && !(start === end && replacement === "")) {
              edits.push({
                start,
                end,
                replacement,
                bias: local() < 0.5 ? "left" : "right",
              });
            }
            cursor = end + 1;
          }
          return { edits };
        }),
    );
    const result = runTextNodePipeline(nodes, rules, {
      locale: "fr-FR",
      mode: "fix",
    });
    assert.deepEqual(
      applyTextChanges(nodes, result.changes).map(({ value }) => value),
      result.nodes.map(({ value }) => value),
    );
    for (const [index, node] of nodes.entries()) {
      if (node.protected) assert.equal(result.nodes[index].value, node.value);
    }
  }
});

Deno.test("large edit and fragment counts stay within the call stack", () => {
  const count = 200_000;
  const text = "ab".repeat(count);
  const protect = runRule(
    "x-test.protect-many",
    () => ({
      annotations: Array.from({ length: count }, (_, index) => ({
        kind: "x-test",
        start: 2 * index,
        end: 2 * index + 1,
        protect: true,
      })),
    }),
    "classify",
  );
  const insert = runRule("x-test.insert-many", () => ({
    edits: Array.from({ length: count }, (_, index) => ({
      start: 2 * index + 2,
      end: 2 * index + 2,
      replacement: "-",
    })),
  }));
  const result = runPipeline(text, [protect, insert], {
    locale: "fr-FR",
    mode: "fix",
  });
  assert.equal(result.value, "ab-".repeat(count));
  assert.equal(result.changes.length, count);
  assert.equal(result.segments.length, 2 * count);
});
