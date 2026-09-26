import { RULES } from "../catalogue/rules.ts";
import type {
  RuleApplication,
  RuleContext,
  RuleDefinition,
  RuntimeRule,
  TextSegment,
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

interface Pairing {
  /** Segment objects the pairing was computed from. */
  readonly snapshot: readonly TextSegment[];
  /** Absolute offset of each paired guillemet mapped to its partner. */
  readonly paired: ReadonlyMap<number, number>;
  /** Absolute start offset of each segment, then the total length. */
  readonly offsets: readonly number[];
}

// The pipeline calls a rule once per fragment with the same segment array.
// Pairing depends on the whole run, so it is computed once per distinct run
// and reused while the array still holds the same segment objects.
const pairingCache = new WeakMap<readonly TextSegment[], Pairing>();

function computePairing(segments: readonly TextSegment[]): Pairing {
  const offsets = new Array<number>(segments.length + 1);
  offsets[0] = 0;
  for (let index = 0; index < segments.length; index++) {
    offsets[index + 1] = offsets[index] + segments[index].value.length;
  }
  const source = segments.map(({ value }) => value).join("");
  const paired = new Map<number, number>();
  const openings: number[] = [];

  for (const [segmentIndex, segment] of segments.entries()) {
    if (segment.protected) continue;
    for (let index = 0; index < segment.value.length; index++) {
      const character = segment.value[index];
      const absoluteIndex = offsets[segmentIndex] + index;
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
  return { snapshot: [...segments], paired, offsets };
}

function pairingFor(context: RuleContext): Pairing {
  const segments = context.segments;
  const cached = pairingCache.get(segments);
  if (
    cached !== undefined && cached.snapshot.length === segments.length &&
    cached.snapshot.every((segment, index) => segment === segments[index])
  ) return cached;
  const pairing = computePairing(segments);
  pairingCache.set(segments, pairing);
  return pairing;
}

function locateOffset(
  pairing: Pairing,
  absoluteOffset: number,
): { segmentIndex: number; start: number; end: number } {
  const { offsets } = pairing;
  let low = 0;
  let high = offsets.length - 2;
  while (low <= high) {
    const middle = (low + high) >>> 1;
    if (absoluteOffset < offsets[middle]) high = middle - 1;
    else if (absoluteOffset >= offsets[middle + 1]) low = middle + 1;
    else {
      const start = absoluteOffset - offsets[middle];
      return { segmentIndex: middle, start, end: start + 1 };
    }
  }
  throw new Error(`Unlocatable paired quote offset: ${absoluteOffset}`);
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
    const pairing = pairingFor(context);
    const paired = pairing.paired;
    const offset = pairing.offsets[context.segmentIndex];
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
            related: locateOffset(pairing, pairedOffset),
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
            related: locateOffset(pairing, pairedOffset),
          });
        }
      }
    }

    return {
      value: context.mode === "fix" ? applyEdits(value, edits) : value,
      edits,
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
