import type {
  NumericConstruct,
  NumericConstructDisposition,
  NumericConstructKind,
} from "../model.ts";
import { resolveCurrencyNotation } from "../registry/currencies.ts";
import { resolveUnitExpression } from "../registry/units.ts";

interface NumericMatcher {
  readonly kind: NumericConstructKind;
  readonly disposition: NumericConstructDisposition;
  readonly pattern: RegExp;
  readonly accept?: (value: string) => boolean;
}

const numericSpacingSource = String.raw`[\t \u00a0\u202f]`;
const integerSource = String.raw`\d+(?:${numericSpacingSource}\d{3})*`;
// A grouped decimal part is split by threes from the separator; only its last
// group may be shorter. Other decimal parts are a single run of digits.
const fractionSource = String
  .raw`(?:\d{3}(?:${numericSpacingSource}\d{3})*(?:${numericSpacingSource}\d{1,2})?(?!\d)|\d+)`;
export const numericValueSource = String
  .raw`${integerSource}(?:[.,]${fractionSource})?`;

const unitAtomSource = String.raw`[\p{L}µΩ°′″]+(?:[⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?`;
const unitPrimarySource = String
  .raw`(?:${unitAtomSource}|\((?:${unitAtomSource})(?:[\t \u00a0\u202f]*[⋅/][\t \u00a0\u202f]*${unitAtomSource})*\)(?:[⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?)`;
const measurementPattern = new RegExp(
  String
    .raw`\b${numericValueSource}[\t \u00a0\u202f]*${unitPrimarySource}(?:[\t \u00a0\u202f]*[⋅/][\t \u00a0\u202f]*${unitPrimarySource})*(?![\p{L}\p{N}µΩ°′″⁰¹²³⁴⁵⁶⁷⁸⁹⁻⋅/·*^()])`,
  "gu",
);

const MATCHERS: readonly NumericMatcher[] = [
  {
    kind: "uri",
    disposition: "protect",
    pattern: /\b[a-z][a-z0-9+.-]*:\/\/[^\s<>"'«»]+/giu,
  },
  {
    kind: "path",
    disposition: "protect",
    // Drive-letter paths; trailing sentence punctuation stays outside.
    pattern: /\b[a-z]:[\\/](?:[^\s<>"'«»]*[^\s<>"'«».,;:!?)])?/giu,
  },
  {
    kind: "ipv4",
    disposition: "protect",
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/gu,
    accept: (value) => value.split(".").every((part) => Number(part) <= 255),
  },
  {
    kind: "version",
    disposition: "protect",
    pattern: /\bv\d+(?:\.\d+)+(?:[-+][0-9a-z.-]+)?\b/giu,
  },
  {
    kind: "version",
    disposition: "protect",
    pattern: /\b\d+\.\d+\.\d+(?:\.\d+)*(?:[-+][0-9a-z.-]+)?\b/giu,
  },
  {
    kind: "date",
    disposition: "protect",
    pattern: /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/gu,
  },
  {
    kind: "time",
    disposition: "protect",
    pattern:
      /\b(?:[01]?\d|2[0-3])(?:[\t \u00a0\u202f]?h[\t \u00a0\u202f]?[0-5]\d|:[0-5]\d(?::[0-5]\d)?)\b/giu,
  },
  {
    kind: "ratio",
    disposition: "protect",
    pattern:
      /\b\d+(?:[.,]\d+)?[\t \u00a0\u202f]*:[\t \u00a0\u202f]*\d+(?:[.,]\d+)?\b/gu,
  },
  {
    kind: "port",
    disposition: "protect",
    pattern: /\b(?:localhost|[a-z0-9-]+(?:\.[a-z0-9-]+)+):\d{2,5}\b/giu,
  },
  {
    kind: "percentage",
    disposition: "target",
    pattern: new RegExp(
      String.raw`\b${numericValueSource}[\t \u00a0\u202f]*[%‰]`,
      "gu",
    ),
  },
  {
    kind: "currency",
    disposition: "target",
    pattern: new RegExp(
      // A symbol that already follows an amount belongs to that amount.
      String
        .raw`(?<!\d[\t \u00a0\u202f]*)[€$£][\t \u00a0\u202f]*${numericValueSource}\b`,
      "gu",
    ),
    accept: (value) => resolveCurrencyNotation(value[0]) !== null,
  },
  {
    kind: "currency",
    disposition: "target",
    pattern: new RegExp(
      String.raw`\b${numericValueSource}[\t \u00a0\u202f]*[A-Z]{3}\b`,
      "gu",
    ),
    accept: (value) => {
      const code = /[A-Z]{3}$/u.exec(value)?.[0];
      return code !== undefined && resolveCurrencyNotation(code) !== null;
    },
  },
  {
    kind: "currency",
    disposition: "target",
    pattern: new RegExp(
      String.raw`\b${numericValueSource}[\t \u00a0\u202f]*[€$£]`,
      "gu",
    ),
    accept: (value) => resolveCurrencyNotation(value.at(-1) ?? "") !== null,
  },
  {
    kind: "measurement",
    disposition: "target",
    pattern: measurementPattern,
    accept: (value) => {
      const expression = new RegExp(
        String.raw`^${numericValueSource}[\t \u00a0\u202f]*(.+)$`,
        "u",
      ).exec(value)?.[1];
      return expression !== undefined &&
        resolveUnitExpression(expression)?.spacing === "space";
    },
  },
  {
    kind: "decimal",
    disposition: "protect",
    pattern: new RegExp(
      String.raw`\b${integerSource}[.,]${fractionSource}\b`,
      "gu",
    ),
  },
] as const;

/**
 * Classifies numeric constructs without modifying the input.
 *
 * Syntactic contexts such as times, ratios, versions and addresses are marked
 * `protect`. Recognized percentages, measurements and currencies are marked
 * `target`; that label permits a later rule to inspect them but does not by
 * itself authorize a correction.
 */
export function classifyNumericConstructs(
  input: string,
): readonly NumericConstruct[] {
  const accepted: NumericConstruct[] = [];
  // Code units already covered by an accepted construct. Matches of one
  // matcher do not overlap, so checking each candidate's own range keeps the
  // classification linear in the input for each matcher.
  const covered = new Uint8Array(input.length);
  const overlaps = (start: number, end: number): boolean => {
    for (let index = start; index < end; index++) {
      if (covered[index] === 1) return true;
    }
    return false;
  };

  for (const matcher of MATCHERS) {
    for (const match of input.matchAll(matcher.pattern)) {
      const start = match.index;
      const value = match[0];
      const candidate: NumericConstruct = {
        kind: matcher.kind,
        disposition: matcher.disposition,
        start,
        end: start + value.length,
        value,
      };
      if (
        matcher.accept?.(value) === false ||
        overlaps(candidate.start, candidate.end)
      ) {
        continue;
      }
      covered.fill(1, candidate.start, candidate.end);
      accepted.push(candidate);
    }
  }

  return accepted.sort((left, right) => left.start - right.start);
}
