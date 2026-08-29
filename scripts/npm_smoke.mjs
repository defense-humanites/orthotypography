import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { compilePipeline, runPipeline } from "../npm/esm/mod.js";
import { RULES } from "../npm/esm/catalogue.js";

const packageJson = JSON.parse(
  await readFile(new URL("../npm/package.json", import.meta.url), "utf8"),
);

assert.equal(packageJson.name, "@orthotypography/core");
assert.equal(packageJson.license, "MIT");
assert.equal(typeof runPipeline, "function");
assert.equal(typeof compilePipeline, "function");
assert.ok(Array.isArray(RULES));
assert.ok(RULES.length > 0);

console.log("npm ESM smoke test passed");
