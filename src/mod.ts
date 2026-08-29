/** Orthotypography core: source-backed, composable typographic primitives. */
export {
  compilePipeline,
  type PipelineOptions,
  runPipeline,
} from "./pipeline.ts";
export { classifyNumericConstructs } from "./classify/mod.ts";
export { SAFE_PUNCTUATION_RULES } from "./rules/mod.ts";
export type {
  NumericConstruct,
  NumericConstructDisposition,
  NumericConstructKind,
  PipelineResult,
  RuleApplication,
  RuleContext,
  RuleDiagnostic,
  RuntimeRule,
  TextSegment,
} from "./model.ts";

export * as catalogue from "./catalogue/mod.ts";
