/**
 * Position indexes over a string, each built in one pass, so that rules can
 * answer token questions in constant time instead of rescanning the text for
 * every match.
 */

const whitespace = /\s/u;

/** For each position, the start of the whitespace-free text ending there. */
export function whitespaceFreeStarts(text: string): Int32Array {
  const starts = new Int32Array(text.length + 1);
  let start = 0;
  for (let index = 0; index < text.length; index++) {
    starts[index] = start;
    if (whitespace.test(text[index])) start = index + 1;
  }
  starts[text.length] = start;
  return starts;
}

/** For each position, the end of the whitespace-free text starting there. */
export function whitespaceFreeEnds(text: string): Int32Array {
  const ends = new Int32Array(text.length + 1);
  let end = text.length;
  ends[text.length] = end;
  for (let index = text.length - 1; index >= 0; index--) {
    if (whitespace.test(text[index])) end = index;
    ends[index] = end;
  }
  return ends;
}

/** Number of code units before each position that satisfy a predicate. */
export function prefixCounts(
  text: string,
  predicate: (unit: string) => boolean,
): Int32Array {
  const counts = new Int32Array(text.length + 1);
  for (let index = 0; index < text.length; index++) {
    counts[index + 1] = counts[index] + (predicate(text[index]) ? 1 : 0);
  }
  return counts;
}

const letter = /^[a-z]$/iu;
const schemeCharacter = /^[a-z0-9+.-]$/iu;
const wCharacter = /^w$/iu;

/**
 * For each position, the latest start of a `scheme://` or `www.` occurrence
 * ending at or before it, or -1. Occurrences follow
 * `/(?:[a-z][a-z0-9+.-]*:\/\/|www\.)/iu`; the start of a scheme is its last
 * letter, which is the latest start that still matches.
 *
 * A whitespace-free token `[start, end)` contains an occurrence exactly when
 * the value at `end` is at least `start`.
 */
export function technicalPatternStarts(text: string): Int32Array {
  const starts = new Int32Array(text.length + 1).fill(-1);
  let schemeLetter = -1;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (
      character === ":" && schemeLetter >= 0 && text[index + 1] === "/" &&
      text[index + 2] === "/"
    ) {
      const end = index + 3;
      starts[end] = Math.max(starts[end], schemeLetter);
    }
    if (
      character === "." && index >= 3 && wCharacter.test(text[index - 1]) &&
      wCharacter.test(text[index - 2]) && wCharacter.test(text[index - 3])
    ) {
      starts[index + 1] = Math.max(starts[index + 1], index - 3);
    }
    if (!schemeCharacter.test(character)) schemeLetter = -1;
    else if (letter.test(character)) schemeLetter = index;
  }
  for (let index = 1; index <= text.length; index++) {
    starts[index] = Math.max(starts[index], starts[index - 1]);
  }
  return starts;
}
