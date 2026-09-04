import {
  type ApplicationDiagnosticLocation,
  type DiagnosticLocation,
  type PipelineResult,
  type ProtectionRange,
  RULE_PHASES,
  type RuleApplicationEdit,
  type RuleDiagnostic,
  type RuleMode,
  type RuntimeRule,
  type TextChange,
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

interface LedgerPiece {
  readonly value: string;
  readonly sourceStart: number;
  readonly sourceEnd: number;
  readonly ruleIds: readonly string[];
}

interface ChangeLedger {
  readonly source: TextSegment;
  pieces: LedgerPiece[];
}

function ledgerValue(ledger: ChangeLedger): string {
  return ledger.pieces.map(({ value }) => value).join("");
}

function addRuleIds(
  pieces: readonly LedgerPiece[],
  ruleId: string,
): readonly string[] {
  const ids = new Set<string>();
  for (const piece of pieces) {
    for (const id of piece.ruleIds) ids.add(id);
  }
  ids.add(ruleId);
  return [...ids];
}

function mergeRuleIds(pieces: readonly LedgerPiece[]): readonly string[] {
  const ids = new Set<string>();
  for (const piece of pieces) {
    for (const id of piece.ruleIds) ids.add(id);
  }
  return [...ids];
}

function coalesceLedgerPieces(pieces: readonly LedgerPiece[]): LedgerPiece[] {
  const result: LedgerPiece[] = [];
  for (const piece of pieces) {
    const previous = result.at(-1);
    const bothUnchanged = previous?.ruleIds.length === 0 &&
      piece.ruleIds.length === 0;
    const bothChanged = (previous?.ruleIds.length ?? 0) > 0 &&
      piece.ruleIds.length > 0;
    if (
      previous !== undefined && previous.sourceEnd === piece.sourceStart &&
      (bothUnchanged || bothChanged)
    ) {
      result[result.length - 1] = {
        value: previous.value + piece.value,
        sourceStart: previous.sourceStart,
        sourceEnd: piece.sourceEnd,
        ruleIds: bothChanged ? mergeRuleIds([previous, piece]) : [],
      };
    } else {
      result.push(piece);
    }
  }
  return result;
}

function expandChangedBoundaries(
  pieces: readonly LedgerPiece[],
  edit: RuleApplicationEdit,
): RuleApplicationEdit {
  let offset = 0;
  let start = edit.start;
  let end = edit.end;
  let prefix = "";
  let suffix = "";

  for (const piece of pieces) {
    const pieceStart = offset;
    const pieceEnd = offset + piece.value.length;
    if (
      piece.ruleIds.length > 0 && start > pieceStart && start < pieceEnd
    ) {
      prefix = piece.value.slice(0, start - pieceStart);
      start = pieceStart;
    }
    if (piece.ruleIds.length > 0 && end > pieceStart && end < pieceEnd) {
      suffix = piece.value.slice(end - pieceStart);
      end = pieceEnd;
    }
    offset = pieceEnd;
  }

  return { start, end, replacement: prefix + edit.replacement + suffix };
}

function splitUnchangedPieceAt(
  pieces: LedgerPiece[],
  target: number,
): void {
  let offset = 0;
  for (let index = 0; index < pieces.length; index++) {
    const piece = pieces[index];
    const end = offset + piece.value.length;
    if (target > offset && target < end) {
      if (piece.ruleIds.length > 0) {
        throw new Error("Cannot split changed ledger piece");
      }
      const local = target - offset;
      const sourceMiddle = piece.sourceStart + local;
      pieces.splice(index, 1, {
        value: piece.value.slice(0, local),
        sourceStart: piece.sourceStart,
        sourceEnd: sourceMiddle,
        ruleIds: [],
      }, {
        value: piece.value.slice(local),
        sourceStart: sourceMiddle,
        sourceEnd: piece.sourceEnd,
        ruleIds: [],
      });
      return;
    }
    offset = end;
  }
}

function ledgerBoundaryIndex(
  pieces: readonly LedgerPiece[],
  target: number,
  side: "start" | "end",
): number {
  let offset = 0;
  for (let index = 0; index <= pieces.length; index++) {
    if (offset === target) {
      if (side === "start") return index;
      let afterEmpty = index;
      while (
        afterEmpty < pieces.length && pieces[afterEmpty].value.length === 0
      ) afterEmpty++;
      return afterEmpty;
    }
    const piece = pieces[index];
    if (piece !== undefined) offset += piece.value.length;
  }
  throw new Error(`Unlocatable ledger boundary: ${target}`);
}

function sourcePositionAt(
  pieces: readonly LedgerPiece[],
  boundary: number,
): number {
  return pieces[boundary]?.sourceStart ?? pieces[boundary - 1]?.sourceEnd ?? 0;
}

function applyLedgerEdit(
  ledger: ChangeLedger,
  rawEdit: RuleApplicationEdit,
  ruleId: string,
): void {
  validateRange(rawEdit.start, rawEdit.end, ledgerValue(ledger).length, "edit");
  const edit = expandChangedBoundaries(ledger.pieces, rawEdit);
  splitUnchangedPieceAt(ledger.pieces, edit.start);
  splitUnchangedPieceAt(ledger.pieces, edit.end);

  const startIndex = ledgerBoundaryIndex(ledger.pieces, edit.start, "start");
  const endIndex = ledgerBoundaryIndex(ledger.pieces, edit.end, "end");
  const removed = ledger.pieces.slice(startIndex, endIndex);
  const sourceStart = removed.length === 0
    ? sourcePositionAt(ledger.pieces, startIndex)
    : Math.min(...removed.map((piece) => piece.sourceStart));
  const sourceEnd = removed.length === 0
    ? sourceStart
    : Math.max(...removed.map((piece) => piece.sourceEnd));

  ledger.pieces.splice(startIndex, endIndex - startIndex, {
    value: edit.replacement,
    sourceStart,
    sourceEnd,
    ruleIds: addRuleIds(removed, ruleId),
  });
  ledger.pieces = coalesceLedgerPieces(ledger.pieces);
}

function applyEdits(
  value: string,
  edits: readonly RuleApplicationEdit[],
): string {
  let result = value;
  let previousStart = value.length + 1;
  for (
    const edit of [...edits].sort((left, right) => right.start - left.start)
  ) {
    validateRange(edit.start, edit.end, value.length, "edit");
    if (edit.end > previousStart) throw new Error("Overlapping rule edits");
    result = result.slice(0, edit.start) + edit.replacement +
      result.slice(edit.end);
    previousStart = edit.start;
  }
  return result;
}

function ledgerChanges(ledgers: readonly ChangeLedger[]): TextChange[] {
  const changes: TextChange[] = [];
  for (let segmentIndex = 0; segmentIndex < ledgers.length; segmentIndex++) {
    const ledger = ledgers[segmentIndex];
    const segmentChanges: TextChange[] = [];
    for (const piece of ledger.pieces) {
      if (piece.ruleIds.length === 0) continue;
      const expected = ledger.source.value.slice(
        piece.sourceStart,
        piece.sourceEnd,
      );
      if (expected === piece.value) continue;
      segmentChanges.push({
        segmentIndex,
        ...(ledger.source.id === undefined
          ? {}
          : { segmentId: ledger.source.id }),
        start: piece.sourceStart,
        end: piece.sourceEnd,
        expected,
        replacement: piece.value,
        ruleIds: piece.ruleIds,
      });
    }
    for (let index = 1; index < segmentChanges.length; index++) {
      if (segmentChanges[index].start < segmentChanges[index - 1].end) {
        throw new Error(
          `Overlapping source changes in segment ${segmentIndex}`,
        );
      }
    }
    let reconstructed = ledger.source.value;
    for (const change of [...segmentChanges].reverse()) {
      if (
        ledger.source.value.slice(change.start, change.end) !== change.expected
      ) {
        throw new Error(`Invalid expected value in segment ${segmentIndex}`);
      }
      reconstructed = reconstructed.slice(0, change.start) +
        change.replacement + reconstructed.slice(change.end);
    }
    if (reconstructed !== ledgerValue(ledger)) {
      throw new Error(`Source changes diverged for segment ${segmentIndex}`);
    }
    changes.push(...segmentChanges);
  }
  return changes;
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
  const ledgers: ChangeLedger[] = sourceSegments.map((source) => ({
    source,
    pieces: [{
      value: source.value,
      sourceStart: 0,
      sourceEnd: source.value.length,
      ruleIds: [],
    }],
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
    const processedLengths = new Map<number, number>();
    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
      const segment = segments[segmentIndex];
      const nodeOffset = processedLengths.get(segment.sourceIndex) ?? 0;
      if (segment.protected) {
        nextSegments.push(segment);
        processedLengths.set(
          segment.sourceIndex,
          nodeOffset + segment.value.length,
        );
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
      if (application.value !== segment.value) {
        const edits = (application.edits?.length ?? 0) > 0
          ? application.edits as readonly RuleApplicationEdit[]
          : [{
            start: 0,
            end: segment.value.length,
            replacement: application.value,
          }];
        if (
          application.edits !== undefined &&
          applyEdits(segment.value, application.edits) !== application.value
        ) {
          throw new Error(
            `Rule ${rule.definition.id} edits do not produce its value`,
          );
        }
        for (
          const edit of [...edits].sort((left, right) =>
            right.start - left.start
          )
        ) {
          applyLedgerEdit(ledgers[segment.sourceIndex], {
            start: nodeOffset + edit.start,
            end: nodeOffset + edit.end,
            replacement: edit.replacement,
          }, rule.definition.id);
        }
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
      processedLengths.set(
        segment.sourceIndex,
        nodeOffset + application.value.length,
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
    for (
      let sourceIndex = 0;
      sourceIndex < sourceSegments.length;
      sourceIndex++
    ) {
      const reconstructed = nextSegments
        .filter((segment) => segment.sourceIndex === sourceIndex)
        .map(({ value }) => value)
        .join("");
      if (ledgerValue(ledgers[sourceIndex]) !== reconstructed) {
        throw new Error(`Change ledger diverged for segment ${sourceIndex}`);
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
    changes: ledgerChanges(ledgers),
    diagnostics,
    appliedRuleIds,
  };
}
