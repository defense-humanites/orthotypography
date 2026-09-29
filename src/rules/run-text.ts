import type { LogicalRun, RunLocation } from "../run.ts";

/** Characters treated as typographic spacing by the built-in rules. */
export const spacingCharacters: ReadonlySet<string> = new Set([
  "\t",
  " ",
  " ",
  " ",
]);

/**
 * Stretches of a logical run delimited by node boundaries and protected-range
 * edges, built once per rule call.
 *
 * Each non-empty stretch is either wholly protected or wholly unprotected and
 * lies within one node. Rules migrated from the per-fragment interface use
 * stretches to keep the reach of their scans unchanged: a stretch corresponds
 * to one non-empty fragment of the pipeline.
 */
export class RunStretches {
  readonly text: string;
  /** Start of each non-empty stretch, in text order. */
  readonly starts: readonly number[];
  /** End of each non-empty stretch. */
  readonly ends: readonly number[];
  /** Whether each non-empty stretch is protected. */
  readonly protectedFlags: readonly boolean[];

  constructor(run: LogicalRun) {
    const { text, nodeBoundaries, protectedRanges } = run;
    const edges: number[] = [];
    let node = 0;
    let range = 0;
    let rangeEdge = 0;
    const edgeOf = (index: number): number =>
      index % 2 === 0
        ? protectedRanges[index >> 1].start
        : protectedRanges[index >> 1].end;
    const rangeEdges = protectedRanges.length * 2;
    while (node < nodeBoundaries.length || rangeEdge < rangeEdges) {
      const next = rangeEdge < rangeEdges &&
          (node >= nodeBoundaries.length ||
            edgeOf(rangeEdge) <= nodeBoundaries[node])
        ? edgeOf(rangeEdge++)
        : nodeBoundaries[node++];
      if (edges.at(-1) !== next) edges.push(next);
    }
    if (edges[0] !== 0) edges.unshift(0);
    if (edges.at(-1) !== text.length) edges.push(text.length);

    const starts: number[] = [];
    const ends: number[] = [];
    const protectedFlags: boolean[] = [];
    for (let index = 0; index + 1 < edges.length; index++) {
      const start = edges[index];
      const end = edges[index + 1];
      while (
        range < protectedRanges.length && protectedRanges[range].end <= start
      ) range++;
      starts.push(start);
      ends.push(end);
      protectedFlags.push(
        range < protectedRanges.length && protectedRanges[range].start <= start,
      );
    }
    this.text = text;
    this.starts = starts;
    this.ends = ends;
    this.protectedFlags = protectedFlags;
  }

  /** Index of the stretch containing a position of the text. */
  indexAt(position: number): number {
    let low = 0;
    let high = this.starts.length - 1;
    while (low < high) {
      const middle = (low + high + 1) >>> 1;
      if (this.starts[middle] <= position) low = middle;
      else high = middle - 1;
    }
    return low;
  }

  /** Whether a position is an edge of a stretch, including both text ends. */
  isEdge(position: number): boolean {
    if (position === 0 || position === this.text.length) return true;
    return this.starts[this.indexAt(position)] === position;
  }
}

/** Maximal unprotected text between protected ranges. */
export interface Region {
  readonly start: number;
  readonly end: number;
  /** First and last stretch of the region. */
  readonly first: number;
  readonly last: number;
}

export function unprotectedRegions(stretches: RunStretches): Region[] {
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
export function stretchParts(
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
