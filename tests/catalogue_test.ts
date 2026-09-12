import assert from "node:assert/strict";
import {
  PRESETS,
  RULES,
  SOURCES,
  validateCatalogue,
} from "../src/catalogue/mod.ts";

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
    assert.equal(rule.defaultMode, "manual-review");
    assert.deepEqual(rule.outcome, { after: "U+0020" });
    assert.ok(
      preset.rules.some((selection) => selection.ruleId === ruleId),
      `missing preset selection ${ruleId}`,
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
