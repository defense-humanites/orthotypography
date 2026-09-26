import assert from "node:assert/strict";
import { SAFE_PUNCTUATION_RULES } from "../src/mod.ts";
import type { RuntimeRule } from "../src/model.ts";
import {
  checkInvariants,
  COMPOSITIONS,
  generateNodes,
  KNOWN_VIOLATIONS,
  seededRandom,
} from "./support/invariants.ts";

const SEED = 20260926;
const INPUTS_PER_COMPOSITION = 400;

function unexpectedViolations(
  composition: string,
  violations: readonly string[],
): string[] {
  return violations.filter((violation) =>
    !KNOWN_VIOLATIONS.some((known) =>
      known.compositions.includes(composition) && known.pattern.test(violation)
    )
  );
}

for (const composition of COMPOSITIONS) {
  Deno.test(`pipeline invariants hold for ${composition.name}`, () => {
    const random = seededRandom(SEED);
    const violations: string[] = [];
    for (let index = 0; index < INPUTS_PER_COMPOSITION; index++) {
      violations.push(
        ...unexpectedViolations(
          composition.name,
          checkInvariants(composition.rules, generateNodes(random)),
        ),
      );
    }
    assert.deepEqual(violations.slice(0, 5), []);
  });
}

Deno.test("known invariant violations still reproduce until fixed", () => {
  for (const known of KNOWN_VIOLATIONS) {
    for (const name of known.compositions) {
      const composition = COMPOSITIONS.find((candidate) =>
        candidate.name === name
      );
      assert.ok(composition, `unknown composition ${name}`);
      assert.ok(
        checkInvariants(composition.rules, known.example).some((violation) =>
          known.pattern.test(violation)
        ),
        `issue #${known.issue} no longer reproduces for ${name}; remove its entry`,
      );
    }
  }
});

function brokenRule(
  id: string,
  apply: RuntimeRule["apply"],
): RuntimeRule {
  return {
    definition: { ...SAFE_PUNCTUATION_RULES[0].definition, id },
    apply,
  };
}

Deno.test("the harness detects a rule that is not idempotent", () => {
  const rule = brokenRule("test.append", (value, context) => {
    if (context.mode !== "fix") {
      return {
        value,
        diagnostics: [{ start: value.length, end: value.length, message: "x" }],
      };
    }
    return {
      value: `${value}!`,
      edits: [{ start: value.length, end: value.length, replacement: "!" }],
    };
  });
  const violations = checkInvariants([rule], [{ id: "a", value: "Oui" }]);
  assert.ok(violations.some((violation) => /not idempotent/.test(violation)));
});

Deno.test("the harness detects a nondeterministic rule", () => {
  let calls = 0;
  const rule = brokenRule("test.counter", (value) => ({
    value,
    diagnostics: [{ start: 0, end: 0, message: `call ${++calls}` }],
  }));
  const violations = checkInvariants([rule], [{ id: "a", value: "Oui" }]);
  assert.ok(
    violations.some((violation) => /not deterministic/.test(violation)),
  );
});

Deno.test("the harness detects a fix without a lint diagnostic", () => {
  const rule = brokenRule(
    "test.silent",
    (value, context) =>
      context.mode === "fix" && value === "Oui"
        ? { value: "Non", edits: [{ start: 0, end: 3, replacement: "Non" }] }
        : { value },
  );
  const violations = checkInvariants([rule], [{ id: "a", value: "Oui" }]);
  assert.ok(
    violations.some((violation) => /has no lint diagnostic/.test(violation)),
  );
});
