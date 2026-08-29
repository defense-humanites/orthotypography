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
  FRENCH_GUILLEMETS_SPACING_RULE,
  HIGH_PUNCTUATION_RULES,
  IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
  IMPRIMERIE_NATIONALE_RULES,
  PERCENTAGE_SPACING_RULE,
  SAFE_PUNCTUATION_RULES,
} from "./rules/mod.ts";
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
