import { RULES } from "../catalogue/rules.ts";
import { NUMERIC_PROTECTION_RULE } from "../classify/runtime.ts";
import type {
  RuleApplication,
  RuleApplicationSegmentEdit,
  RuleContext,
  RuleDefinition,
  RuntimeRule,
} from "../model.ts";

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
      const edits = [...value.matchAll(pattern)].map((match) => ({
        start: match.index,
        end: match.index + match[0].length,
        replacement: mark,
      }));

      return {
        value: context.mode === "fix" ? value.replaceAll(pattern, mark) : value,
        edits,
        diagnostics: edits.length === 0
          ? undefined
          : edits.map(({ start, end, replacement }) => ({
            start,
            end,
            message: `Unexpected whitespace before ${mark}`,
            replacement,
          })),
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
  readonly related?: readonly RuleApplicationSegmentEdit[];
}

const spacingCharacters = new Set(["\t", " ", "\u00a0", "\u202f"]);

interface BoundaryContext {
  readonly blocked: boolean;
  readonly character?: string;
  readonly segmentEdits: readonly RuleApplicationSegmentEdit[];
}

function precedingBoundary(context: RuleContext): BoundaryContext {
  const segmentEdits: RuleApplicationSegmentEdit[] = [];
  for (
    let segmentIndex = context.segmentIndex - 1;
    segmentIndex >= 0;
    segmentIndex--
  ) {
    const segment = context.segments[segmentIndex];
    let end = segment.value.length;
    while (end > 0 && spacingCharacters.has(segment.value[end - 1])) end--;
    if (end < segment.value.length) {
      if (segment.protected) return { blocked: true, segmentEdits };
      segmentEdits.push({
        segmentIndex,
        start: end,
        end: segment.value.length,
        replacement: "",
      });
    }
    if (end > 0) {
      return {
        blocked: false,
        character: segment.value[end - 1],
        segmentEdits,
      };
    }
  }
  return { blocked: false, segmentEdits };
}

function followingBoundary(context: RuleContext): BoundaryContext {
  const segmentEdits: RuleApplicationSegmentEdit[] = [];
  for (
    let segmentIndex = context.segmentIndex + 1;
    segmentIndex < context.segments.length;
    segmentIndex++
  ) {
    const segment = context.segments[segmentIndex];
    let start = 0;
    while (
      start < segment.value.length &&
      spacingCharacters.has(segment.value[start])
    ) start++;
    if (start > 0) {
      if (segment.protected) return { blocked: true, segmentEdits };
      segmentEdits.push({
        segmentIndex,
        start: 0,
        end: start,
        replacement: "",
      });
    }
    if (start < segment.value.length) {
      return {
        blocked: false,
        character: segment.value[start],
        segmentEdits,
      };
    }
  }
  return { blocked: false, segmentEdits };
}

function logicalSuffix(
  value: string,
  start: number,
  context: RuleContext,
  length: number,
): string {
  let result = value.slice(start);
  for (
    let segmentIndex = context.segmentIndex + 1;
    result.length < length && segmentIndex < context.segments.length;
    segmentIndex++
  ) result += context.segments[segmentIndex].value;
  return result.slice(0, length);
}

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
      const segmentEdits: RuleApplicationSegmentEdit[] = [];

      for (let markIndex = 0; markIndex < value.length; markIndex++) {
        if (value[markIndex] !== mark) continue;

        let start = markIndex;
        while (start > 0 && spacingCharacters.has(value[start - 1])) start--;
        let end = markIndex + 1;
        while (end < value.length && spacingCharacters.has(value[end])) end++;

        const preceding = start === 0 ? precedingBoundary(context) : {
          blocked: false,
          character: value[start - 1],
          segmentEdits: [],
        };
        const following = end === value.length ? followingBoundary(context) : {
          blocked: false,
          character: value[end],
          segmentEdits: [],
        };
        if (preceding.blocked || following.blocked) continue;
        const previous = preceding.character;
        const next = following.character;
        if (previous === undefined) continue;
        if (
          mark === "!" &&
          /^!important\b/iu.test(logicalSuffix(value, markIndex, context, 11))
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
        const related = [
          ...preceding.segmentEdits,
          ...following.segmentEdits,
        ];
        if (
          value.slice(start, end) !== replacement ||
          related.length > 0
        ) {
          edits.push({ start, end, replacement, related });
          segmentEdits.push(...related);
        }
      }

      return {
        value: context.mode === "fix" ? applyEdits(value, edits) : value,
        edits,
        segmentEdits,
        diagnostics: edits.length === 0
          ? undefined
          : edits.map(({ start, end, replacement, related }) => ({
            start,
            end,
            message: `Unexpected spacing around ${mark}`,
            replacement,
            ...(related === undefined || related.length === 0 ? {} : {
              related: related.map(({ segmentIndex, start, end }) => ({
                segmentIndex,
                start,
                end,
              })),
            }),
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
