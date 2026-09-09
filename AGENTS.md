# Agent instructions

This repository owns `@orthotypography/core`. Editor and Markdown adapters
belong in
[orthotypography-integrations](https://github.com/defense-humanites/orthotypography-integrations).

## Language

French is accepted only in `docs/`. Write all authored prose outside `docs/` in
English, including this file, every README, root-level documentation, code
comments, API documentation, and test descriptions. Use English for commit
messages and pull request descriptions. Preserve language-specific text under
test, source titles, and identifiers as data; this does not permit French
explanatory prose outside `docs/`. Track existing violations in the roadmap and
address them in scoped changes.

## Repository workflow

- Read `docs/roadmap.md` and the relevant source and tests before starting.
  Verify claims against the repository and releases; chat summaries can be
  stale.
- Git history has previously been rewritten. Before any edit, verify the current
  remote target branch SHA and base the work on that exact history. Preserve
  unrelated local changes; use a fresh checkout or worktree when needed.
- Recheck the remote head before pushing. If it moved, integrate the new state
  and review the result. Never force-push or restore an obsolete snapshot.
- Keep each task and commit focused. Use a dedicated branch and a reviewable PR
  for implementation unless the user explicitly authorizes a direct push.
- Record public API decisions and cross-repository dependencies in the issue or
  documentation. Coordinate changes to shared configuration and release scripts.
- Update the roadmap when a milestone changes. Distinguish planned, implemented,
  validated offline, validated live, and published; link supporting evidence.
- Complete implementation, appropriate validation, and documentation within the
  authorized scope. Report actual checks, failures, and remaining limitations. A
  green test run does not establish live editor compatibility or publication.
- Follow `RELEASING.md` for releases. Publishing packages requires authorization
  covering that release; a documentation push does not authorize publication.

## Runtime and design

Target the JavaScript ecosystem, including browsers and server runtimes. Deno 2
is the canonical development environment, not a required consumer runtime. Keep
runtime-specific facilities at explicit boundaries. Preserve deterministic,
source-backed rules, protected content, source coordinates, and atomic edits. Do
not introduce a model service into the normalization engine.

## Core boundaries

- Keep HTML/Markdown parsing, editor APIs, OAuth, and native transactions
  outside core. Core exposes normalization, diagnostics, and guarded text
  changes.
- Distinguish documentary catalogue entries from executable lint and fix rules.
  Identify each rule's authority, exceptions, and preset membership.
- Preserve original UTF-16 coordinates, segment identities, expected-text
  guards, protection, and all-or-nothing validation in `applyTextChanges`.
- For behavioral changes, cover positive cases, negative cases, protected
  contexts, and relevant cross-node cases. Check idempotence where applicable.
- Coordinate integration-facing contract changes with the integrations roadmap.
  Consumers must use a compatible published core version or an explicitly
  documented immutable development dependency.

## Validation

Run `deno task check` and `deno task test` for source changes. For public API,
dependency, or packaging changes, also run `deno task publish:check` and
`deno task npm:check`. These commands are defined in `deno.json`. For
documentation-only changes, inspect Markdown, links, and factual claims; do not
add implementation-mirroring tests. The root formatter configuration does not
include Markdown, so check changed Markdown explicitly.
