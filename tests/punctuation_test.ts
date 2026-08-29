import assert from "node:assert/strict";
import { runPipeline, SAFE_PUNCTUATION_RULES } from "../src/mod.ts";

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
