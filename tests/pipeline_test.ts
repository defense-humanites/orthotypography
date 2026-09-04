import assert from "node:assert/strict";
import { compilePipeline, runPipeline } from "../src/mod.ts";
import type { RuntimeRule } from "../src/model.ts";

function applyChanges(
  source: string,
  changes: readonly {
    readonly start: number;
    readonly end: number;
    readonly expected: string;
    readonly replacement: string;
  }[],
): string {
  let result = source;
  for (
    const change of [...changes].sort((left, right) => right.start - left.start)
  ) {
    assert.equal(source.slice(change.start, change.end), change.expected);
    result = result.slice(0, change.start) + change.replacement +
      result.slice(change.end);
  }
  return result;
}

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
  assert.deepEqual(result.changes, [{
    segmentIndex: 0,
    start: 0,
    end: 14,
    expected: "Bonjour  monde",
    replacement: "Bonjour monde",
    ruleIds: ["test.cleanup"],
  }]);
});

Deno.test("changes compose rule provenance in source coordinates", () => {
  const first: RuntimeRule = {
    definition: {
      ...cleanupRule.definition,
      id: "test.expand",
      phase: "glyphs",
    },
    apply(value, context) {
      const edits = [{ start: 0, end: 1, replacement: "xy" }];
      return {
        value: context.mode === "fix" ? "xy" : value,
        edits,
      };
    },
  };
  const second: RuntimeRule = {
    definition: {
      ...cleanupRule.definition,
      id: "test.refine",
      phase: "cleanup",
    },
    apply(value, context) {
      const edits = [{ start: 1, end: 2, replacement: "z" }];
      return {
        value: context.mode === "fix" ? "xz" : value,
        edits,
      };
    },
  };

  const result = runPipeline("a", [second, first], {
    locale: "fr-FR",
    mode: "fix",
  });

  assert.equal(result.value, "xz");
  assert.deepEqual(result.changes, [{
    segmentIndex: 0,
    start: 0,
    end: 1,
    expected: "a",
    replacement: "xz",
    ruleIds: ["test.expand", "test.refine"],
  }]);
  assert.equal(applyChanges("a", result.changes), result.value);
});

Deno.test("lint mode never reports applied changes", () => {
  const result = runPipeline("a", [{
    ...cleanupRule,
    apply(value) {
      return {
        value,
        edits: [{ start: 0, end: 1, replacement: "b" }],
      };
    },
  }], { locale: "fr-FR", mode: "lint" });

  assert.deepEqual(result.changes, []);
});

Deno.test("declared edits must produce the transformed value", () => {
  const invalid: RuntimeRule = {
    ...cleanupRule,
    definition: { ...cleanupRule.definition, id: "test.invalid-edits" },
    apply() {
      return {
        value: "b",
        edits: [{ start: 0, end: 1, replacement: "c" }],
      };
    },
  };

  assert.throws(
    () => runPipeline("a", [invalid], { locale: "fr-FR", mode: "fix" }),
    Error,
    "edits do not produce its value",
  );
});

Deno.test("one rule transaction may edit a neighboring segment", () => {
  const crossSegmentRule: RuntimeRule = {
    ...cleanupRule,
    definition: { ...cleanupRule.definition, id: "test.cross-segment" },
    apply(value, context) {
      return {
        value,
        ...(context.segmentIndex === 1
          ? {
            segmentEdits: [{
              segmentIndex: 0,
              start: 1,
              end: 2,
              replacement: "",
            }],
          }
          : {}),
      };
    },
  };
  const result = runPipeline(
    [{ id: "left", value: "a " }, { id: "right", value: "b" }],
    [crossSegmentRule],
    { locale: "fr-FR", mode: "fix" },
  );

  assert.equal(result.value, "ab");
  assert.deepEqual(result.changes, [{
    segmentIndex: 0,
    segmentId: "left",
    start: 1,
    end: 2,
    expected: " ",
    replacement: "",
    ruleIds: ["test.cross-segment"],
  }]);
});

Deno.test("rule transactions cannot edit protected neighbors", () => {
  const invalid: RuntimeRule = {
    ...cleanupRule,
    definition: { ...cleanupRule.definition, id: "test.protected-neighbor" },
    apply(value, context) {
      return {
        value,
        ...(context.segmentIndex === 1
          ? {
            segmentEdits: [{
              segmentIndex: 0,
              start: 0,
              end: 1,
              replacement: "x",
            }],
          }
          : {}),
      };
    },
  };

  assert.throws(
    () =>
      runPipeline(
        [{ value: "a", protected: true }, { value: "b" }],
        [invalid],
        { locale: "fr-FR", mode: "fix" },
      ),
    Error,
    "targets protected segment",
  );
});

Deno.test("compiled pipelines reject duplicate rule IDs", () => {
  assert.throws(
    () => compilePipeline([cleanupRule, cleanupRule]),
    Error,
    "Duplicate runtime rule",
  );
});

Deno.test("pipelines honor a rule's default mode", () => {
  const lintByDefault: RuntimeRule = {
    definition: {
      ...cleanupRule.definition,
      id: "test.default-lint",
      defaultMode: "lint",
    },
    apply(value, context) {
      return { value: context.mode === "fix" ? value.toUpperCase() : value };
    },
  };

  assert.equal(
    runPipeline("texte", [lintByDefault], { locale: "fr-FR" }).value,
    "texte",
  );
  assert.equal(
    runPipeline("texte", [lintByDefault], {
      locale: "fr-FR",
      mode: "fix",
    }).value,
    "TEXTE",
  );
});

Deno.test("pipelines reject invalid protection ranges", () => {
  const invalidProtectionRule: RuntimeRule = {
    definition: { ...cleanupRule.definition, id: "test.invalid-protection" },
    apply(value) {
      return { value, protections: [{ start: 2, end: value.length + 1 }] };
    },
  };

  assert.throws(
    () => runPipeline("texte", [invalidProtectionRule], { locale: "fr-FR" }),
    Error,
    "Invalid protection range",
  );
});

Deno.test("pipelines reject simultaneous transformation and protection", () => {
  const ambiguousRule: RuntimeRule = {
    definition: { ...cleanupRule.definition, id: "test.ambiguous-protection" },
    apply() {
      return { value: "changed", protections: [{ start: 0, end: 1 }] };
    },
  };

  assert.throws(
    () => runPipeline("text", [ambiguousRule], { locale: "fr-FR" }),
    Error,
    "cannot transform and protect in one pass",
  );
});

Deno.test("source segment IDs must be unique and non-empty", () => {
  assert.throws(
    () =>
      runPipeline(
        [{ id: "node", value: "a" }, { id: "node", value: "b" }],
        [],
        { locale: "fr-FR" },
      ),
    Error,
    "duplicate source segment ID",
  );
  assert.throws(
    () => runPipeline([{ id: "", value: "a" }], [], { locale: "fr-FR" }),
    Error,
    "Invalid or duplicate source segment ID",
  );
});

Deno.test("lint mode rejects transformations to preserve source coordinates", () => {
  const invalidLintRule: RuntimeRule = {
    definition: { ...cleanupRule.definition, id: "test.invalid-lint" },
    apply(value) {
      return { value: value.toUpperCase() };
    },
  };

  assert.throws(
    () =>
      runPipeline("texte", [invalidLintRule], {
        locale: "fr-FR",
        mode: "lint",
      }),
    Error,
    "cannot transform text in lint mode",
  );
});
