import type { LogicalRun, RuleResult, RuntimeRule } from "../../src/model.ts";

/** Builds a test rule; its ID must use the `x-` prefix of external rules. */
export function testRule(
  id: string,
  apply: (run: LogicalRun) => RuleResult,
  options: Partial<
    Pick<RuntimeRule, "phase" | "locales" | "defaultMode" | "dependsOn">
  > = {},
): RuntimeRule {
  return {
    id,
    phase: "punctuation-spacing",
    locales: ["fr-FR"],
    defaultMode: "fix",
    ...options,
    apply,
  };
}
