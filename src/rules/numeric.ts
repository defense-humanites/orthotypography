import { RULES } from "../catalogue/rules.ts";
import {
  classifyNumericConstructs,
  numericValueSource,
} from "../classify/numeric.ts";
import type {
  ApplicationDiagnosticLocation,
  RuleContext,
  RuleDefinition,
  RuntimeRule,
} from "../model.ts";
import { resolveUnitExpression } from "../registry/units.ts";

const numericValuePattern = new RegExp(numericValueSource, "u");

const definition = RULES.find((rule) =>
  rule.id === "number.percent.nbsp-before"
);
if (definition === undefined) {
  throw new Error("Missing documentary rule: number.percent.nbsp-before");
}

/** Adds a no-break space inside classified percentage constructs. */
export const PERCENTAGE_SPACING_RULE: RuntimeRule = {
  definition: definition as RuleDefinition,
  apply(value, context) {
    const edits = classifyNumericConstructs(value)
      .filter(({ kind }) => kind === "percentage")
      .map(({ start, end, value: construct }) => {
        const parts = new RegExp(
          String.raw`^(${numericValueSource})[\t \u00a0\u202f]*([%‰])$`,
          "u",
        ).exec(construct);
        if (parts === null) {
          throw new Error(`Invalid classified percentage: ${construct}`);
        }
        return {
          start,
          end,
          replacement: `${parts[1]}\u00a0${parts[2]}`,
        };
      })
      .filter(({ start, end, replacement }) =>
        value.slice(start, end) !== replacement
      );

    let result = value;
    if (context.mode === "fix") {
      for (
        const edit of [...edits].sort((left, right) => right.start - left.start)
      ) {
        result = result.slice(0, edit.start) + edit.replacement +
          result.slice(edit.end);
      }
    }

    return {
      value: result,
      edits,
      diagnostics: edits.length === 0
        ? undefined
        : edits.map(({ start, end, replacement }) => ({
          start,
          end,
          message: "Expected a no-break space before the percentage symbol",
          replacement,
        })),
    };
  },
};

const unitDefinition = RULES.find((rule) =>
  rule.id === "number.unit.nbsp-before"
);
if (unitDefinition === undefined) {
  throw new Error("Missing documentary rule: number.unit.nbsp-before");
}

/** Diagnoses recognized unit spacing, or fixes it when explicitly requested. */
export const UNIT_SPACING_RULE: RuntimeRule = {
  definition: unitDefinition as RuleDefinition,
  apply(value, context) {
    const edits = classifyNumericConstructs(value)
      .filter(({ kind }) => kind === "measurement")
      .map(({ start, end, value: construct }) => {
        const parts = new RegExp(
          String.raw`^(${numericValueSource})[\t \u00a0\u202f]*(.+)$`,
          "u",
        ).exec(construct);
        if (parts === null || resolveUnitExpression(parts[2]) === null) {
          throw new Error(`Invalid classified measurement: ${construct}`);
        }
        return {
          start,
          end,
          replacement: `${parts[1]}\u00a0${parts[2]}`,
        };
      })
      .filter(({ start, end, replacement }) =>
        value.slice(start, end) !== replacement
      );

    let result = value;
    if (context.mode === "fix") {
      for (
        const edit of [...edits].sort((left, right) => right.start - left.start)
      ) {
        result = result.slice(0, edit.start) + edit.replacement +
          result.slice(edit.end);
      }
    }

    return {
      value: result,
      edits,
      diagnostics: edits.length === 0
        ? undefined
        : edits.map(({ start, end, replacement }) => ({
          start,
          end,
          message: "Expected a no-break space before the unit symbol",
          replacement,
        })),
    };
  },
};

const euroDefinition = RULES.find((rule) =>
  rule.id === "number.euro.nbsp-before"
);
if (euroDefinition === undefined) {
  throw new Error("Missing documentary rule: number.euro.nbsp-before");
}

/** Diagnoses French euro-symbol placement, or fixes it when requested. */
export const EURO_SPACING_RULE: RuntimeRule = {
  definition: euroDefinition as RuleDefinition,
  apply(value, context) {
    const edits = classifyNumericConstructs(value)
      .filter(({ kind, value }) => kind === "currency" && value.includes("€"))
      .map(({ start, end, value: construct }) => {
        const leading = new RegExp(
          String.raw`^€[\t \u00a0\u202f]*(${numericValueSource})$`,
          "u",
        ).exec(construct);
        const trailing = new RegExp(
          String.raw`^(${numericValueSource})[\t \u00a0\u202f]*€$`,
          "u",
        ).exec(construct);
        const amount = leading?.[1] ?? trailing?.[1];
        if (amount === undefined) {
          throw new Error(`Invalid classified euro amount: ${construct}`);
        }
        return { start, end, replacement: `${amount}\u00a0€` };
      })
      .filter(({ start, end, replacement }) =>
        value.slice(start, end) !== replacement
      );

    let result = value;
    if (context.mode === "fix") {
      for (
        const edit of [...edits].sort((left, right) => right.start - left.start)
      ) {
        result = result.slice(0, edit.start) + edit.replacement +
          result.slice(edit.end);
      }
    }

    return {
      value: result,
      edits,
      diagnostics: edits.length === 0
        ? undefined
        : edits.map(({ start, end, replacement }) => ({
          start,
          end,
          message:
            "Expected the euro symbol after the amount with a no-break space",
          replacement,
        })),
    };
  },
};

const groupingDefinition = RULES.find((rule) =>
  rule.id === "number.groupDigits"
);
if (groupingDefinition === undefined) {
  throw new Error("Missing documentary rule: number.groupDigits");
}

interface LogicalSegment {
  readonly segmentIndex: number;
  readonly start: number;
  readonly end: number;
}

function unprotectedComponent(context: RuleContext): {
  readonly value: string;
  readonly segments: readonly LogicalSegment[];
} {
  let first = context.segmentIndex;
  while (first > 0 && !context.segments[first - 1].protected) first--;
  let last = context.segmentIndex;
  while (
    last + 1 < context.segments.length &&
    !context.segments[last + 1].protected
  ) last++;

  const segments: LogicalSegment[] = [];
  let offset = 0;
  let value = "";
  for (let segmentIndex = first; segmentIndex <= last; segmentIndex++) {
    const segmentValue = context.segments[segmentIndex].value;
    segments.push({
      segmentIndex,
      start: offset,
      end: offset + segmentValue.length,
    });
    offset += segmentValue.length;
    value += segmentValue;
  }
  return { value, segments };
}

function locationsForRange(
  start: number,
  end: number,
  segments: readonly LogicalSegment[],
): readonly ApplicationDiagnosticLocation[] {
  return segments.flatMap((segment) => {
    const intersectionStart = Math.max(start, segment.start);
    const intersectionEnd = Math.min(end, segment.end);
    return intersectionStart < intersectionEnd
      ? [{
        segmentIndex: segment.segmentIndex,
        start: intersectionStart - segment.start,
        end: intersectionEnd - segment.start,
      }]
      : [];
  });
}

function groupFromRight(digits: string): string {
  const firstGroupLength = digits.length % 3 || 3;
  const groups = [digits.slice(0, firstGroupLength)];
  for (let index = firstGroupLength; index < digits.length; index += 3) {
    groups.push(digits.slice(index, index + 3));
  }
  return groups.join("\u202f");
}

function groupFromLeft(digits: string): string {
  const groups: string[] = [];
  for (let index = 0; index < digits.length; index += 3) {
    groups.push(digits.slice(index, index + 3));
  }
  return groups.join("\u202f");
}

function expectedGrouping(value: string): string | null {
  if (value.includes(".")) return null;
  const [rawInteger, rawFraction] = value.split(",");
  const integer = rawInteger.replaceAll(/[\t \u00a0\u202f]/gu, "");
  const fraction = rawFraction?.replaceAll(/[\t \u00a0\u202f]/gu, "");
  if (integer.length > 1 && integer.startsWith("0")) return null;
  if (integer.length < 4 && (fraction?.length ?? 0) < 4) return null;

  const groupedInteger = integer.length >= 4
    ? groupFromRight(integer)
    : integer;
  const groupedFraction = fraction === undefined
    ? ""
    : `,${fraction.length >= 4 ? groupFromLeft(fraction) : fraction}`;
  return groupedInteger + groupedFraction;
}

function hasExcludedPrefix(value: string, start: number): boolean {
  const prefix = value.slice(Math.max(0, start - 64), start);
  return /(?:\b(?:article|build|code|folio|id|isbn|issn|matricule|n(?:o|uméro)|page|réf(?:érence)?|ticket|version)\s*(?:[:#]\s*)?|n[°º]\s*)$/iu
    .test(prefix) || /[-_/#]$/u.test(prefix);
}

/** Diagnoses missing digit grouping in already classified quantities. */
export const DIGIT_GROUPING_RULE: RuntimeRule = {
  definition: groupingDefinition as RuleDefinition,
  apply(_value, context) {
    const component = unprotectedComponent(context);
    const diagnostics = classifyNumericConstructs(component.value)
      .filter(({ disposition, kind }) =>
        disposition === "target" &&
        (kind === "measurement" || kind === "percentage" || kind === "currency")
      )
      .flatMap((construct) => {
        const numericMatch = numericValuePattern.exec(construct.value);
        if (numericMatch === null) return [];
        const numericStart = construct.start + numericMatch.index;
        const numericEnd = numericStart + numericMatch[0].length;
        if (hasExcludedPrefix(component.value, numericStart)) return [];

        const expected = expectedGrouping(numericMatch[0]);
        const functionalInput = numericMatch[0].replaceAll("\u00a0", "\u202f");
        if (expected === null || functionalInput === expected) return [];

        const locations = locationsForRange(
          numericStart,
          numericEnd,
          component.segments,
        );
        const primary = locations[0];
        if (primary?.segmentIndex !== context.segmentIndex) return [];
        return [{
          start: primary.start,
          end: primary.end,
          message: "Expected digit grouping in this classified quantity",
          ...(locations.length > 1 ? { related: locations.slice(1) } : {}),
        }];
      });

    return {
      value: _value,
      diagnostics: diagnostics.length === 0 ? undefined : diagnostics,
    };
  },
};
