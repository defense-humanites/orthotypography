import { RULES } from "../catalogue/rules.ts";
import type { RuleApplication, RuleDefinition, RuntimeRule } from "../model.ts";

function documentaryDefinition(id: string): RuleDefinition {
  const definition = RULES.find((rule) => rule.id === id);
  if (definition === undefined) {
    throw new Error(`Missing documentary rule: ${id}`);
  }
  return definition;
}

function noSpaceBeforeRule(id: string, mark: "," | "."): RuntimeRule {
  const definition = documentaryDefinition(id);
  const pattern = mark === ","
    ? /[\t \u00a0\u202f]+,/gu
    : /[\t \u00a0\u202f]+\./gu;

  return {
    definition,
    apply(value, context): RuleApplication {
      const diagnostics = [...value.matchAll(pattern)].map((match) => ({
        start: match.index,
        end: match.index + match[0].length,
        message: `Unexpected whitespace before ${mark}`,
        replacement: mark,
      }));

      return {
        value: context.mode === "fix" ? value.replaceAll(pattern, mark) : value,
        diagnostics: diagnostics.length === 0 ? undefined : diagnostics,
      };
    },
  };
}

/** Safe low-punctuation rules available in the first executable lot. */
export const SAFE_PUNCTUATION_RULES: readonly RuntimeRule[] = [
  noSpaceBeforeRule("punctuation.comma.no-space-before", ","),
  noSpaceBeforeRule("punctuation.period.no-space-before", "."),
] as const;
