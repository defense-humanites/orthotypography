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
        const leading = /^€[\t \u00a0\u202f]*(\d+(?:[.,]\d+)?)$/u.exec(
          construct,
        );
        const trailing = /^(\d+(?:[.,]\d+)?)[\t \u00a0\u202f]*€$/u.exec(
          construct,
        );
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
