import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(
  await readFile(new URL("../npm/package.json", import.meta.url), "utf8"),
);

function esmTarget(exportEntry) {
  if (typeof exportEntry === "string") return exportEntry;
  if (exportEntry !== null && typeof exportEntry === "object") {
    if ("import" in exportEntry) return esmTarget(exportEntry.import);
    if ("default" in exportEntry) return esmTarget(exportEntry.default);
  }
  throw new Error(`No ESM target in package export: ${JSON.stringify(exportEntry)}`);
}

async function importPackageExport(subpath) {
  const target = esmTarget(packageJson.exports?.[subpath]);
  assert.match(target, /^\.\//, `Invalid export target for ${subpath}`);
  return await import(new URL(`../npm/${target.slice(2)}`, import.meta.url));
}

const { compilePipeline, runPipeline } = await importPackageExport(".");
const { RULES } = await importPackageExport("./catalogue");
const {
  CURRENCIES,
  CURRENCY_REGISTRY_PROVENANCE,
  resolveUnitExpression,
  SI_UNITS,
  validateCurrencyRegistry,
  validateUnitRegistry,
} = await importPackageExport(
  "./registry",
);

assert.equal(packageJson.name, "@orthotypography/core");
assert.equal(packageJson.license, "MIT");
assert.equal(typeof runPipeline, "function");
assert.equal(typeof compilePipeline, "function");
assert.ok(Array.isArray(RULES));
assert.ok(RULES.length > 0);
assert.ok(Array.isArray(SI_UNITS));
assert.deepEqual(validateUnitRegistry(), []);
assert.equal(resolveUnitExpression("kg⋅m⋅s⁻²")?.compound, true);
assert.ok(Array.isArray(CURRENCIES));
assert.equal(CURRENCY_REGISTRY_PROVENANCE.scope, "subset");
assert.deepEqual(validateCurrencyRegistry(), []);

console.log("npm ESM smoke test passed");
