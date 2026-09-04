# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Add source-coordinate `TextChange` sets with optimistic `expected` guards.
- Compose rule provenance across successive edits without reconstructing a
  post-processing diff.
- Let runtime rules expose precise atomic edits while retaining a conservative
  whole-fragment fallback for existing rules.
- Apply one rule's edits as an atomic transaction across neighboring text
  segments.
- Normalize French high punctuation across inline formatting boundaries while
  preserving split technical and expressive sequences.

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
