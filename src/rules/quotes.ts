import { RULES } from "../catalogue/rules.ts";
import type {
  RuleApplication,
  RuleContext,
  RuleDefinition,
  RuntimeRule,
} from "../model.ts";

interface TextEdit {
  readonly start: number;
  readonly end: number;
  readonly replacement: string;
  readonly related: {
    readonly segmentIndex: number;
    readonly start: number;
    readonly end: number;
  };
}

const spacingCharacters = new Set(["\t", " ", "\u00a0", "\u202f"]);

const definition = RULES.find((rule) => rule.id === "quotes.french.nbsp-inner");
if (definition === undefined) {
  throw new Error("Missing documentary rule: quotes.french.nbsp-inner");
}

function pairedOffsets(context: RuleContext): ReadonlyMap<number, number> {
  const source = context.segments.map(({ value }) => value).join("");
  const paired = new Map<number, number>();
  const openings: number[] = [];
  let offset = 0;

  for (const segment of context.segments) {
    if (!segment.protected) {
      for (let index = 0; index < segment.value.length; index++) {
        const character = segment.value[index];
        const absoluteIndex = offset + index;
        if (character === "«") {
          openings.push(absoluteIndex);
        } else if (character === "»") {
          const opening = openings.pop();
          if (
            opening !== undefined &&
            source.slice(opening + 1, absoluteIndex).trim().length > 0
          ) {
            paired.set(opening, absoluteIndex);
            paired.set(absoluteIndex, opening);
          }
        }
      }
    }
    offset += segment.value.length;
  }
  return paired;
}

function locateOffset(
  context: RuleContext,
  absoluteOffset: number,
): { segmentIndex: number; start: number; end: number } {
  let offset = 0;
  for (
    let segmentIndex = 0;
    segmentIndex < context.segments.length;
    segmentIndex++
  ) {
    const segment = context.segments[segmentIndex];
    if (absoluteOffset < offset + segment.value.length) {
      const start = absoluteOffset - offset;
      return { segmentIndex, start, end: start + 1 };
    }
    offset += segment.value.length;
  }
  throw new Error(`Unlocatable paired quote offset: ${absoluteOffset}`);
}

function segmentOffset(context: RuleContext): number {
  return context.segments.slice(0, context.segmentIndex).reduce(
    (length, segment) => length + segment.value.length,
    0,
  );
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

/** Spaces paired French guillemets without converting ambiguous quote glyphs. */
export const FRENCH_GUILLEMETS_SPACING_RULE: RuntimeRule = {
  definition: definition as RuleDefinition,
  apply(value, context): RuleApplication {
    const paired = pairedOffsets(context);
    const offset = segmentOffset(context);
    const edits: TextEdit[] = [];

    for (let index = 0; index < value.length; index++) {
      const character = value[index];
      const pairedOffset = paired.get(offset + index);
      if (pairedOffset === undefined) continue;

      if (character === "«") {
        let end = index + 1;
        while (end < value.length && spacingCharacters.has(value[end])) end++;
        if (value.slice(index + 1, end) !== "\u00a0") {
          edits.push({
            start: index + 1,
            end,
            replacement: "\u00a0",
            related: locateOffset(context, pairedOffset),
          });
        }
      } else if (character === "»") {
        let start = index;
        while (start > 0 && spacingCharacters.has(value[start - 1])) start--;
        if (value.slice(start, index) !== "\u00a0") {
          edits.push({
            start,
            end: index,
            replacement: "\u00a0",
            related: locateOffset(context, pairedOffset),
          });
        }
      }
    }

    return {
      value: context.mode === "fix" ? applyEdits(value, edits) : value,
      diagnostics: edits.length === 0
        ? undefined
        : edits.map(({ start, end, replacement, related }) => ({
          start,
          end,
          message: "Expected a no-break space inside paired French guillemets",
          replacement,
          related: [related],
        })),
    };
  },
};
