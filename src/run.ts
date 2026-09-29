import type {
  ApplicationDiagnosticLocation,
  ProtectionRange,
  RuleApplicationEdit,
  RuleDefinition,
  RuleMode,
  RuntimeRule,
} from "./model.ts";

/**
 * Internal execution of rules on the whole logical run.
 *
 * See docs/conception-suite-logique-v0.1.md. These types stay internal until
 * the public rule interface switches in the 0.2 line; until then, migrated
 * rules keep the public RuntimeRule shape and carry their run implementation
 * under a private symbol.
 */

/** Half-open range in run coordinates. */
export interface RunRange {
  readonly start: number;
  readonly end: number;
}

/** Side that receives text at a boundary between nodes. */
export type RunBias = "left" | "right";

/** Replacement proposed by a rule in run coordinates. */
export interface RunEdit extends RunRange {
  readonly replacement: string;
  /** Node receiving the replacement at or across a node boundary. */
  readonly bias?: RunBias;
}

/** Diagnostic subject in run coordinates. */
export interface RunLocation extends RunRange {
  /** Node reporting an empty location placed at a node boundary. */
  readonly bias?: RunBias;
}

export interface RunDiagnostic extends RunLocation {
  readonly message: string;
  readonly replacement?: string;
  readonly related?: readonly RunLocation[];
}

/** Typed classification result attached to a range of the run. */
export interface Annotation extends RunRange {
  readonly kind: string;
  /** The range becomes protected for every later rule. */
  readonly protect?: boolean;
  readonly data?: Readonly<Record<string, string>>;
}

/** Read-only view of one logical run, built once per rule. */
export interface LogicalRun {
  readonly text: string;
  readonly locale: string;
  readonly mode: RuleMode;
  /** Sorted, disjoint protected ranges. */
  readonly protectedRanges: readonly RunRange[];
  /** Start offset of each source node, followed by the text length. */
  readonly nodeBoundaries: readonly number[];
  annotations(kind: string): readonly Annotation[];
}

export interface RunRuleResult {
  readonly edits?: readonly RunEdit[];
  readonly diagnostics?: readonly RunDiagnostic[];
  readonly annotations?: readonly Annotation[];
}

const runApply: unique symbol = Symbol("orthotypography.runApply");

interface RunRule extends RuntimeRule {
  readonly [runApply]: (run: LogicalRun) => RunRuleResult;
}

/** Declares a rule executed once per logical run by the pipeline. */
export function defineRunRule(
  definition: RuleDefinition,
  apply: (run: LogicalRun) => RunRuleResult,
): RuntimeRule {
  const rule: RunRule = {
    definition,
    apply() {
      throw new Error(
        `Rule ${definition.id} runs on the logical run; use runPipeline`,
      );
    },
    [runApply]: apply,
  };
  return rule;
}

/** Returns the run implementation of a rule, if it has one. */
export function runImplementation(
  rule: RuntimeRule,
): ((run: LogicalRun) => RunRuleResult) | undefined {
  return (rule as Partial<RunRule>)[runApply];
}

/** Current pipeline fragment as seen by the run machinery. */
export interface RunFragment {
  readonly value: string;
  readonly protected?: boolean;
  readonly sourceIndex: number;
}

/** A run view with the fragment layout needed to project results. */
export interface RunLayout {
  readonly run: LogicalRun;
  /** Start offset of each fragment, followed by the text length. */
  readonly starts: readonly number[];
}

/** Builds the view of the current fragments for one rule. */
export function buildRun(
  fragments: readonly RunFragment[],
  locale: string,
  mode: RuleMode,
): RunLayout {
  const starts = new Array<number>(fragments.length + 1);
  starts[0] = 0;
  for (let index = 0; index < fragments.length; index++) {
    starts[index + 1] = starts[index] + fragments[index].value.length;
  }
  const protectedRanges: RunRange[] = [];
  const nodeBoundaries: number[] = [];
  for (const [index, fragment] of fragments.entries()) {
    if (
      index === 0 || fragments[index - 1].sourceIndex !== fragment.sourceIndex
    ) {
      nodeBoundaries.push(starts[index]);
    }
    if (!fragment.protected || fragment.value.length === 0) continue;
    const previous = protectedRanges.at(-1);
    if (previous !== undefined && previous.end === starts[index]) {
      protectedRanges[protectedRanges.length - 1] = {
        start: previous.start,
        end: starts[index + 1],
      };
    } else {
      protectedRanges.push({ start: starts[index], end: starts[index + 1] });
    }
  }
  nodeBoundaries.push(starts[fragments.length]);
  const text = fragments.map(({ value }) => value).join("");
  return {
    starts,
    run: {
      text,
      locale,
      mode,
      protectedRanges,
      nodeBoundaries,
      annotations: () => [],
    },
  };
}

/** Index of the first fragment whose end is at or after a position. */
function firstFragmentEndingAtOrAfter(
  starts: readonly number[],
  position: number,
): number {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (starts[middle + 1] < position) low = middle + 1;
    else high = middle;
  }
  return low;
}

/**
 * Fragment receiving an empty range at a position.
 *
 * A fragment strictly containing the position receives it. At a boundary, the
 * last non-empty fragment ending there (`left`) or the first non-empty one
 * starting there (`right`) receives it, so that text inserted next to a
 * character stays in that character's node. When `edit` is set, a protected
 * fragment on the chosen side makes the position unusable. At the start or end
 * of the run, the other side is used. Empty unprotected fragments receive the
 * range only when no non-empty fragment touches the position, which happens
 * when the run text is empty.
 */
function fragmentAtPosition(
  fragments: readonly RunFragment[],
  starts: readonly number[],
  position: number,
  bias: RunBias,
  edit: boolean,
): number | undefined {
  const first = firstFragmentEndingAtOrAfter(starts, position);
  if (starts[first] < position && position < starts[first + 1]) {
    return edit && fragments[first].protected ? undefined : first;
  }
  const side = (
    direction: RunBias,
    allowEmpty: boolean,
  ): number | undefined | null => {
    let chosen: number | undefined;
    for (
      let index = first;
      index < fragments.length && starts[index] <= position;
      index++
    ) {
      const fragment = fragments[index];
      if (
        fragment.value.length === 0 && (fragment.protected || !allowEmpty)
      ) continue;
      const touches = direction === "left"
        ? starts[index + 1] === position
        : starts[index] === position;
      if (!touches) continue;
      chosen = index;
      if (direction === "right") break;
    }
    if (chosen === undefined) return undefined;
    return edit && fragments[chosen].protected ? null : chosen;
  };
  const other = bias === "left" ? "right" : "left";
  for (const allowEmpty of [false, true]) {
    const preferred = side(bias, allowEmpty);
    if (preferred !== undefined) return preferred ?? undefined;
    const fallback = side(other, allowEmpty);
    if (fallback !== undefined) return fallback ?? undefined;
  }
  return undefined;
}

function isInsideProtected(
  ranges: readonly RunRange[],
  start: number,
  end: number,
): boolean {
  return ranges.some((range) =>
    start === end
      ? range.start < start && start < range.end
      : range.start < end && start < range.end
  );
}

/**
 * Validates a rule's edits and projects them onto fragments.
 *
 * An edit inside one fragment maps to it. An edit crossing fragments deletes
 * each overlapping part and places the whole replacement in the first
 * (`left`, default) or last (`right`) fragment. An empty edit at a boundary
 * goes to the unprotected fragment on the `bias` side.
 */
export function projectRunEdits(
  ruleId: string,
  fragments: readonly RunFragment[],
  layout: RunLayout,
  edits: readonly RunEdit[],
): Map<number, RuleApplicationEdit[]> {
  const { starts, run } = layout;
  const ordered = [...edits].sort((left, right) =>
    left.start - right.start || left.end - right.end
  );
  const projected = new Map<number, RuleApplicationEdit[]>();
  const add = (index: number, edit: RuleApplicationEdit): void => {
    const list = projected.get(index) ?? [];
    list.push(edit);
    projected.set(index, list);
  };

  for (const [position, edit] of ordered.entries()) {
    if (
      !Number.isInteger(edit.start) || !Number.isInteger(edit.end) ||
      edit.start < 0 || edit.end < edit.start || edit.end > run.text.length
    ) {
      throw new Error(
        `Rule ${ruleId} returned an invalid edit range: ${edit.start}:${edit.end}`,
      );
    }
    const previous = ordered[position - 1];
    if (
      previous !== undefined &&
      (edit.start < previous.end || edit.start === previous.start)
    ) {
      throw new Error(`Rule ${ruleId} returned overlapping edits`);
    }
    if (isInsideProtected(run.protectedRanges, edit.start, edit.end)) {
      throw new Error(`Rule ${ruleId} edits protected text`);
    }
    const bias = edit.bias ?? "left";

    if (edit.start === edit.end) {
      const index = fragmentAtPosition(
        fragments,
        starts,
        edit.start,
        bias,
        true,
      );
      if (index === undefined) {
        throw new Error(`Rule ${ruleId} inserts next to protected text`);
      }
      const local = edit.start - starts[index];
      add(index, { start: local, end: local, replacement: edit.replacement });
      continue;
    }

    const touched: number[] = [];
    for (
      let index = firstFragmentEndingAtOrAfter(starts, edit.start + 1);
      index < fragments.length && starts[index] < edit.end;
      index++
    ) {
      if (starts[index + 1] > edit.start && starts[index] < starts[index + 1]) {
        touched.push(index);
      }
    }
    const receiver = bias === "left" ? touched[0] : touched.at(-1);
    for (const index of touched) {
      const start = Math.max(edit.start, starts[index]) - starts[index];
      const end = Math.min(edit.end, starts[index + 1]) - starts[index];
      add(index, {
        start,
        end,
        replacement: index === receiver ? edit.replacement : "",
      });
    }
  }
  return projected;
}

/** Projects protected annotations onto fragment-local protection ranges. */
export function projectProtections(
  layout: RunLayout,
  fragments: readonly RunFragment[],
  annotations: readonly Annotation[],
): Map<number, ProtectionRange[]> {
  const { starts } = layout;
  const byFragment = new Map<number, ProtectionRange[]>();
  const ranges = annotations.filter(({ protect }) => protect === true)
    .sort((left, right) => left.start - right.start);
  for (const range of ranges) {
    for (
      let index = firstFragmentEndingAtOrAfter(starts, range.start + 1);
      index < fragments.length && starts[index] < range.end;
      index++
    ) {
      if (fragments[index].protected) continue;
      const start = Math.max(range.start, starts[index]) - starts[index];
      const end = Math.min(range.end, starts[index + 1]) - starts[index];
      if (end <= start) continue;
      const list = byFragment.get(index) ?? [];
      const previous = list.at(-1);
      if (previous !== undefined && start < previous.end) {
        throw new Error("Overlapping protected annotations");
      }
      list.push({ start, end });
      byFragment.set(index, list);
    }
  }
  return byFragment;
}

/** Maps a run location onto the fragment that reports it. */
export function locateInFragment(
  ruleId: string,
  fragments: readonly RunFragment[],
  layout: RunLayout,
  location: RunLocation,
): ApplicationDiagnosticLocation {
  const { starts, run } = layout;
  if (
    !Number.isInteger(location.start) || !Number.isInteger(location.end) ||
    location.start < 0 || location.end < location.start ||
    location.end > run.text.length
  ) {
    throw new Error(
      `Rule ${ruleId} returned an invalid diagnostic range: ${location.start}:${location.end}`,
    );
  }
  let index: number | undefined;
  if (location.start === location.end) {
    index = fragmentAtPosition(
      fragments,
      starts,
      location.start,
      location.bias ?? "left",
      false,
    );
  } else {
    index = firstFragmentEndingAtOrAfter(starts, location.start + 1);
    while (index < fragments.length && starts[index + 1] <= location.start) {
      index++;
    }
    if (index >= fragments.length || location.end > starts[index + 1]) {
      throw new Error(
        `Rule ${ruleId} returned a diagnostic crossing fragments`,
      );
    }
  }
  if (index === undefined) {
    throw new Error(`Rule ${ruleId} returned an unlocatable diagnostic`);
  }
  return {
    segmentIndex: index,
    start: location.start - starts[index],
    end: location.end - starts[index],
  };
}
