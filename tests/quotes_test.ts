import assert from "node:assert/strict";
import {
  FRENCH_GUILLEMETS_SPACING_RULE,
  IMPRIMERIE_NATIONALE_RULES,
  runPipeline,
} from "../src/mod.ts";

Deno.test("paired French guillemets receive inner no-break spaces", () => {
  for (const input of ["«texte»", "« texte »", "«\u202ftexte\u202f»"]) {
    const result = runPipeline(input, [FRENCH_GUILLEMETS_SPACING_RULE], {
      locale: "fr-FR",
    });
    assert.equal(result.value, "«\u00a0texte\u00a0»", input);
  }
});

Deno.test("nested French guillemets are paired", () => {
  const result = runPipeline(
    "«Il dit «oui».»",
    [FRENCH_GUILLEMETS_SPACING_RULE],
    { locale: "fr-FR" },
  );

  assert.equal(result.value, "«\u00a0Il dit «\u00a0oui\u00a0».\u00a0»");
});

Deno.test("guillemet pairing crosses numeric protection segments", () => {
  const result = runPipeline(
    "«Version 1.2.3»",
    IMPRIMERIE_NATIONALE_RULES,
    { locale: "fr-FR" },
  );

  assert.equal(result.value, "«\u00a0Version 1.2.3\u00a0»");
  assert.ok(result.segments.some(({ protected: value }) => value));
});

Deno.test("unpaired, empty, straight, and protected quotes are preserved", () => {
  for (const input of ["«texte", "texte»", "«»", "« »", 'Il mesure 5".']) {
    const result = runPipeline(input, [FRENCH_GUILLEMETS_SPACING_RULE], {
      locale: "fr-FR",
    });
    assert.equal(result.value, input);
  }

  const protectedResult = runPipeline(
    [{ value: "«code»", protected: true }],
    [FRENCH_GUILLEMETS_SPACING_RULE],
    { locale: "fr-FR" },
  );
  assert.equal(protectedResult.value, "«code»");
});

Deno.test("French guillemet spacing supports lint mode", () => {
  const input = "«texte»";
  const result = runPipeline(input, [FRENCH_GUILLEMETS_SPACING_RULE], {
    locale: "fr-FR",
    mode: "lint",
  });

  assert.equal(result.value, input);
  assert.equal(result.diagnostics.length, 2);
});

Deno.test("French guillemet spacing is locale-aware and idempotent", () => {
  const otherLocale = runPipeline(
    "«text»",
    [FRENCH_GUILLEMETS_SPACING_RULE],
    { locale: "en-US" },
  );
  assert.equal(otherLocale.value, "«text»");

  const first = runPipeline(
    "«texte»",
    [FRENCH_GUILLEMETS_SPACING_RULE],
    { locale: "fr-FR" },
  );
  const second = runPipeline(
    first.value,
    [FRENCH_GUILLEMETS_SPACING_RULE],
    { locale: "fr-FR" },
  );
  assert.equal(second.value, first.value);
  assert.deepEqual(second.diagnostics, []);
});
