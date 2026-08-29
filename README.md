# orthotypography

Source-backed orthotypographic primitives and named editorial presets for the JavaScript ecosystem, including browsers and server runtimes.

The canonical package will be published as `@orthotypography/core` on JSR, with an equivalent npm package generated from the same TypeScript sources. No registry release is enabled yet.

## Current status

The repository contains a documentary catalogue, a machine-readable rule model, two candidate French presets, the generic pipeline infrastructure, and a first numeric-context classifier. Executable correction rules are intentionally deferred until their negative vectors are specified.

```ts
import { runPipeline } from "@orthotypography/core";
import { PRESETS, RULES } from "@orthotypography/core/catalogue";
```

See [`docs/architecture-v0.4.md`](./docs/architecture-v0.4.md) for the technical boundaries and [`docs/depouillement-lexique-v0.3.md`](./docs/depouillement-lexique-v0.3.md) for the first French source review.

## Development

```sh
deno task check
deno task test
deno task publish:check
deno task npm:check
```

## License

MIT © Antoine Boquet. Contributions are accepted under the same license; see [`CONTRIBUTING.md`](./CONTRIBUTING.md).
