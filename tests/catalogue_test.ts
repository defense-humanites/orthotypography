import assert from "node:assert/strict";
import {
  PRESETS,
  RULES,
  SOURCES,
  validateCatalogue,
} from "../src/catalogue/mod.ts";

Deno.test("the documentary catalogue is internally consistent", () => {
  assert.deepEqual(validateCatalogue(SOURCES, RULES, PRESETS), []);
});
