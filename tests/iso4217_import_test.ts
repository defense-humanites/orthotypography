import assert from "node:assert/strict";
import type { CurrencyRegistryProvenance } from "../src/registry/currency-types.ts";
import {
  collapseIso4217Currencies,
  compareCurrencies,
  parseIso4217ListOneXml,
  renderCurrencyDataModule,
  renderCurrencyDiffReport,
  SIX_LIST_ONE_URL,
} from "../scripts/iso4217.ts";

const fixtureUrl = new URL("./fixtures/iso4217-list-one.xml", import.meta.url);

Deno.test("SIX List One parser preserves provenance and special values", async () => {
  const parsed = parseIso4217ListOneXml(await Deno.readTextFile(fixtureUrl));
  assert.equal(parsed.publishedAt, "2026-08-30");
  assert.equal(parsed.entries.length, 4);
  assert.deepEqual(parsed.entitiesWithoutCurrency, [
    "ANTARCTICA & TEST TERRITORY",
  ]);

  const currencies = collapseIso4217Currencies(parsed.entries);
  assert.deepEqual(currencies.map(({ code }) => code), ["EUR", "USD", "XAU"]);
  assert.equal(currencies.find(({ code }) => code === "XAU")?.minorUnit, null);
});

Deno.test("SIX List One parser rejects partial and conflicting identities", async () => {
  const fixture = await Deno.readTextFile(fixtureUrl);
  assert.throws(
    () => parseIso4217ListOneXml(fixture.replace("<CcyNbr>978</CcyNbr>", "")),
    /Missing CcyNbr/u,
  );
  const parsed = parseIso4217ListOneXml(
    fixture.replace("<CcyNm>US Dollar</CcyNm>", "<CcyNm>Dollar</CcyNm>"),
  );
  assert.throws(
    () => collapseIso4217Currencies(parsed.entries),
    /Conflicting rows for currency USD/u,
  );
});

Deno.test("currency generator reports and renders deterministic updates", async () => {
  const currencies = collapseIso4217Currencies(
    parseIso4217ListOneXml(await Deno.readTextFile(fixtureUrl)).entries,
  );
  const before = currencies.filter(({ code }) => code !== "XAU");
  const difference = compareCurrencies(before, currencies);
  assert.deepEqual(difference.added.map(({ code }) => code), ["XAU"]);
  assert.deepEqual(difference.removed, []);
  assert.deepEqual(difference.changed, []);

  const provenance = {
    sourceUrl: SIX_LIST_ONE_URL,
    publishedAt: "2026-08-30",
    retrievedAt: "2026-08-30",
    sourceSha256: "a".repeat(64),
    scope: "complete",
  } as const satisfies CurrencyRegistryProvenance;
  const module = renderCurrencyDataModule(currencies, provenance);
  assert.match(
    module,
    /CURRENCY_REGISTRY_VERSION = "iso-4217-six-2026-08-30"/u,
  );
  assert.match(module, /code: "XAU"[\s\S]*minorUnit: null/u);

  const report = renderCurrencyDiffReport(difference, provenance, 4, 1);
  assert.match(report, /Ajouts : `XAU`/u);
  assert.match(report, /SHA-256 source/u);
});
