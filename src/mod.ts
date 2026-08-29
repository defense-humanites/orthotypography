/** Orthotypography core: source-backed, composable typographic primitives. */
export {
  compilePipeline,
  type PipelineOptions,
  runPipeline,
} from "./pipeline.ts";
export type {
  PipelineResult,
  RuleApplication,
  RuleContext,
  RuleDiagnostic,
  RuntimeRule,
  TextSegment,
} from "./model.ts";

export * as catalogue from "./catalogue/mod.ts";
