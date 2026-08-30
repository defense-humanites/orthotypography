import assert from "node:assert/strict";
import {
  CURRENCIES,
  CURRENCY_REGISTRY_VERSION,
  resolveCurrencyCode,
  resolveCurrencyNotation,
  validateCurrencyRegistry,
} from "../src/registry/mod.ts";

Deno.test("currency registry is internally consistent", () => {
  assert.equal(CURRENCY_REGISTRY_VERSION, "iso-4217-six-2026-08-30");
  assert.equal(CURRENCIES.length, 5);
  assert.deepEqual(validateCurrencyRegistry(), []);
});

Deno.test("currency registry resolves exact ISO codes", () => {
  assert.equal(resolveCurrencyCode("EUR")?.numericCode, "978");
  assert.equal(resolveCurrencyCode("CHF")?.minorUnit, 2);
  assert.equal(resolveCurrencyCode("eur"), null);
  assert.equal(resolveCurrencyCode("BGN"), null);
});

Deno.test("currency symbols expose rather than erase ambiguity", () => {
  assert.deepEqual(
    resolveCurrencyNotation("€")?.currencies.map(({ code }) => code),
    ["EUR"],
  );
  assert.equal(resolveCurrencyNotation("€")?.ambiguous, false);
  assert.deepEqual(
    resolveCurrencyNotation("$")?.currencies.map(({ code }) => code),
    ["USD", "CAD"],
  );
  assert.equal(resolveCurrencyNotation("$")?.ambiguous, true);
});
