# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Fix currency classification so that a symbol already following an amount is no
  longer reattached to the next amount: `25 € 30 €` stays unchanged instead of
  becoming `25 30 € €` with the euro rule in `fix` mode (#30).
- Group decimal parts by threes only when classifying numbers, so that `12,5 12`
  is no longer read as one number (#30).
- Protect times with seconds (`23:45:10`) and drive-letter paths
  (`C:\Temp\rapport.txt`, `D:/data`) from colon spacing. The numeric classifier
  reports the new `path` construct kind (#32).
- Stop removing the space before a run of periods in
  `punctuation.period.no-space-before`. Suspension points follow their own
  spacing rules, and a space before them is correct when they stand for a word
  (`Il m’a traité de ... devant tout le monde.`); `Alors ...` is now left
  unchanged, like `Alors …`, and the composition with the ellipsis glyph rule is
  stable in one pass (#31).

## [0.1.0-alpha.3] - 2026-09-26

- Insert missing spaces after commas in safe prose contexts, including across
  unprotected text segments, while preserving numeric and technical syntax
  (`SPACE_AFTER_COMMA_RULE`). The rule is part of `IMPRIMERIE_NATIONALE_RULES`
  and `IMPRIMERIE_NATIONALE_PUNCTUATION_RULES`, so both compositions can now
  produce additional changes.
- Remove suspension points after standalone `etc.` across unprotected text
  segments while preserving source UTF-16 coordinates (`ETC_ELLIPSIS_RULE`, part
  of `IMPRIMERIE_NATIONALE_RULES`).
- Execute and diagnose the spaces following colons, semicolons, question marks,
  and exclamation marks under their own rule IDs. `HIGH_PUNCTUATION_RULES` now
  contains eight atomic rules instead of four; fixed text is unchanged, but
  diagnostics, `appliedRuleIds`, and `TextChange.ruleIds` report the new
  `*.space-after` IDs.
- Recognize certain final and structurally initial ellipses written as `U+2026`
  or exactly three `U+002E`. `ELLIPSIS_GLYPH_RULE` diagnoses the ASCII form by
  default and converts it to `…` in explicit `fix` mode;
  `ELLIPSIS_RECOGNITION_RULE` is an alias of the same rule.
- Add `ELLIPSIS_INITIAL_SPACE_AFTER_RULE`, which diagnoses a missing space after
  a structurally initial `…` followed by a letter and inserts `U+0020` in
  explicit `fix` mode.
- Add `DIGIT_GROUPING_RULE` (`number.digits.grouping`), a diagnostic-only rule
  for ungrouped digits in classified measurements, percentages, and currency
  amounts. It never emits changes.
- The ellipsis and digit grouping rules default to `lint` and belong to no
  preset.
- Add atomic documentary catalogue entries for word spacing after periods,
  colons, semicolons, question marks, and exclamation marks, and for the
  ellipsis glyph and its spacing functions.
- Add a source-backed coverage matrix for the Imprimerie nationale preset and
  specifications for ellipses and digit grouping.
- Add explicit public API types required by current Deno 2 lint checks.

## [0.1.0-alpha.2] - 2026-09-09

- Add `applyTextChanges` for guarded application of source-coordinate changes to
  strings and segmented documents.

## [0.1.0-alpha.1] - 2026-09-05

- Add source-coordinate `TextChange` sets with optimistic `expected` guards.
- Compose rule provenance across successive edits without reconstructing a
  post-processing diff.
- Let runtime rules expose precise atomic edits while retaining a conservative
  whole-fragment fallback for existing rules.
- Apply one rule's edits as an atomic transaction across neighboring text
  segments.
- Normalize French high punctuation across inline formatting boundaries while
  preserving split technical and expressive sequences.
- Remove whitespace before commas and periods when it belongs to neighboring
  inline text segments.

## [0.1.0-alpha.0] - 2026-09-01

- Add the JavaScript package scaffold and coordinated JSR/npm distribution
  model.
- Add the machine-readable documentary catalogue and candidate French presets.
- Add the generic ordered pipeline with protected segment support.
- Add a pure classifier for protected and transformable numeric constructs.
- Add safe executable rules for whitespace before commas and periods.
- Convert classified ranges into stable protected segments in the pipeline.
- Add source-specific French spacing rules for colons, semicolons, question
  marks, and exclamation marks.
- Add classified no-break spacing before percentage and per-mille symbols.
- Add paired French-guillemet spacing across protected numeric segments.
- Add a versioned, case-sensitive BIPM registry for SI units and prefixes.
- Add registry-backed unit-spacing diagnostics with explicit opt-in fixes.
- Add an ambiguity-aware monetary registry and opt-in euro-symbol fixes.
- Add a validated, provenance-preserving importer for SIX ISO 4217 List One.
- Resolve conservative SI products, quotients, and Unicode powers.
- Parse parenthesized SI expressions into a public, read-only AST.
