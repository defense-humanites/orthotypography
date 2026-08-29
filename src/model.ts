/** Documentary confidence attached to a source-backed definition. */
export type DocumentaryStatus =
  | "VERIFIED"
  | "VERIFIED_MAPPING"
  | "VERIFIED_BY_EXAMPLE"
  | "VERIFIED_SEMANTICS"
  | "DIVERGENT"
  | "TO_VERIFY";

/** Default action exposed to consumers for a rule. */
export type RuleMode = "fix" | "lint" | "manual-review";

/** Stable pipeline phases. Their order is part of the public contract. */
export type RulePhase =
  | "classify"
  | "glyphs"
  | "quotes"
  | "punctuation-spacing"
  | "numeric-spacing"
  | "cleanup";

export const RULE_PHASES: readonly RulePhase[] = [
  "classify",
  "glyphs",
  "quotes",
  "punctuation-spacing",
  "numeric-spacing",
  "cleanup",
] as const;

/** Academic or institutional source used by documentary rules. */
export interface SourceDefinition {
  readonly id: string;
  readonly citation: string;
  readonly url?: string;
  readonly accessedAt?: string;
}

/** A precise locator inside a registered source. */
export interface SourceLocator {
  readonly sourceId: string;
  readonly locator: string;
}

/** Machine-readable description of one atomic orthotypographic behaviour. */
export interface RuleDefinition {
  readonly id: string;
  readonly description: string;
  readonly locales: readonly string[];
  readonly phase: RulePhase;
  readonly status: DocumentaryStatus;
  readonly defaultMode: RuleMode;
  readonly sources: readonly SourceLocator[];
  readonly outcome: Readonly<Record<string, string>>;
  readonly exceptions: readonly string[];
  readonly dependsOn?: readonly string[];
}

export interface PresetRuleSelection {
  readonly ruleId: string;
  readonly mode?: RuleMode;
}

/** A named, source-scoped composition of atomic rules. */
export interface PresetDefinition {
  readonly id: string;
  readonly locale: string;
  readonly authority: string;
  readonly status: "CANDIDATE" | "DRAFT" | "STABLE";
  readonly rules: readonly PresetRuleSelection[];
}

/** A segment integrations may protect from all text transformations. */
export interface TextSegment {
  readonly value: string;
  readonly protected?: boolean;
}

export interface RuleDiagnostic {
  readonly ruleId: string;
  readonly segmentIndex: number;
  readonly start: number;
  readonly end: number;
  readonly message: string;
  readonly replacement?: string;
}

export interface RuleApplication {
  readonly value: string;
  readonly diagnostics?: readonly Omit<
    RuleDiagnostic,
    "ruleId" | "segmentIndex"
  >[];
}

export interface RuleContext {
  readonly locale: string;
  readonly mode: RuleMode;
}

/** Executable implementation kept separate from documentary definitions. */
export interface RuntimeRule {
  readonly definition: RuleDefinition;
  apply(value: string, context: RuleContext): RuleApplication;
}

export interface PipelineResult {
  readonly value: string;
  readonly segments: readonly TextSegment[];
  readonly diagnostics: readonly RuleDiagnostic[];
  readonly appliedRuleIds: readonly string[];
}

/** Numeric contexts recognized before punctuation and spacing rules run. */
export type NumericConstructKind =
  | "uri"
  | "ipv4"
  | "version"
  | "date"
  | "time"
  | "ratio"
  | "port"
  | "decimal"
  | "percentage"
  | "measurement"
  | "currency";

/** Whether a numeric context must be preserved or may be transformed. */
export type NumericConstructDisposition = "protect" | "target";

/** Half-open source range returned by the numeric classifier. */
export interface NumericConstruct {
  readonly kind: NumericConstructKind;
  readonly disposition: NumericConstructDisposition;
  readonly start: number;
  readonly end: number;
  readonly value: string;
}
