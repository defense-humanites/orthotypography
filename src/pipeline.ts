import {
  type PipelineResult,
  RULE_PHASES,
  type RuleDiagnostic,
  type RuleMode,
  type RuntimeRule,
  type TextSegment,
} from "./model.ts";

export interface PipelineOptions {
  readonly locale: string;
  readonly mode?: RuleMode;
}

function phaseIndex(rule: RuntimeRule): number {
  return RULE_PHASES.indexOf(rule.definition.phase);
}

/**
 * Orders executable rules by phase and documentary dependencies.
 *
 * The function rejects duplicate IDs, missing dependencies, backward phase
 * dependencies, and dependency cycles before any text is touched.
 */
export function compilePipeline(
  runtimeRules: readonly RuntimeRule[],
): readonly RuntimeRule[] {
  const byId = new Map<string, RuntimeRule>();
  for (const rule of runtimeRules) {
    if (byId.has(rule.definition.id)) {
      throw new Error(`Duplicate runtime rule: ${rule.definition.id}`);
    }
    byId.set(rule.definition.id, rule);
  }

  for (const rule of runtimeRules) {
    for (const dependency of rule.definition.dependsOn ?? []) {
      const dependencyRule = byId.get(dependency);
      if (dependencyRule === undefined) {
        throw new Error(
          `Missing dependency ${dependency} for ${rule.definition.id}`,
        );
      }
      if (phaseIndex(dependencyRule) > phaseIndex(rule)) {
        throw new Error(
          `Backward phase dependency ${dependency} for ${rule.definition.id}`,
        );
      }
    }
  }

  const ordered: RuntimeRule[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (rule: RuntimeRule): void => {
    const id = rule.definition.id;
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Rule dependency cycle at ${id}`);

    visiting.add(id);
    for (const dependency of rule.definition.dependsOn ?? []) {
      const dependencyRule = byId.get(dependency);
      if (dependencyRule === undefined) {
        throw new Error(`Missing dependency ${dependency} for ${id}`);
      }
      visit(dependencyRule);
    }
    visiting.delete(id);
    visited.add(id);
    ordered.push(rule);
  };

  const byPhase = [...runtimeRules].sort((left, right) =>
    phaseIndex(left) - phaseIndex(right)
  );
  for (const rule of byPhase) visit(rule);
  return ordered;
}

/** Runs pure atomic rules on text segments while preserving protected nodes. */
export function runPipeline(
  input: string | readonly TextSegment[],
  runtimeRules: readonly RuntimeRule[],
  options: PipelineOptions,
): PipelineResult {
  const segments: TextSegment[] = typeof input === "string"
    ? [{ value: input }]
    : input.map((segment) => ({ ...segment }));
  const diagnostics: RuleDiagnostic[] = [];
  const appliedRuleIds: string[] = [];
  const orderedRules = compilePipeline(runtimeRules);

  for (const rule of orderedRules) {
    const mode = options.mode ?? rule.definition.defaultMode;
    appliedRuleIds.push(rule.definition.id);
    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
      const segment = segments[segmentIndex];
      if (segment.protected) continue;

      const application = rule.apply(segment.value, {
        locale: options.locale,
        mode,
      });
      segments[segmentIndex] = { ...segment, value: application.value };
      for (const diagnostic of application.diagnostics ?? []) {
        diagnostics.push({
          ...diagnostic,
          ruleId: rule.definition.id,
          segmentIndex,
        });
      }
    }
  }

  return {
    value: segments.map((segment) => segment.value).join(""),
    segments,
    diagnostics,
    appliedRuleIds,
  };
}
