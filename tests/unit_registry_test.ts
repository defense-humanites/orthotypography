import assert from "node:assert/strict";
import {
  resolveUnitExpression,
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

Deno.test("unit expressions resolve products, quotients, and powers", () => {
  assert.deepEqual(
    resolveUnitExpression("m/s")?.factors.map(({ symbol, position }) => [
      symbol,
      position,
    ]),
    [["m", "numerator"], ["s", "denominator"]],
  );
  assert.deepEqual(
    resolveUnitExpression("kg⋅m⋅s⁻²")?.factors.map(({ symbol, exponent }) => [
      symbol,
      exponent,
    ]),
    [["kg", 1], ["m", 1], ["s", -2]],
  );
  assert.equal(resolveUnitExpression("m²")?.factors[0].exponent, 2);
  assert.equal(resolveUnitExpression("kW⋅h")?.compound, true);
  assert.equal(resolveUnitExpression("kg m s⁻²")?.compound, true);
});

Deno.test("unit expressions reject ambiguous or non-SI spellings", () => {
  for (const expression of ["m/s/kg", "m·s", "mps", "m⁰", "µkg/s"]) {
    assert.equal(resolveUnitExpression(expression), null, expression);
  }
});

Deno.test("unit expression AST makes parenthesized quotients unambiguous", () => {
  const grouped = resolveUnitExpression("m/(s⋅kg)");
  assert.equal(grouped?.ast.kind, "quotient");
  assert.deepEqual(
    grouped?.factors.map(({ symbol, position }) => [symbol, position]),
    [["m", "numerator"], ["s", "denominator"], ["kg", "denominator"]],
  );

  assert.deepEqual(
    resolveUnitExpression("m/(s/kg)")?.factors.map(({ symbol, position }) => [
      symbol,
      position,
    ]),
    [["m", "numerator"], ["s", "denominator"], ["kg", "numerator"]],
  );
  assert.deepEqual(
    resolveUnitExpression("(m/s)²")?.factors.map(({ symbol, exponent }) => [
      symbol,
      exponent,
    ]),
    [["m", 2], ["s", 2]],
  );
});

Deno.test("unit expression AST rejects malformed or ambiguous groups", () => {
  for (
    const expression of [
      "m//s",
      "m/(s/kg",
      "m/()",
      "m/(s/kg)/A",
      "m(s/kg)",
    ]
  ) {
    assert.equal(resolveUnitExpression(expression), null, expression);
  }
});
