import { RULES } from "../catalogue/rules.ts";
import type {
  RuleApplication,
  RuleApplicationEdit,
  RuleApplicationSegmentEdit,
  RuleContext,
  RuleDefinition,
  RuntimeRule,
} from "../model.ts";

const definition = RULES.find((rule) =>
  rule.id === "punctuation.ellipsis.after-etc.forbidden"
);
if (definition === undefined) {
  throw new Error(
    "Missing documentary rule: punctuation.ellipsis.after-etc.forbidden",
  );
}

interface LogicalPart {
  readonly segmentIndex: number;
  readonly start: number;
  readonly end: number;
}

interface LogicalRun {
  readonly value: string;
  readonly parts: readonly LogicalPart[];
}

interface MatchEdits {
  readonly local: readonly RuleApplicationEdit[];
  readonly related: readonly RuleApplicationSegmentEdit[];
}

const forbiddenEtcEllipsis =
  /(?<![\p{L}\p{N}_])etc\.(?:[\t \u00a0\u202f]*…|[\t \u00a0\u202f]+\.{3,}|\.{2,})(?=$|[\t \u00a0\u202f)\]}»"'’!?;,:])/giu;

function logicalRun(context: RuleContext): LogicalRun {
  const parts: LogicalPart[] = [];
  let value = "";

  for (
    let segmentIndex = context.segmentIndex;
    segmentIndex < context.segments.length;
    segmentIndex++
  ) {
    const segment = context.segments[segmentIndex];
    if (segment.protected) break;
    const start = value.length;
    value += segment.value;
    parts.push({ segmentIndex, start, end: value.length });
  }

  return { value, parts };
}

function precedingCharacter(context: RuleContext): string | undefined {
  for (
    let segmentIndex = context.segmentIndex - 1;
    segmentIndex >= 0;
    segmentIndex--
  ) {
    const value = context.segments[segmentIndex].value;
    if (value.length > 0) return value.at(-1);
  }
  return undefined;
}

function splitRemoval(
  context: RuleContext,
  parts: readonly LogicalPart[],
  start: number,
  end: number,
): MatchEdits {
  const local: RuleApplicationEdit[] = [];
  const related: RuleApplicationSegmentEdit[] = [];

  for (const part of parts) {
    const overlapStart = Math.max(start, part.start);
    const overlapEnd = Math.min(end, part.end);
    if (overlapStart >= overlapEnd) continue;

    const edit = {
      start: overlapStart - part.start,
      end: overlapEnd - part.start,
      replacement: "",
    };
    if (part.segmentIndex === context.segmentIndex) {
      local.push(edit);
    } else {
      related.push({ segmentIndex: part.segmentIndex, ...edit });
    }
  }

  return { local, related };
}

function applyEdits(
  value: string,
  edits: readonly RuleApplicationEdit[],
): string {
  let result = value;
  for (
    const edit of [...edits].sort((left, right) => right.start - left.start)
  ) {
    result = result.slice(0, edit.start) + edit.replacement +
      result.slice(edit.end);
  }
  return result;
}

/** Removes suspension points forbidden after the standalone abbreviation etc. */
export const ETC_ELLIPSIS_RULE: RuntimeRule = {
  definition: definition as RuleDefinition,
  apply(value, context): RuleApplication {
    const run = logicalRun(context);
    const localEdits: RuleApplicationEdit[] = [];
    const segmentEdits: RuleApplicationSegmentEdit[] = [];
    const diagnostics = [];

    for (const match of run.value.matchAll(forbiddenEtcEllipsis)) {
      const start = match.index;
      if (start >= value.length) continue;
      if (
        start === 0 &&
        /[\p{L}\p{N}_]/u.test(precedingCharacter(context) ?? "")
      ) {
        continue;
      }

      const removalStart = start + 4;
      const removalEnd = start + match[0].length;
      const edits = splitRemoval(
        context,
        run.parts,
        removalStart,
        removalEnd,
      );
      localEdits.push(...edits.local);
      segmentEdits.push(...edits.related);
      diagnostics.push({
        start,
        end: Math.min(start + 4, value.length),
        message: "Suspension points must not follow etc.",
        related: edits.related.map(({ segmentIndex, start, end }) => ({
          segmentIndex,
          start,
          end,
        })),
      });
    }

    return {
      value: context.mode === "fix" ? applyEdits(value, localEdits) : value,
      edits: localEdits,
      segmentEdits,
      diagnostics: diagnostics.length === 0 ? undefined : diagnostics,
    };
  },
};
