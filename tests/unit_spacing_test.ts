import assert from "node:assert/strict";
import {
  IMPRIMERIE_NATIONALE_RULES,
  NUMERIC_PROTECTION_RULE,
  runPipeline,
  UNIT_SPACING_RULE,
} from "../src/mod.ts";

Deno.test("unit spacing is diagnostic by default", () => {
  const input = "12kg";
  const result = runPipeline(
    input,
    [NUMERIC_PROTECTION_RULE, UNIT_SPACING_RULE],
    { locale: "fr-FR" },
  );

  assert.equal(result.value, input);
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].replacement, "12\u00a0kg");
});

Deno.test("unit spacing fixes recognized symbols when requested", () => {
  const result = runPipeline(
    "12kg ; 20°C ; 2 kPa ; 5 µm",
    IMPRIMERIE_NATIONALE_RULES,
    { locale: "fr-FR", mode: "fix" },
  );

  assert.equal(
    result.value,
    "12\u00a0kg\u202f; 20\u00a0°C\u202f; 2\u00a0kPa\u202f; 5\u00a0µm",
  );
});

Deno.test("unit spacing preserves exclusions and technical text", () => {
  const input = "20° / 12 kilogrammes / 12 Kg / https://x.test/12kg";
  const result = runPipeline(input, IMPRIMERIE_NATIONALE_RULES, {
    locale: "fr-FR",
  });

  assert.equal(result.value, input);
  assert.deepEqual(
    result.diagnostics.filter(({ ruleId }) =>
      ruleId === "number.unit.nbsp-before"
    ),
    [],
  );
});

Deno.test("unit spacing requires numeric classification", () => {
  assert.throws(
    () =>
      runPipeline("12kg", [UNIT_SPACING_RULE], { locale: "fr-FR" }),
    Error,
    "Missing dependency classify.numeric-constructs",
  );
});

Deno.test("unit spacing is idempotent in fix mode", () => {
  const rules = [NUMERIC_PROTECTION_RULE, UNIT_SPACING_RULE];
  const first = runPipeline("12kg", rules, {
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
