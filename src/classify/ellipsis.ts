import type { TextSegment } from "../model.ts";

export type EllipsisFunction = "final" | "initial" | "word" | "unknown";

export interface EllipsisCandidate {
  readonly start: number;
  readonly end: number;
  readonly value: "..." | "…";
  readonly function: EllipsisFunction;
  readonly certain: boolean;
}

interface LogicalPart {
  readonly segmentIndex: number;
  readonly start: number;
  readonly end: number;
}

export interface EllipsisLogicalRun {
  readonly value: string;
  readonly parts: readonly LogicalPart[];
  readonly structurallyInitial: boolean;
}

const ellipsisPattern = /…|(?<!\.)\.{3}(?!\.)/gu;
const whitespace = /\s/u;
const letter = /[\p{L}\p{M}]/u;
const wordCharacter = /[\p{L}\p{M}\p{N}_]/u;

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

function tokenAround(value: string, start: number, end: number): string {
  let tokenStart = start;
  let tokenEnd = end;
  while (tokenStart > 0 && !whitespace.test(value[tokenStart - 1])) {
    tokenStart--;
  }
  while (tokenEnd < value.length && !whitespace.test(value[tokenEnd])) {
    tokenEnd++;
  }
  return value.slice(tokenStart, tokenEnd);
}

function followsEtc(
  value: string,
  start: number,
  representation: string,
): boolean {
  const prefix = value.slice(0, start);
  if (representation === "...") {
    return /(?:^|[^\p{L}\p{N}_])etc\.?[\t \u00a0\u202f]*$/iu.test(
      prefix,
    );
  }
  return /(?:^|[^\p{L}\p{N}_])etc\.[\t \u00a0\u202f]*$/iu.test(prefix);
}

function isEditorialOmission(
  value: string,
  start: number,
  end: number,
): boolean {
  return /\[[\t \u00a0\u202f]*$/u.test(value.slice(0, start)) &&
    /^[\t \u00a0\u202f]*\]/u.test(value.slice(end));
}

function isTechnical(
  value: string,
  start: number,
  end: number,
  representation: string,
): boolean {
  const token = tokenAround(value, start, end);
  if (
    /(?:[a-z][a-z0-9+.-]*:\/\/|www\.)/iu.test(token) ||
    /[\\/]/u.test(token) ||
    /[=+*%<>|&^~$@#`]/u.test(token)
  ) return true;

  const previous = characterBefore(value, start);
  const next = characterAt(value, end);
  if (
    wordCharacter.test(previous ?? "") && wordCharacter.test(next ?? "")
  ) return true;
  if (
    representation === "..." && wordCharacter.test(next ?? "") &&
    !letter.test(previous ?? "")
  ) return true;
  if (
    wordCharacter.test(next ?? "") &&
    previous !== undefined && "{[(,:;".includes(previous)
  ) return true;
  return false;
}

/** Builds the maximal unprotected text run containing one pipeline segment. */
export function ellipsisLogicalRun(
  segments: readonly TextSegment[],
  segmentIndex: number,
): EllipsisLogicalRun {
  let first = segmentIndex;
  let last = segmentIndex;
  while (first > 0 && !segments[first - 1].protected) first--;
  while (last + 1 < segments.length && !segments[last + 1].protected) last++;

  const parts: LogicalPart[] = [];
  let value = "";
  for (let index = first; index <= last; index++) {
    const segment = segments[index];
    if (segment.protected) continue;
    const start = value.length;
    value += segment.value;
    parts.push({ segmentIndex: index, start, end: value.length });
  }
  return { value, parts, structurallyInitial: first === 0 };
}

/** Conservatively classifies ellipsis candidates without modifying text. */
export function classifyEllipsisCandidates(
  input: string,
  structurallyInitial = true,
): readonly EllipsisCandidate[] {
  const candidates: EllipsisCandidate[] = [];

  for (const match of input.matchAll(ellipsisPattern)) {
    const start = match.index;
    const end = start + match[0].length;
    const value = match[0] as "..." | "…";
    if (
      characterBefore(input, start) === "." ||
      characterAt(input, end) === "." ||
      followsEtc(input, start, value) ||
      isEditorialOmission(input, start, end) ||
      isTechnical(input, start, end, value)
    ) continue;

    const previous = characterBefore(input, start);
    const next = characterAt(input, end);
    const prefixIsWhitespace = input.slice(0, start).trim().length === 0;
    let ellipsisFunction: EllipsisFunction = "unknown";
    let certain = false;

    if (letter.test(previous ?? "")) {
      ellipsisFunction = "final";
      certain = true;
    } else if (structurallyInitial && prefixIsWhitespace) {
      ellipsisFunction = "initial";
      certain = true;
    } else if (
      whitespace.test(previous ?? "") && whitespace.test(next ?? "")
    ) {
      ellipsisFunction = "word";
    }

    candidates.push({ start, end, value, function: ellipsisFunction, certain });
  }
  return candidates;
}
