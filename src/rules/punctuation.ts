import { RULES } from "../catalogue/rules.ts";
import { NUMERIC_PROTECTION_RULE } from "../classify/runtime.ts";
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

interface TextEdit {
  readonly start: number;
  readonly end: number;
  readonly replacement: string;
}

const spacingCharacters = new Set(["\t", " ", "\u00a0", "\u202f"]);

function applyEdits(value: string, edits: readonly TextEdit[]): string {
  let result = value;
  for (
    const edit of [...edits].sort((left, right) => right.start - left.start)
  ) {
    result = result.slice(0, edit.start) + edit.replacement +
      result.slice(edit.end);
  }
  return result;
}

function highPunctuationRule(
  id: string,
  mark: ":" | ";" | "?" | "!",
  before: "\u00a0" | "\u202f",
): RuntimeRule {
  const definition = documentaryDefinition(id);

  return {
    definition,
    apply(value, context): RuleApplication {
      const edits: TextEdit[] = [];

      for (let markIndex = 0; markIndex < value.length; markIndex++) {
        if (value[markIndex] !== mark) continue;

        let start = markIndex;
        while (start > 0 && spacingCharacters.has(value[start - 1])) start--;
        let end = markIndex + 1;
        while (end < value.length && spacingCharacters.has(value[end])) end++;

        const previous = value[start - 1];
        const next = value[end];
        if (previous === undefined) continue;
        if (
          mark === "!" &&
          /^!important\b/iu.test(value.slice(markIndex))
        ) continue;
        if (previous === mark || next === mark) continue;
        if (
          mark === ":" && (previous === ":" || next === ":" || next === "/")
        ) {
          continue;
        }
        if (
          (mark === "?" || mark === "!") &&
          ((previous !== undefined && "?!".includes(previous)) ||
            (next !== undefined && "?!".includes(next)))
        ) {
          continue;
        }

        const replacement = `${before}${mark}${next === undefined ? "" : " "}`;
        if (value.slice(start, end) !== replacement) {
          edits.push({ start, end, replacement });
        }
      }

      return {
        value: context.mode === "fix" ? applyEdits(value, edits) : value,
        diagnostics: edits.length === 0
          ? undefined
          : edits.map(({ start, end, replacement }) => ({
            start,
            end,
            message: `Unexpected spacing around ${mark}`,
            replacement,
          })),
      };
    },
  };
}

/** Context-sensitive French high-punctuation rules. */
export const HIGH_PUNCTUATION_RULES: readonly RuntimeRule[] = [
  highPunctuationRule("punctuation.colon.nbsp-before", ":", "\u00a0"),
  highPunctuationRule("punctuation.semicolon.nnbsp-before", ";", "\u202f"),
  highPunctuationRule("punctuation.question.nnbsp-before", "?", "\u202f"),
  highPunctuationRule("punctuation.exclamation.nnbsp-before", "!", "\u202f"),
] as const;

/** Imprimerie nationale punctuation composition with numeric protections. */
export const IMPRIMERIE_NATIONALE_PUNCTUATION_RULES: readonly RuntimeRule[] = [
  NUMERIC_PROTECTION_RULE,
  ...SAFE_PUNCTUATION_RULES,
  ...HIGH_PUNCTUATION_RULES,
] as const;
