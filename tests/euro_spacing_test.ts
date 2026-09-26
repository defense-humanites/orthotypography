import assert from "node:assert/strict";
import {
  EURO_SPACING_RULE,
  IMPRIMERIE_NATIONALE_RULES,
  NUMERIC_PROTECTION_RULE,
  runPipeline,
} from "../src/mod.ts";

Deno.test("euro spacing is diagnostic by default", () => {
  const result = runPipeline(
    "12€",
    [NUMERIC_PROTECTION_RULE, EURO_SPACING_RULE],
    { locale: "fr-FR" },
  );
  assert.equal(result.value, "12€");
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].replacement, "12\u00a0€");
});

Deno.test("euro spacing fixes placement and spacing when requested", () => {
  const result = runPipeline("€12 ; 20 €", IMPRIMERIE_NATIONALE_RULES, {
    locale: "fr-FR",
    mode: "fix",
  });
  assert.equal(result.value, "12\u00a0€\u202f; 20\u00a0€");
});

Deno.test("euro spacing preserves other and ambiguous currencies", () => {
  const input = "12 USD / 12$ / $12 / 12 £ / £12 / 12 EUR";
  const result = runPipeline(input, IMPRIMERIE_NATIONALE_RULES, {
    locale: "fr-FR",
  });
  assert.equal(result.value, input);
  assert.deepEqual(
    result.diagnostics.filter(({ ruleId }) =>
      ruleId === "number.euro.nbsp-before"
    ),
    [],
  );
});

Deno.test("euro spacing preserves protected URI", () => {
  const input = "https://x.test/12€";
  const result = runPipeline(input, IMPRIMERIE_NATIONALE_RULES, {
    locale: "fr-FR",
  });
  assert.equal(result.value, input);
});

Deno.test("euro spacing requires classification and is idempotent", () => {
  assert.throws(
    () => runPipeline("12€", [EURO_SPACING_RULE], { locale: "fr-FR" }),
    Error,
    "Missing dependency classify.numeric-constructs",
  );
  const rules = [NUMERIC_PROTECTION_RULE, EURO_SPACING_RULE];
  const first = runPipeline("€12", rules, {
    locale: "fr-FR",
    mode: "fix",
  });
  const second = runPipeline(first.value, rules, {
    locale: "fr-FR",
    mode: "fix",
  });
  assert.equal(second.value, first.value);
  assert.deepEqual(second.diagnostics, []);
});

Deno.test("euro spacing keeps a symbol with the amount it follows", () => {
  const rules = [NUMERIC_PROTECTION_RULE, EURO_SPACING_RULE];
  for (
    const [input, expected] of [
      ["Prix : 25\u00a0€ 30\u00a0€", "Prix : 25\u00a0€ 30\u00a0€"],
      ["Prix : 25 € 30 €", "Prix : 25\u00a0€ 30\u00a0€"],
      ["25 € 12,5", "25\u00a0€ 12,5"],
      ["€ 25 12,5 12,5", "25\u00a0€ 12,5 12,5"],
      ["12€ et €30", "12\u00a0€ et 30\u00a0€"],
    ]
  ) {
    const lint = runPipeline(input, rules, { locale: "fr-FR", mode: "lint" });
    const fix = runPipeline(input, rules, { locale: "fr-FR", mode: "fix" });
    assert.equal(fix.value, expected, input);
    assert.deepEqual(
      lint.diagnostics.map(({ replacement }) => replacement),
      fix.changes.map(({ replacement }) => replacement),
      input,
    );
    const again = runPipeline(fix.value, rules, {
      locale: "fr-FR",
      mode: "fix",
    });
    assert.deepEqual(again.changes, [], input);
  }
});
