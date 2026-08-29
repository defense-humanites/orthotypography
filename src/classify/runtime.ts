import { RULES } from "../catalogue/rules.ts";
import type { RuleDefinition, RuntimeRule } from "../model.ts";
import { classifyNumericConstructs } from "./numeric.ts";

const definition = RULES.find((rule) =>
  rule.id === "classify.numeric-constructs"
);
if (definition === undefined) {
  throw new Error("Missing documentary rule: classify.numeric-constructs");
}

/** Pipeline rule that turns protected numeric contexts into stable segments. */
export const NUMERIC_PROTECTION_RULE: RuntimeRule = {
  definition: definition as RuleDefinition,
  apply(value) {
    return {
      value,
      protections: classifyNumericConstructs(value)
        .filter(({ disposition }) => disposition === "protect")
        .map(({ start, end }) => ({ start, end })),
    };
  },
};
