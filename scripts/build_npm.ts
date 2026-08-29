import { build, emptyDir } from "@deno/dnt";
import denoConfig from "../deno.json" with { type: "json" };

const OUT_DIR = "./npm";
const DOCUMENTS = [
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
  "RELEASING.md",
] as const;

if (denoConfig.name !== "@orthotypography/core") {
  throw new Error(`Unexpected package name: ${denoConfig.name}`);
}
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(denoConfig.version)) {
  throw new Error(`Invalid package version: ${denoConfig.version}`);
}

await emptyDir(OUT_DIR);

await build({
  entryPoints: [
    { name: ".", path: "./src/mod.ts" },
    { name: "./catalogue", path: "./src/catalogue/mod.ts" },
  ],
  outDir: OUT_DIR,
  esModule: true,
  scriptModule: false,
  declaration: "separate",
  declarationMap: true,
  typeCheck: "single",
  test: false,
  compilerOptions: { target: "ES2022" },
  shims: {},
  package: {
    name: denoConfig.name,
    version: denoConfig.version,
    description:
      "Source-backed orthotypographic primitives and presets for JavaScript runtimes and browsers.",
    author: "Antoine Boquet",
    license: denoConfig.license,
    homepage: "https://github.com/defense-humanites/orthotypography#readme",
    repository: {
      type: "git",
      url: "git+https://github.com/defense-humanites/orthotypography.git",
    },
    bugs: {
      url: "https://github.com/defense-humanites/orthotypography/issues",
    },
    keywords: [
      "typography",
      "orthotypography",
      "unicode",
      "french",
      "localization",
      "text-processing",
      "humanities",
    ],
    engines: { node: ">=18" },
  },
  async postBuild(): Promise<void> {
    for (const document of DOCUMENTS) {
      await Deno.copyFile(document, `${OUT_DIR}/${document}`);
    }
    await Deno.mkdir(`${OUT_DIR}/docs`, { recursive: true });
    for await (const entry of Deno.readDir("docs")) {
      if (entry.isFile && entry.name.endsWith(".md")) {
        await Deno.copyFile(
          `docs/${entry.name}`,
          `${OUT_DIR}/docs/${entry.name}`,
        );
      }
    }
  },
});
