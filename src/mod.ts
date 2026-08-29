/** Orthotypography core: source-backed, composable typographic primitives. */
export {
  compilePipeline,
  type PipelineOptions,
  runPipeline,
} from "./pipeline.ts";
export {
  classifyNumericConstructs,
  NUMERIC_PROTECTION_RULE,
} from "./classify/mod.ts";
export {
  HIGH_PUNCTUATION_RULES,
  IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
  PERCENTAGE_SPACING_RULE,
  SAFE_PUNCTUATION_RULES,
} from "./rules/mod.ts";

import {
  IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
  PERCENTAGE_SPACING_RULE,
} from "./rules/mod.ts";
import type { RuntimeRule } from "./model.ts";

/** Current executable subset of the Imprimerie nationale preset. */
export const IMPRIMERIE_NATIONALE_RULES: readonly RuntimeRule[] = [
  ...IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
  PERCENTAGE_SPACING_RULE,
] as const;
export type {
  NumericConstruct,
  NumericConstructDisposition,
  NumericConstructKind,
  PipelineResult,
  ProtectionRange,
  RuleApplication,
  RuleContext,
  RuleDiagnostic,
  RuntimeRule,
  TextSegment,
} from "./model.ts";

export * as catalogue from "./catalogue/mod.ts";
