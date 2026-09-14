import assert from "node:assert/strict";
import {
  PRESETS,
  RULES,
  SOURCES,
  validateCatalogue,
} from "../src/catalogue/mod.ts";
import type { PresetRuleSelection } from "../src/model.ts";

Deno.test("the documentary catalogue is internally consistent", () => {
  assert.deepEqual(validateCatalogue(SOURCES, RULES, PRESETS), []);
});

Deno.test("digit grouping is catalogued as lint but remains outside presets", () => {
  const rule = RULES.find(({ id }) => id === "number.groupDigits");
  assert.ok(rule);
  assert.equal(rule.defaultMode, "lint");
  assert.equal(rule.status, "VERIFIED_SEMANTICS");
  assert.deepEqual(rule.outcome, { separator: "U+202F", groupSize: "3" });
  assert.ok(
    PRESETS.every((preset) =>
      preset.rules.every(({ ruleId }) => ruleId !== "number.groupDigits")
    ),
  );
});

Deno.test("the Imprimerie nationale preset catalogues atomic post-punctuation spacing", () => {
  const ruleIds = [
    "punctuation.period.space-after",
    "punctuation.colon.space-after",
    "punctuation.semicolon.space-after",
    "punctuation.question.space-after",
    "punctuation.exclamation.space-after",
  ];
  const preset = PRESETS.find((candidate) =>
    candidate.id === "fr-FR/imprimerie-nationale-2002"
  );

  assert.ok(preset);
  for (const ruleId of ruleIds) {
    const rule = RULES.find((candidate) => candidate.id === ruleId);
    assert.ok(rule, `missing documentary rule ${ruleId}`);
    assert.equal(
      rule.defaultMode,
      ruleId === "punctuation.period.space-after" ? "manual-review" : "fix",
    );
    assert.deepEqual(rule.outcome, { after: "U+0020" });
    const presetSelection: PresetRuleSelection | undefined = preset.rules.find(
      (candidate) => candidate.ruleId === ruleId,
    );
    assert.ok(presetSelection, `missing preset selection ${ruleId}`);
    assert.equal(
      presetSelection.mode,
      ruleId === "punctuation.period.space-after" ? "manual-review" : undefined,
    );
  }

  for (
    const ruleId of [
      "punctuation.colon.nbsp-before",
      "punctuation.semicolon.nnbsp-before",
      "punctuation.question.nnbsp-before",
      "punctuation.exclamation.nnbsp-before",
    ]
  ) {
    const rule = RULES.find((candidate) => candidate.id === ruleId);
    assert.ok(rule, `missing documentary rule ${ruleId}`);
    assert.equal(Object.hasOwn(rule.outcome, "after"), false);
  }
});

Deno.test("ellipsis glyph and spacing functions are catalogued but not selected", () => {
  const expected = new Map([
    ["punctuation.ellipsis.glyph", "lint"],
    ["punctuation.ellipsis.final.no-space-before", "fix"],
    ["punctuation.ellipsis.initial.space-after", "lint"],
    ["punctuation.ellipsis.word.space-around", "manual-review"],
  ]);

  for (const [ruleId, defaultMode] of expected) {
    const rule = RULES.find((candidate) => candidate.id === ruleId);
    assert.ok(rule, `missing documentary rule ${ruleId}`);
    assert.equal(rule.defaultMode, defaultMode);
    assert.ok(
      PRESETS.every((preset) =>
        preset.rules.every((selection) => selection.ruleId !== ruleId)
      ),
      `${ruleId} must remain outside every preset`,
    );
  }
});
