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

interface TextEdit {
  readonly start: number;
  readonly end: number;
  readonly replacement: string;
  readonly related?: readonly RuleApplicationSegmentEdit[];
}

const spacingCharacters = new Set(["\t", " ", "\u00a0", "\u202f"]);

function noSpaceBeforeRule(id: string, mark: "," | "."): RuntimeRule {
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
        const preceding = start === 0 ? precedingBoundary(context) : {
          blocked: false,
          character: value[start - 1],
          segmentEdits: [],
        };
        if (preceding.blocked) continue;
        const related = preceding.segmentEdits;
        if (start < markIndex || related.length > 0) {
          edits.push({
            start,
            end: markIndex + 1,
            replacement: mark,
            related,
          });
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
            message: `Unexpected whitespace before ${mark}`,
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

/** Safe low-punctuation rules available in the first executable lot. */
export const SAFE_PUNCTUATION_RULES: readonly RuntimeRule[] = [
  noSpaceBeforeRule("punctuation.comma.no-space-before", ","),
  noSpaceBeforeRule("punctuation.period.no-space-before", "."),
] as const;

interface BoundaryContext {
  readonly blocked: boolean;
  readonly character?: string;
  readonly segmentEdits: readonly RuleApplicationSegmentEdit[];
}

interface AdjacentCharacter {
  readonly blocked: boolean;
  readonly character?: string;
}

function characterBefore(value: string, index: number): string | undefined {
  if (index <= 0) return undefined;
  const finalUnit = value.charCodeAt(index - 1);
  const start = finalUnit >= 0xdc00 && finalUnit <= 0xdfff
    ? index - 2
    : index - 1;
  return value.slice(Math.max(0, start), index);
}

function characterAt(value: string, index: number): string | undefined {
  const codePoint = value.codePointAt(index);
  return codePoint === undefined ? undefined : String.fromCodePoint(codePoint);
}

function precedingCharacter(
  value: string,
  index: number,
  context: RuleContext,
): AdjacentCharacter {
  if (index > 0) {
    return { blocked: false, character: characterBefore(value, index) };
  }
  for (
    let segmentIndex = context.segmentIndex - 1;
    segmentIndex >= 0;
    segmentIndex--
  ) {
    const segment = context.segments[segmentIndex];
    if (segment.protected) return { blocked: true };
    if (segment.value.length > 0) {
      return {
        blocked: false,
        character: characterBefore(segment.value, segment.value.length),
      };
    }
  }
  return { blocked: false };
}

function followingCharacter(
  value: string,
  index: number,
  context: RuleContext,
): AdjacentCharacter {
  if (index < value.length) {
    return { blocked: false, character: characterAt(value, index) };
  }
  for (
    let segmentIndex = context.segmentIndex + 1;
    segmentIndex < context.segments.length;
    segmentIndex++
  ) {
    const segment = context.segments[segmentIndex];
    if (segment.protected) return { blocked: true };
    if (segment.value.length > 0) {
      return { blocked: false, character: characterAt(segment.value, 0) };
    }
  }
  return { blocked: false };
}

function logicalTokenBefore(
  value: string,
  end: number,
  context: RuleContext,
): string {
  let token = value.slice(0, end).match(/\S*$/u)?.[0] ?? "";
  if (token.length < end) return token;

  for (
    let segmentIndex = context.segmentIndex - 1;
    segmentIndex >= 0 && token.length < 256;
    segmentIndex--
  ) {
    const segment = context.segments[segmentIndex];
    if (segment.protected) break;
    const suffix = segment.value.match(/\S*$/u)?.[0] ?? "";
    token = suffix + token;
    if (suffix.length < segment.value.length) break;
  }
  return token;
}

function isTechnicalTokenBeforeComma(token: string): boolean {
  return /(?:[a-z][a-z0-9+.-]*:\/\/|www\.)\S*$/iu.test(token) ||
    /^(?:\.{0,2}\/)[^\s]*$/u.test(token);
}

const textOpeningCharacters = new Set([
  "(",
  "[",
  "{",
  '"',
  "'",
  "«",
  "“",
  "‘",
]);

function beginsText(character: string): boolean {
  return /[\p{L}\p{N}]/u.test(character) ||
    textOpeningCharacters.has(character);
}

/** Inserts the documented word space after commas in safe prose contexts. */
export const SPACE_AFTER_COMMA_RULE: RuntimeRule = {
  definition: documentaryDefinition("punctuation.comma.space-after"),
  apply(value, context): RuleApplication {
    const edits: TextEdit[] = [];

    for (let commaIndex = 0; commaIndex < value.length; commaIndex++) {
      if (value[commaIndex] !== ",") continue;

      const preceding = precedingCharacter(value, commaIndex, context);
      const following = followingCharacter(value, commaIndex + 1, context);
      if (preceding.blocked || following.blocked) continue;

      const previous = preceding.character;
      const next = following.character;
      if (next === undefined || /\s/u.test(next) || !beginsText(next)) continue;
      if (/\p{N}/u.test(previous ?? "") && /\p{N}/u.test(next)) continue;
      if (
        isTechnicalTokenBeforeComma(
          logicalTokenBefore(value, commaIndex, context),
        )
      ) continue;

      edits.push({
        start: commaIndex + 1,
        end: commaIndex + 1,
        replacement: " ",
      });
    }

    return {
      value: context.mode === "fix" ? applyEdits(value, edits) : value,
      edits,
      diagnostics: edits.length === 0
        ? undefined
        : edits.map(({ start, end, replacement }) => ({
          start,
          end,
          message: "Missing whitespace after comma",
          replacement,
        })),
    };
  },
};

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
  SPACE_AFTER_COMMA_RULE,
  ...HIGH_PUNCTUATION_RULES,
] as const;
