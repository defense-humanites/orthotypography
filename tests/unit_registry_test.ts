import assert from "node:assert/strict";
import {
  resolveUnitSymbol,
  SI_PREFIXES,
  SI_UNITS,
  UNIT_REGISTRY_VERSION,
  validateUnitRegistry,
} from "../src/registry/mod.ts";

Deno.test("SI registry is internally consistent", () => {
  assert.equal(UNIT_REGISTRY_VERSION, "bipm-si-9.4.01-2026");
  assert.deepEqual(validateUnitRegistry(), []);
  assert.equal(
    SI_UNITS.filter(({ category }) => category === "si-base").length,
    7,
  );
  assert.equal(
    SI_UNITS.filter(({ category }) => category === "si-derived").length,
    22,
  );
  assert.equal(SI_PREFIXES.length, 24);
});

Deno.test("SI registry resolves exact and prefixed symbols", () => {
  assert.equal(resolveUnitSymbol("kg")?.unit.name, "kilogram");
  assert.equal(resolveUnitSymbol("km")?.prefix?.name, "kilo");
  assert.equal(resolveUnitSymbol("mV")?.unit.symbol, "V");
  assert.equal(resolveUnitSymbol("µm")?.prefix?.power, -6);
  assert.equal(resolveUnitSymbol("qg")?.prefix?.power, -30);
  assert.equal(resolveUnitSymbol("°C")?.unit.name, "degree Celsius");
});

Deno.test("SI registry is case-sensitive and rejects compound prefixes", () => {
  for (const symbol of ["Kg", "pa", "µkg", "mkg", "kkg", "sec", "mps"]) {
    assert.equal(resolveUnitSymbol(symbol), null, symbol);
  }
});

Deno.test("angle units retain their no-space exception", () => {
  for (const symbol of ["°", "′", "″"]) {
    assert.equal(resolveUnitSymbol(symbol)?.unit.spacing, "none", symbol);
  }
});
