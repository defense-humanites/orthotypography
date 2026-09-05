# orthotypography

Source-backed orthotypographic primitives and named editorial presets for the
JavaScript ecosystem, including browsers and server runtimes.

The `0.1.0-alpha.1` release is a public preview. Its API and rule
catalogue may change during the alpha series. The canonical TypeScript package
is distributed through JSR; an equivalent ESM package is generated from the same
sources for npm.

## Installation

```sh
deno add jsr:@orthotypography/core@0.1.0-alpha.1
npm install @orthotypography/core@alpha
```

## Current status

The repository contains a documentary catalogue, a machine-readable rule model,
two candidate French presets, the generic pipeline infrastructure, a
numeric-context classifier, and executable punctuation rules. The
source-specific high-punctuation composition protects technical and numeric
contexts before transforming text. Text-node integrations preserve inline
formatting boundaries while punctuation and paired guillemets can inspect one
logical run across those boundaries.

```ts
import { IMPRIMERIE_NATIONALE_RULES, runPipeline } from "@orthotypography/core";
import { PRESETS, RULES } from "@orthotypography/core/catalogue";

const result = runPipeline(
  "Bonjour , monde : 25%.",
  IMPRIMERIE_NATIONALE_RULES,
  { locale: "fr-FR" },
);

console.log(result.value);
// "Bonjour, monde\u00a0: 25\u00a0%."

// In fix mode, source-coordinate changes can be applied individually by
// editors while preserving stable rule provenance.
console.log(result.changes);
```

See [`docs/architecture-v0.4.md`](./docs/architecture-v0.4.md) for the technical
boundaries and
[`docs/depouillement-lexique-v0.3.md`](./docs/depouillement-lexique-v0.3.md) for
the first French source review.

## Development

```sh
deno task check
deno task test
deno task publish:check
deno task npm:check
deno task currency:update
```

## License

MIT © Antoine Boquet. Contributions are accepted under the same license; see
[`CONTRIBUTING.md`](./CONTRIBUTING.md).
