import assert from "node:assert/strict";
import {
  classifyNumericConstructs,
  NUMERIC_PROTECTION_RULE,
  runPipeline,
  SAFE_PUNCTUATION_RULES,
} from "../src/mod.ts";
import type { NumericConstructKind } from "../src/model.ts";

function only(input: string, expectedKind: NumericConstructKind) {
  const matches = classifyNumericConstructs(input);
  assert.equal(matches.length, 1, input);
  assert.equal(matches[0].kind, expectedKind, input);
  assert.equal(input.slice(matches[0].start, matches[0].end), matches[0].value);
  return matches[0];
}

Deno.test("numeric classifier protects syntactic numeric contexts", () => {
  const vectors: readonly [string, NumericConstructKind][] = [
    ["Rendez-vous à 12:30", "time"],
    ["Un ratio de 1:2", "ratio"],
    ["https://exemple.ca:443/a", "uri"],
    ["Version v1.2345", "version"],
    ["Version 1.2.3", "version"],
    ["Adresse 192.168.0.1", "ipv4"],
    ["Le 29/08/2026", "date"],
    ["localhost:3000", "port"],
    ["Valeur 3,14", "decimal"],
  ];

  for (const [input, kind] of vectors) {
    assert.equal(only(input, kind).disposition, "protect", input);
  }
});

Deno.test("numeric classifier identifies transformable candidates", () => {
  const vectors: readonly [string, NumericConstructKind][] = [
    ["25%", "percentage"],
    ["25,5 %", "percentage"],
    ["12 km", "measurement"],
    ["12kg", "measurement"],
    ["20 °C", "measurement"],
    ["2 kPa", "measurement"],
    ["5 µm", "measurement"],
    ["9,81m/s", "measurement"],
    ["3 kg⋅m⋅s⁻²", "measurement"],
    ["5 m²", "measurement"],
    ["2m/(s⋅kg)", "measurement"],
    ["4(m/s)²", "measurement"],
    ["25 CAD", "currency"],
    ["25 GBP", "currency"],
    ["25 €", "currency"],
    ["€25", "currency"],
  ];

  for (const [input, kind] of vectors) {
    assert.equal(only(input, kind).disposition, "target", input);
  }
});

Deno.test("numeric classifier preserves documented negative vectors", () => {
  for (
    const input of [
      "20°",
      "%PATH%",
      "prix$variable",
      "25 eur",
      "12 kilogrammes",
      "12 Kg",
      "12 sec",
      "12 mps",
      "12 m/s/kg",
      "12 m·s",
      "12 m*s",
      "12 m^2",
      "12 m/(s/kg",
      "12 m/()",
      "12 m⁰",
      "1234",
      "arc-en-ciel",
    ]
  ) {
    assert.deepEqual(classifyNumericConstructs(input), [], input);
  }
});

Deno.test("numeric classifier returns sorted non-overlapping ranges", () => {
  const input = "À 12:30, 25% de 12 kg coûtent 25 CAD.";
  const matches = classifyNumericConstructs(input);

  assert.deepEqual(
    matches.map(({ kind }) => kind),
    ["time", "percentage", "measurement", "currency"],
  );
  for (let index = 1; index < matches.length; index++) {
    assert.ok(matches[index - 1].end <= matches[index].start);
  }
});

Deno.test("numeric protection remains stable across later transformations", () => {
  const result = runPipeline(
    "Version 1.2.3 . Bonjour , rendez-vous à 12:30 .",
    [NUMERIC_PROTECTION_RULE, ...SAFE_PUNCTUATION_RULES],
    { locale: "fr-FR" },
  );

  assert.equal(
    result.value,
    "Version 1.2.3. Bonjour, rendez-vous à 12:30.",
  );
  assert.deepEqual(
    result.segments.filter(({ protected: isProtected }) => isProtected).map(
      ({ value }) => value,
    ),
    ["1.2.3", "12:30"],
  );
});
