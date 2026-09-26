import assert from "node:assert/strict";
import {
  computeSnapshots,
  readCorpus,
  readSnapshots,
} from "./support/corpus.ts";

Deno.test("corpus outputs match the committed snapshots", async () => {
  const actual = computeSnapshots(await readCorpus());
  const expected = await readSnapshots();
  assert.deepEqual(Object.keys(actual), Object.keys(expected));
  for (const key of Object.keys(expected)) {
    assert.deepEqual(
      actual[key],
      expected[key],
      `${key} changed; run deno task corpus:update if intended`,
    );
  }
});
