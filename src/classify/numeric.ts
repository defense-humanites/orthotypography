import type {
  NumericConstruct,
  NumericConstructDisposition,
  NumericConstructKind,
} from "../model.ts";

interface NumericMatcher {
  readonly kind: NumericConstructKind;
  readonly disposition: NumericConstructDisposition;
  readonly pattern: RegExp;
  readonly accept?: (value: string) => boolean;
}

const MATCHERS: readonly NumericMatcher[] = [
  {
    kind: "uri",
    disposition: "protect",
    pattern: /\b[a-z][a-z0-9+.-]*:\/\/[^\s<>"'«»]+/giu,
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
      /\b(?:[01]?\d|2[0-3])(?:[\t \u00a0\u202f]?h[\t \u00a0\u202f]?|:)[0-5]\d\b/giu,
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
    pattern: /\b\d+(?:[.,]\d+)?[\t \u00a0\u202f]*[%‰]/gu,
  },
  {
    kind: "currency",
    disposition: "target",
    pattern: /(?:€|\$|£)[\t \u00a0\u202f]*\d+(?:[.,]\d+)?\b/gu,
  },
  {
    kind: "currency",
    disposition: "target",
    pattern: /\b\d+(?:[.,]\d+)?[\t \u00a0\u202f]*(?:CHF|CAD|USD|EUR)\b/giu,
  },
  {
    kind: "currency",
    disposition: "target",
    pattern: /\b\d+(?:[.,]\d+)?[\t \u00a0\u202f]*(?:€|\$|£)/gu,
  },
  {
    kind: "measurement",
    disposition: "target",
    pattern:
      /\b\d+(?:[.,]\d+)?[\t \u00a0\u202f]*(?:°C|°F|km|cm|mm|kg|mg|ms|min|h|L|l|m|g|s)\b/gu,
  },
  {
    kind: "decimal",
    disposition: "protect",
    pattern: /\b\d+[.,]\d+\b/gu,
  },
] as const;

function overlaps(
  candidate: Pick<NumericConstruct, "start" | "end">,
  accepted: readonly NumericConstruct[],
): boolean {
  return accepted.some((item) =>
    candidate.start < item.end && item.start < candidate.end
  );
}

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
      if (matcher.accept?.(value) === false || overlaps(candidate, accepted)) {
        continue;
      }
      accepted.push(candidate);
    }
  }

  return accepted.sort((left, right) => left.start - right.start);
}
