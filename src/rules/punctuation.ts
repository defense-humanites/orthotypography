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

type HighPunctuationMark = ":" | ";" | "?" | "!";

interface HighPunctuationContext {
  readonly start: number;
  readonly end: number;
  readonly preceding: BoundaryContext;
  readonly following: BoundaryContext;
  readonly previous?: string;
  readonly next?: string;
}

function inspectHighPunctuation(
  value: string,
  markIndex: number,
  context: RuleContext,
): HighPunctuationContext {
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

  return {
    start,
    end,
    preceding,
    following,
    previous: preceding.character,
    next: following.character,
  };
}

function excludesHighPunctuation(
  value: string,
  markIndex: number,
  context: RuleContext,
  mark: HighPunctuationMark,
  inspected: HighPunctuationContext,
): boolean {
  const { preceding, following, previous, next } = inspected;
  if (preceding.blocked || following.blocked || previous === undefined) {
    return true;
  }
  if (
    mark === "!" &&
    /^!important\b/iu.test(logicalSuffix(value, markIndex, context, 11))
  ) return true;
  if (previous === mark || next === mark) return true;
  if (mark === ":" && (previous === ":" || next === ":" || next === "/")) {
    return true;
  }
  return (mark === "?" || mark === "!") &&
    ((previous !== undefined && "?!".includes(previous)) ||
      (next !== undefined && "?!".includes(next)));
}

const highPunctuationOrder = new Map<HighPunctuationMark, number>([
  [":", 0],
  [";", 1],
  ["?", 2],
  ["!", 3],
]);

function isHighPunctuationMark(value?: string): value is HighPunctuationMark {
  return value !== undefined && highPunctuationOrder.has(
    value as HighPunctuationMark,
  );
}

function highPunctuationRank(mark: HighPunctuationMark): number {
  return highPunctuationOrder.get(mark) ?? -1;
}

interface PunctuationLocation {
  readonly value: string;
  readonly index: number;
  readonly context: RuleContext;
}

function precedingPunctuationLocation(
  value: string,
  start: number,
  context: RuleContext,
): PunctuationLocation | undefined {
  if (start > 0) return { value, index: start - 1, context };
  for (
    let segmentIndex = context.segmentIndex - 1;
    segmentIndex >= 0;
    segmentIndex--
  ) {
    const segment = context.segments[segmentIndex];
    if (segment.protected) return undefined;
    let index = segment.value.length;
    while (index > 0 && spacingCharacters.has(segment.value[index - 1])) {
      index--;
    }
    if (index > 0) {
      return {
        value: segment.value,
        index: index - 1,
        context: { ...context, segmentIndex },
      };
    }
  }
  return undefined;
}

function followingPunctuationLocation(
  value: string,
  end: number,
  context: RuleContext,
): PunctuationLocation | undefined {
  if (end < value.length) return { value, index: end, context };
  for (
    let segmentIndex = context.segmentIndex + 1;
    segmentIndex < context.segments.length;
    segmentIndex++
  ) {
    const segment = context.segments[segmentIndex];
    if (segment.protected) return undefined;
    let index = 0;
    while (
      index < segment.value.length &&
      spacingCharacters.has(segment.value[index])
    ) index++;
    if (index < segment.value.length) {
      return {
        value: segment.value,
        index,
        context: { ...context, segmentIndex },
      };
    }
  }
  return undefined;
}

function punctuationLocationIsExcluded(
  location: PunctuationLocation,
  mark: HighPunctuationMark,
): boolean {
  const inspected = inspectHighPunctuation(
    location.value,
    location.index,
    location.context,
  );
  return excludesHighPunctuation(
    location.value,
    location.index,
    location.context,
    mark,
    inspected,
  );
}

function highPunctuationBeforeRule(
  id: string,
  mark: HighPunctuationMark,
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
        const inspected = inspectHighPunctuation(value, markIndex, context);
        if (
          excludesHighPunctuation(value, markIndex, context, mark, inspected)
        ) continue;
        if (isHighPunctuationMark(inspected.previous)) {
          const previous = precedingPunctuationLocation(
            value,
            inspected.start,
            context,
          );
          if (
            previous !== undefined &&
            highPunctuationRank(inspected.previous) >
              highPunctuationRank(mark) &&
            !punctuationLocationIsExcluded(previous, inspected.previous)
          ) continue;
        }

        const related = inspected.preceding.segmentEdits;
        if (
          value.slice(inspected.start, markIndex) !== before || related.length
        ) {
          edits.push({
            start: inspected.start,
            end: markIndex,
            replacement: before,
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

function highPunctuationAfterRule(
  id: string,
  mark: HighPunctuationMark,
): RuntimeRule {
  const definition = documentaryDefinition(id);

  return {
    definition,
    apply(value, context): RuleApplication {
      const edits: TextEdit[] = [];
      const segmentEdits: RuleApplicationSegmentEdit[] = [];

      for (let markIndex = 0; markIndex < value.length; markIndex++) {
        if (value[markIndex] !== mark) continue;
        const inspected = inspectHighPunctuation(value, markIndex, context);
        if (
          excludesHighPunctuation(value, markIndex, context, mark, inspected)
        ) continue;
        if (isHighPunctuationMark(inspected.next)) {
          const next = followingPunctuationLocation(
            value,
            inspected.end,
            context,
          );
          if (
            next !== undefined &&
            highPunctuationRank(inspected.next) > highPunctuationRank(mark) &&
            !punctuationLocationIsExcluded(next, inspected.next)
          ) continue;
        }

        const replacement = inspected.next === undefined ? "" : " ";
        const related = inspected.following.segmentEdits;
        if (
          value.slice(markIndex + 1, inspected.end) !== replacement ||
          related.length > 0
        ) {
          edits.push({
            start: markIndex + 1,
            end: inspected.end,
            replacement,
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
            message: `Unexpected whitespace after ${mark}`,
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
  highPunctuationBeforeRule("punctuation.colon.nbsp-before", ":", "\u00a0"),
  highPunctuationAfterRule("punctuation.colon.space-after", ":"),
  highPunctuationBeforeRule(
    "punctuation.semicolon.nnbsp-before",
    ";",
    "\u202f",
  ),
  highPunctuationAfterRule("punctuation.semicolon.space-after", ";"),
  highPunctuationBeforeRule(
    "punctuation.question.nnbsp-before",
    "?",
    "\u202f",
  ),
  highPunctuationAfterRule("punctuation.question.space-after", "?"),
  highPunctuationBeforeRule(
    "punctuation.exclamation.nnbsp-before",
    "!",
    "\u202f",
  ),
  highPunctuationAfterRule("punctuation.exclamation.space-after", "!"),
] as const;

/** Imprimerie nationale punctuation composition with numeric protections. */
export const IMPRIMERIE_NATIONALE_PUNCTUATION_RULES: readonly RuntimeRule[] = [
  NUMERIC_PROTECTION_RULE,
  ...SAFE_PUNCTUATION_RULES,
  SPACE_AFTER_COMMA_RULE,
  ...HIGH_PUNCTUATION_RULES,
] as const;
