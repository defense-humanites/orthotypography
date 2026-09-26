# Contributing to Orthotypography

Thank you for helping improve Orthotypography.

## Before contributing

For substantial changes, open an issue first so that the proposed behavior,
documentary sources, affected language or style presets, and compatibility
requirements can be discussed before implementation.

Every orthotypographic rule should be traceable to an identified authority.
Contributions should include relevant positive examples, negative examples,
exceptions, and tests whenever applicable.

## Development

The project uses Deno 2 as its canonical development environment. Deno is not
required to consume the published packages: source code must remain portable to
the supported JavaScript runtimes and browsers unless a runtime-specific entry
point explicitly states otherwise.

The tasks are defined in [`deno.json`](deno.json):

```sh
deno task check          # formatting, lint, type checks, and API documentation
deno task test           # test suite
deno task publish:check  # JSR dry run
deno task npm:check      # npm build, smoke test, and pack dry run
```

Run `check` and `test` for every source change. Run `publish:check` and
`npm:check` as well when a change affects the public API, dependencies, or
packaging. The formatter configuration does not include Markdown, so format
changed Markdown files explicitly, for example with `deno fmt CONTRIBUTING.md`.

`deno task currency:update` refreshes the ISO 4217 currency data from its
official source; submit the regenerated data in a dedicated change.

## Pull requests

Work on a dedicated branch based on the current `main` and keep each pull
request focused on one task. Describe the checks you ran and any known
limitation. Add user-facing changes to the `Unreleased` section of
[`CHANGELOG.md`](CHANGELOG.md).

A behavioral rule change should:

- cite the authority and locator that justify it in the catalogue;
- distinguish the documentary catalogue entry from the executable rule, and
  state its default mode and preset membership;
- cover positive cases, negative cases, protected content, and text split across
  segments, and check idempotence where applicable;
- update the relevant documents in `docs/`, including the coverage matrix.

The engine stays independent of Markdown or HTML parsers and editor APIs; those
adapters belong in
[orthotypography-integrations](https://github.com/defense-humanites/orthotypography-integrations).

French is accepted only in `docs/`. Code, comments, API documentation, tests,
commit messages, pull requests, and the other repository files are written in
English, except for linguistic data under test and source titles.

## License of contributions

By submitting a contribution to this repository, you agree that your
contribution is licensed under the MIT License that applies to this project.

You represent that you have the right to submit the contribution under those
terms. If you contribute on behalf of an employer or another organization, you
are responsible for ensuring that you have the necessary authorization.

See [LICENSE](LICENSE) for the complete license text.
