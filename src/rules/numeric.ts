import { RULES } from "../catalogue/rules.ts";
import { classifyNumericConstructs } from "../classify/numeric.ts";
import type { RuleDefinition, RuntimeRule } from "../model.ts";
import { resolveUnitSymbol } from "../registry/units.ts";

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
        const parts = /^(\d+(?:[.,]\d+)?)[\t \u00a0\u202f]*([%‰])$/u.exec(
          construct,
        );
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
        const parts = /^(\d+(?:[.,]\d+)?)[\t \u00a0\u202f]*([\p{L}µΩ°]+)$/u
          .exec(construct);
        if (parts === null || resolveUnitSymbol(parts[2]) === null) {
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
