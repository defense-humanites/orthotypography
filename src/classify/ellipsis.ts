import {
  prefixCounts,
  technicalPatternStarts,
  whitespaceFreeEnds,
  whitespaceFreeStarts,
} from "./text-index.ts";

export type EllipsisFunction = "final" | "initial" | "word" | "unknown";

export interface EllipsisCandidate {
  readonly start: number;
  readonly end: number;
  readonly value: "..." | "…";
  readonly function: EllipsisFunction;
  readonly certain: boolean;
}

const ellipsisPattern = /…|(?<!\.)\.{3}(?!\.)/gu;
const whitespace = /\s/u;
const letter = /[\p{L}\p{M}]/u;
const wordCharacter = /[\p{L}\p{M}\p{N}_]/u;
const nonWordBeforeEtc = /[^\p{L}\p{N}_]/u;
const etcWord = /^etc$/iu;
const inlineSpacing = new Set(["\t", " ", "\u00a0", "\u202f"]);
const technicalSymbols = new Set("=+*%<>|&^~$@#`");

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

/**
 * Position indexes of one classified input, built on first use so that each
 * candidate is examined in time independent of the input length.
 */
class CandidateIndex {
  #tokenStarts?: Int32Array;
  #tokenEnds?: Int32Array;
  #technical?: Int32Array;
  #slashes?: Int32Array;
  #symbols?: Int32Array;
  #firstNonWhitespace?: number;

  constructor(readonly value: string) {}

  /** Whether only whitespace precedes `start`. */
  prefixIsWhitespace(start: number): boolean {
    if (this.#firstNonWhitespace === undefined) {
      let index = 0;
      while (index < this.value.length && whitespace.test(this.value[index])) {
        index++;
      }
      this.#firstNonWhitespace = index;
    }
    return start <= this.#firstNonWhitespace;
  }

  /** Whether the whitespace-free token around `[start, end)` is technical. */
  technicalToken(start: number, end: number): boolean {
    const { value } = this;
    const tokenStart = (this.#tokenStarts ??= whitespaceFreeStarts(value))[
      start
    ];
    const tokenEnd = (this.#tokenEnds ??= whitespaceFreeEnds(value))[end];
    const technical = this.#technical ??= technicalPatternStarts(value);
    const slashes = this.#slashes ??= prefixCounts(
      value,
      (unit) => unit === "\\" || unit === "/",
    );
    const symbols = this.#symbols ??= prefixCounts(
      value,
      (unit) => technicalSymbols.has(unit),
    );
    return technical[tokenEnd] >= tokenStart ||
      slashes[tokenEnd] > slashes[tokenStart] ||
      symbols[tokenEnd] > symbols[tokenStart];
  }
}

/** Start of the inline spacing that ends at `index`. */
function spacingStartBefore(value: string, index: number): number {
  let start = index;
  while (start > 0 && inlineSpacing.has(value[start - 1])) start--;
  return start;
}

/**
 * Whether the text before `start` ends with the standalone word `etc`, then a
 * period (optional for `...`), then inline spacing.
 */
function followsEtc(
  value: string,
  start: number,
  representation: string,
): boolean {
  const spacing = spacingStartBefore(value, start);
  const endsWithEtc = (end: number): boolean =>
    end >= 3 && etcWord.test(value.slice(end - 3, end)) &&
    (end === 3 || nonWordBeforeEtc.test(characterBefore(value, end - 3) ?? ""));
  if (spacing > 0 && value[spacing - 1] === "." && endsWithEtc(spacing - 1)) {
    return true;
  }
  return representation === "..." && endsWithEtc(spacing);
}

function isEditorialOmission(
  value: string,
  start: number,
  end: number,
): boolean {
  const before = spacingStartBefore(value, start);
  if (before === 0 || value[before - 1] !== "[") return false;
  let after = end;
  while (after < value.length && inlineSpacing.has(value[after])) after++;
  return value[after] === "]";
}

function isTechnical(
  index: CandidateIndex,
  start: number,
  end: number,
  representation: string,
): boolean {
  if (index.technicalToken(start, end)) return true;

  const { value } = index;
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

/**
 * Conservatively classifies ellipsis candidates without modifying text.
 *
 * Each candidate is examined in time independent of the input length, so the
 * classification is linear in the input.
 */
export function classifyEllipsisCandidates(
  input: string,
  structurallyInitial = true,
): readonly EllipsisCandidate[] {
  const candidates: EllipsisCandidate[] = [];
  const index = new CandidateIndex(input);

  for (const match of input.matchAll(ellipsisPattern)) {
    const start = match.index;
    const end = start + match[0].length;
    const value = match[0] as "..." | "…";
    if (
      characterBefore(input, start) === "." ||
      characterAt(input, end) === "." ||
      followsEtc(input, start, value) ||
      isEditorialOmission(input, start, end) ||
      isTechnical(index, start, end, value)
    ) continue;

    const previous = characterBefore(input, start);
    const next = characterAt(input, end);
    let ellipsisFunction: EllipsisFunction = "unknown";
    let certain = false;

    if (letter.test(previous ?? "")) {
      ellipsisFunction = "final";
      certain = true;
    } else if (structurallyInitial && index.prefixIsWhitespace(start)) {
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
