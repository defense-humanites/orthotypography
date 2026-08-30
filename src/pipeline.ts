import {
  type ApplicationDiagnosticLocation,
  type DiagnosticLocation,
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

interface PipelineSegment extends TextSegment {
  readonly sourceIndex: number;
  readonly sourceStart: number;
  readonly revision: number;
}

function phaseIndex(rule: RuntimeRule): number {
  return RULE_PHASES.indexOf(rule.definition.phase);
}

function splitProtectedRanges(
  segment: PipelineSegment,
  protections: readonly ProtectionRange[],
): readonly PipelineSegment[] {
  if (protections.length === 0) return [segment];

  const ordered = [...protections].sort((left, right) =>
    left.start - right.start
  );
  const result: PipelineSegment[] = [];
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
      result.push({
        ...segment,
        value: segment.value.slice(cursor, protection.start),
        sourceStart: segment.sourceStart + cursor,
      });
    }
    result.push({
      ...segment,
      value: segment.value.slice(protection.start, protection.end),
      protected: true,
      sourceStart: segment.sourceStart + protection.start,
    });
    cursor = protection.end;
  }

  if (cursor < segment.value.length) {
    result.push({
      ...segment,
      value: segment.value.slice(cursor),
      sourceStart: segment.sourceStart + cursor,
    });
  }
  return result;
}

function validateRange(
  start: number,
  end: number,
  length: number,
  label: string,
): void {
  if (
    !Number.isInteger(start) || !Number.isInteger(end) || start < 0 ||
    end < start || end > length
  ) {
    throw new Error(`Invalid ${label} range: ${start}:${end}`);
  }
}

function diagnosticLocation(
  location: ApplicationDiagnosticLocation,
  segments: readonly PipelineSegment[],
  sourceSegments: readonly TextSegment[],
  sourceCoordinates: boolean,
): DiagnosticLocation {
  const segment = segments[location.segmentIndex];
  if (segment === undefined) {
    throw new Error(`Invalid diagnostic segment: ${location.segmentIndex}`);
  }
  validateRange(
    location.start,
    location.end,
    segment.value.length,
    "diagnostic",
  );

  if (sourceCoordinates) {
    const source = sourceSegments[segment.sourceIndex];
    return {
      coordinateSpace: "source",
      segmentIndex: segment.sourceIndex,
      ...(source.id === undefined ? {} : { segmentId: source.id }),
      segmentValue: source.value,
      segmentRevision: 0,
      start: segment.sourceStart + location.start,
      end: segment.sourceStart + location.end,
    };
  }

  return {
    coordinateSpace: "runtime",
    segmentIndex: location.segmentIndex,
    ...(segment.id === undefined ? {} : { segmentId: segment.id }),
    segmentValue: segment.value,
    segmentRevision: segment.revision,
    start: location.start,
    end: location.end,
  };
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
  const sourceSegments: readonly TextSegment[] = typeof input === "string"
    ? [{ value: input }]
    : input.map((segment) => ({ ...segment }));
  const ids = new Set<string>();
  for (const segment of sourceSegments) {
    if (segment.id === undefined) continue;
    if (segment.id.length === 0 || ids.has(segment.id)) {
      throw new Error(`Invalid or duplicate source segment ID: ${segment.id}`);
    }
    ids.add(segment.id);
  }
  const segments: PipelineSegment[] = sourceSegments.map((segment, index) => ({
    ...segment,
    sourceIndex: index,
    sourceStart: 0,
    revision: 0,
  }));
  const diagnostics: RuleDiagnostic[] = [];
  const appliedRuleIds: string[] = [];
  const orderedRules = compilePipeline(runtimeRules);
  const sourceCoordinates = options.mode === "lint";

  for (const rule of orderedRules) {
    if (!rule.definition.locales.includes(options.locale)) continue;
    const mode = options.mode ?? rule.definition.defaultMode;
    appliedRuleIds.push(rule.definition.id);
    const nextSegments: PipelineSegment[] = [];
    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
      const segment = segments[segmentIndex];
      if (segment.protected) {
        nextSegments.push(segment);
        continue;
      }

      const application = rule.apply(segment.value, {
        locale: options.locale,
        mode,
        segments,
        segmentIndex,
      });
      if (sourceCoordinates && application.value !== segment.value) {
        throw new Error(
          `Rule ${rule.definition.id} cannot transform text in lint mode`,
        );
      }
      if (
        (application.protections?.length ?? 0) > 0 &&
        application.value !== segment.value
      ) {
        throw new Error(
          `Rule ${rule.definition.id} cannot transform and protect in one pass`,
        );
      }
      const appliedSegment: PipelineSegment = {
        ...segment,
        value: application.value,
        revision: application.value === segment.value
          ? segment.revision
          : segment.revision + 1,
      };
      nextSegments.push(
        ...splitProtectedRanges(
          appliedSegment,
          application.protections ?? [],
        ),
      );
      for (const diagnostic of application.diagnostics ?? []) {
        const location = diagnosticLocation(
          { segmentIndex, start: diagnostic.start, end: diagnostic.end },
          segments,
          sourceSegments,
          sourceCoordinates,
        );
        diagnostics.push({
          ...location,
          ruleId: rule.definition.id,
          message: diagnostic.message,
          ...(diagnostic.replacement === undefined
            ? {}
            : { replacement: diagnostic.replacement }),
          ...(diagnostic.related === undefined ? {} : {
            related: diagnostic.related.map((related) =>
              diagnosticLocation(
                related,
                segments,
                sourceSegments,
                sourceCoordinates,
              )
            ),
          }),
        });
      }
    }
    segments.splice(0, segments.length, ...nextSegments);
  }

  return {
    value: segments.map((segment) => segment.value).join(""),
    segments: segments.map(({ id, value, protected: isProtected }) => ({
      ...(id === undefined ? {} : { id }),
      value,
      ...(isProtected === undefined ? {} : { protected: isProtected }),
    })),
    diagnostics,
    appliedRuleIds,
  };
}
