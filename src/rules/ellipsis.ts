import { RULES } from "../catalogue/rules.ts";
import { classifyEllipsisCandidates } from "../classify/ellipsis.ts";
import type { RuleDefinition, RuntimeRule } from "../model.ts";
import {
  defineRunRule,
  type LogicalRun,
  type RunDiagnostic,
  type RunEdit,
  type RunLocation,
  type RunRuleResult,
} from "../run.ts";
import { RunStretches } from "./run-text.ts";

const definition = RULES.find((rule) =>
  rule.id === "punctuation.ellipsis.after-etc.forbidden"
);
if (definition === undefined) {
  throw new Error(
    "Missing documentary rule: punctuation.ellipsis.after-etc.forbidden",
  );
}

const recognitionDefinition = RULES.find((rule) =>
  rule.id === "punctuation.ellipsis.glyph"
);
if (recognitionDefinition === undefined) {
  throw new Error("Missing documentary rule: punctuation.ellipsis.glyph");
}

const initialSpacingDefinition = RULES.find((rule) =>
  rule.id === "punctuation.ellipsis.initial.space-after"
);
if (initialSpacingDefinition === undefined) {
  throw new Error(
    "Missing documentary rule: punctuation.ellipsis.initial.space-after",
  );
}

/** Maximal unprotected text between protected ranges. */
interface Region {
  readonly start: number;
  readonly end: number;
  /** First and last stretch of the region. */
  readonly first: number;
  readonly last: number;
}

function unprotectedRegions(stretches: RunStretches): Region[] {
  const regions: Region[] = [];
  const count = stretches.starts.length;
  let index = 0;
  while (index < count) {
    if (stretches.protectedFlags[index]) {
      index++;
      continue;
    }
    const first = index;
    while (index + 1 < count && !stretches.protectedFlags[index + 1]) index++;
    regions.push({
      start: stretches.starts[first],
      end: stretches.ends[index],
      first,
      last: index,
    });
    index++;
  }
  return regions;
}

/**
 * Parts of `[start, end)` in each stretch, in text order. A stretch is one
 * fragment of the pipeline, so the parts are the fragment-local ranges that
 * the per-fragment rules reported.
 */
function stretchParts(
  stretches: RunStretches,
  start: number,
  end: number,
): RunLocation[] {
  const parts: RunLocation[] = [];
  for (
    let index = stretches.indexAt(start);
    index < stretches.starts.length && stretches.starts[index] < end;
    index++
  ) {
    const partStart = Math.max(start, stretches.starts[index]);
    const partEnd = Math.min(end, stretches.ends[index]);
    if (partStart < partEnd) parts.push({ start: partStart, end: partEnd });
  }
  return parts;
}

function result(
  run: LogicalRun,
  edits: readonly RunEdit[],
  diagnostics: readonly RunDiagnostic[],
): RunRuleResult {
  return {
    ...(run.mode === "fix" && edits.length > 0 ? { edits } : {}),
    ...(diagnostics.length > 0 ? { diagnostics } : {}),
  };
}

// The lookbehind of the original expression is checked separately, as the
// per-fragment rule did, so that the text before a node boundary is read one
// code unit at a time.
const forbiddenEtcEllipsis =
  /etc\.(?:[\t \u00a0\u202f]*…|[\t \u00a0\u202f]+\.{3,}|\.{2,})(?=$|[\t \u00a0\u202f)\]}»"'’!?;,:])/giu;
const wordCharacter = /[\p{L}\p{N}_]/u;

/** Whether a word character precedes `start`, as the fragment scan saw it. */
function wordBefore(stretches: RunStretches, start: number): boolean {
  if (start === 0) return false;
  const { text } = stretches;
  const stretch = stretches.indexAt(start);
  const stretchStart = stretches.starts[stretch];
  if (stretchStart === start) return wordCharacter.test(text[start - 1]);
  const unit = text.charCodeAt(start - 1);
  const first = unit >= 0xdc00 && unit <= 0xdfff ? start - 2 : start - 1;
  return wordCharacter.test(text.slice(Math.max(stretchStart, first), start));
}

/** Removes suspension points forbidden after the standalone abbreviation etc. */
export const ETC_ELLIPSIS_RULE: RuntimeRule = defineRunRule(
  definition as RuleDefinition,
  (run) => {
    const stretches = new RunStretches(run);
    const edits: RunEdit[] = [];
    const diagnostics: RunDiagnostic[] = [];
    for (const region of unprotectedRegions(stretches)) {
      const value = run.text.slice(region.start, region.end);
      forbiddenEtcEllipsis.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = forbiddenEtcEllipsis.exec(value)) !== null) {
        const start = region.start + match.index;
        if (wordBefore(stretches, start)) {
          forbiddenEtcEllipsis.lastIndex = match.index + 1;
          continue;
        }
        const end = start + match[0].length;
        const stretchEnd = stretches.ends[stretches.indexAt(start)];
        const removals = stretchParts(stretches, start + 4, end);
        for (const removal of removals) {
          edits.push({ ...removal, replacement: "" });
        }
        diagnostics.push({
          start,
          end: Math.min(start + 4, stretchEnd),
          message: "Suspension points must not follow etc.",
          related: removals.filter(({ start }) => start >= stretchEnd),
        });
      }
    }
    return result(run, edits, diagnostics);
  },
);

/** Certain ellipsis candidates of each unprotected region, in text order. */
function* regionCandidates(stretches: RunStretches) {
  for (const region of unprotectedRegions(stretches)) {
    const value = stretches.text.slice(region.start, region.end);
    for (
      const candidate of classifyEllipsisCandidates(value, region.start === 0)
    ) {
      yield {
        ...candidate,
        start: region.start + candidate.start,
        end: region.start + candidate.end,
        /** Code point after the candidate within its region, or 0. */
        next: value.codePointAt(candidate.end) ?? 0,
      };
    }
  }
}

/** Diagnoses certain ASCII ellipses and replaces their glyph in fix mode. */
export const ELLIPSIS_GLYPH_RULE: RuntimeRule = defineRunRule(
  recognitionDefinition as RuleDefinition,
  (run) => {
    const stretches = new RunStretches(run);
    const edits: RunEdit[] = [];
    const diagnostics: RunDiagnostic[] = [];
    for (const candidate of regionCandidates(stretches)) {
      if (candidate.value !== "..." || !candidate.certain) continue;
      const [primary, ...related] = stretchParts(
        stretches,
        candidate.start,
        candidate.end,
      );
      // The glyph replaces the first part, in the node where the ellipsis
      // starts; the other parts are removed from their nodes.
      edits.push({
        start: candidate.start,
        end: candidate.end,
        replacement: "…",
        bias: "left",
      });
      diagnostics.push({
        ...primary,
        message: `Use U+2026 for a recognized ${candidate.function} ellipsis`,
        ...(related.length === 0 ? {} : { related }),
      });
    }
    return result(run, edits, diagnostics);
  },
);

/** Compatibility alias for the original recognition-only export. */
export const ELLIPSIS_RECOGNITION_RULE = ELLIPSIS_GLYPH_RULE;

const letterOrMark = /[\p{L}\p{M}]/u;

/** Inserts a word space after a certain structurally initial ellipsis. */
export const ELLIPSIS_INITIAL_SPACE_AFTER_RULE: RuntimeRule = defineRunRule(
  initialSpacingDefinition as RuleDefinition,
  (run) => {
    const stretches = new RunStretches(run);
    const edits: RunEdit[] = [];
    const diagnostics: RunDiagnostic[] = [];
    for (const candidate of regionCandidates(stretches)) {
      if (
        candidate.value !== "…" || candidate.function !== "initial" ||
        !candidate.certain ||
        !letterOrMark.test(String.fromCodePoint(candidate.next))
      ) continue;
      // The space stays in the ellipsis's node.
      edits.push({
        start: candidate.end,
        end: candidate.end,
        replacement: " ",
        bias: "left",
      });
      diagnostics.push({
        start: candidate.start,
        end: candidate.end,
        message: "Insert a word space after a structurally initial ellipsis",
      });
    }
    return result(run, edits, diagnostics);
  },
);
