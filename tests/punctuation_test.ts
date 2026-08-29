import assert from "node:assert/strict";
import {
  HIGH_PUNCTUATION_RULES,
  IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
  runPipeline,
  SAFE_PUNCTUATION_RULES,
} from "../src/mod.ts";

Deno.test("safe punctuation rules remove whitespace before comma and period", () => {
  const result = runPipeline(
    "Bonjour , monde. Fin .",
    SAFE_PUNCTUATION_RULES,
    { locale: "fr-FR" },
  );

  assert.equal(result.value, "Bonjour, monde. Fin.");
  assert.equal(result.diagnostics.length, 2);
});

Deno.test("safe punctuation rules report without changing text in lint mode", () => {
  const input = "Bonjour , monde .";
  const result = runPipeline(input, SAFE_PUNCTUATION_RULES, {
    locale: "fr-FR",
    mode: "lint",
  });

  assert.equal(result.value, input);
  assert.equal(result.diagnostics.length, 2);
});

Deno.test("safe punctuation rules preserve protected segments", () => {
  const result = runPipeline(
    [
      { value: "Bonjour ," },
      { value: " code .", protected: true },
    ],
    SAFE_PUNCTUATION_RULES,
    { locale: "fr-FR" },
  );

  assert.equal(result.value, "Bonjour, code .");
});

Deno.test("safe punctuation rules are idempotent", () => {
  const first = runPipeline(
    "Bonjour , monde .",
    SAFE_PUNCTUATION_RULES,
    { locale: "fr-FR" },
  );
  const second = runPipeline(first.value, SAFE_PUNCTUATION_RULES, {
    locale: "fr-FR",
  });

  assert.equal(second.value, first.value);
  assert.deepEqual(second.diagnostics, []);
});

Deno.test("high punctuation rules apply source-specific French spacing", () => {
  const result = runPipeline(
    "Note:exemple; vraiment? Bravo!",
    IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
    { locale: "fr-FR" },
  );

  assert.equal(
    result.value,
    "Note\u00a0: exemple\u202f; vraiment\u202f? Bravo\u202f!",
  );
});

Deno.test("colon spacing preserves classified numeric and technical contexts", () => {
  const input =
    "À 12:30, ratio 1:2, https://exemple.fr:443/a, localhost:3000 et ::before.";
  const result = runPipeline(
    input,
    IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
    { locale: "fr-FR" },
  );

  assert.equal(result.value, input);
});

Deno.test("high punctuation preserves expressive and code-like sequences", () => {
  const input = "Quoi?! Vraiment!! Déclaration !important";
  const result = runPipeline(
    input,
    IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
    { locale: "fr-FR" },
  );

  assert.equal(result.value, input);
  assert.deepEqual(result.diagnostics, []);
});

Deno.test("high punctuation rules require their classifier dependency", () => {
  assert.throws(
    () =>
      runPipeline("Note: exemple", HIGH_PUNCTUATION_RULES, {
        locale: "fr-FR",
      }),
    Error,
    "Missing dependency classify.numeric-constructs",
  );
});

Deno.test("high punctuation composition is idempotent", () => {
  const first = runPipeline(
    "Note:exemple; vraiment? Bravo!",
    IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
    { locale: "fr-FR" },
  );
  const second = runPipeline(
    first.value,
    IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
    { locale: "fr-FR" },
  );

  assert.equal(second.value, first.value);
  assert.deepEqual(second.diagnostics, []);
});

Deno.test("high punctuation supports lint mode", () => {
  const input = "Note:exemple; vraiment?";
  const result = runPipeline(
    input,
    IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
    { locale: "fr-FR", mode: "lint" },
  );

  assert.equal(result.value, input);
  assert.equal(result.diagnostics.length, 3);
});

Deno.test("French punctuation rules do not run for another locale", () => {
  const input = "Note: example; really?";
  const result = runPipeline(
    input,
    IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
    { locale: "en-US" },
  );

  assert.equal(result.value, input);
  assert.deepEqual(result.appliedRuleIds, []);
});
