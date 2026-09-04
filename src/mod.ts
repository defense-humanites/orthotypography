/** Orthotypography core: source-backed, composable typographic primitives. */
export {
  compilePipeline,
  type PipelineOptions,
  runPipeline,
} from "./pipeline.ts";
export {
  runTextNodePipeline,
  type TextNodeInput,
  type TextNodeOutput,
  type TextNodePipelineOptions,
  type TextNodePipelineResult,
} from "./integration.ts";
export {
  classifyNumericConstructs,
  NUMERIC_PROTECTION_RULE,
} from "./classify/mod.ts";
export {
  EURO_SPACING_RULE,
  FRENCH_GUILLEMETS_SPACING_RULE,
  HIGH_PUNCTUATION_RULES,
  IMPRIMERIE_NATIONALE_PUNCTUATION_RULES,
  IMPRIMERIE_NATIONALE_RULES,
  PERCENTAGE_SPACING_RULE,
  SAFE_PUNCTUATION_RULES,
  UNIT_SPACING_RULE,
} from "./rules/mod.ts";
export type {
  ApplicationDiagnosticLocation,
  ChangeSet,
  DiagnosticLocation,
  NumericConstruct,
  NumericConstructDisposition,
  NumericConstructKind,
  PipelineResult,
  ProtectionRange,
  RuleApplication,
  RuleApplicationDiagnostic,
  RuleApplicationEdit,
  RuleContext,
  RuleDiagnostic,
  RuntimeRule,
  TextChange,
  TextSegment,
} from "./model.ts";

export * as catalogue from "./catalogue/mod.ts";
export * as registry from "./registry/mod.ts";
