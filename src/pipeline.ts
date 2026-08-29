import {
  type PipelineResult,
  type ProtectionRange,
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

function splitProtectedRanges(
  segment: TextSegment,
  protections: readonly ProtectionRange[],
): readonly TextSegment[] {
  if (protections.length === 0) return [segment];

  const ordered = [...protections].sort((left, right) =>
    left.start - right.start
  );
  const result: TextSegment[] = [];
  let cursor = 0;

  for (const protection of ordered) {
    if (
      !Number.isInteger(protection.start) ||
      !Number.isInteger(protection.end) ||
      protection.start < cursor ||
      protection.start < 0 ||
      protection.end <= protection.start ||
      protection.end > segment.value.length
    ) {
      throw new Error(
        `Invalid protection range: ${protection.start}:${protection.end}`,
      );
    }
    if (cursor < protection.start) {
      result.push({ value: segment.value.slice(cursor, protection.start) });
    }
    result.push({
      value: segment.value.slice(protection.start, protection.end),
      protected: true,
    });
    cursor = protection.end;
  }

  if (cursor < segment.value.length) {
    result.push({ value: segment.value.slice(cursor) });
  }
  return result;
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
    if (!rule.definition.locales.includes(options.locale)) continue;
    const mode = options.mode ?? rule.definition.defaultMode;
    appliedRuleIds.push(rule.definition.id);
    const nextSegments: TextSegment[] = [];
    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
      const segment = segments[segmentIndex];
      if (segment.protected) {
        nextSegments.push(segment);
        continue;
      }

      const application = rule.apply(segment.value, {
        locale: options.locale,
        mode,
      });
      if (
        (application.protections?.length ?? 0) > 0 &&
        application.value !== segment.value
      ) {
        throw new Error(
          `Rule ${rule.definition.id} cannot transform and protect in one pass`,
        );
      }
      const appliedSegment = { ...segment, value: application.value };
      nextSegments.push(
        ...splitProtectedRanges(
          appliedSegment,
          application.protections ?? [],
        ),
      );
      for (const diagnostic of application.diagnostics ?? []) {
        diagnostics.push({
          ...diagnostic,
          ruleId: rule.definition.id,
          segmentIndex,
        });
      }
    }
    segments.splice(0, segments.length, ...nextSegments);
  }

  return {
    value: segments.map((segment) => segment.value).join(""),
    segments,
    diagnostics,
    appliedRuleIds,
  };
}
