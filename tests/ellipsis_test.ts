import assert from "node:assert/strict";
import {
  ETC_ELLIPSIS_RULE,
  IMPRIMERIE_NATIONALE_RULES,
  runPipeline,
  runTextNodePipeline,
} from "../src/mod.ts";

Deno.test("suspension points after etc. are removed", () => {
  const result = runPipeline(
    "Liste, etc... Suite; etc.... Fin; etc.… Terminé.",
    [ETC_ELLIPSIS_RULE],
    { locale: "fr-FR" },
  );

  assert.equal(result.value, "Liste, etc. Suite; etc. Fin; etc. Terminé.");
  assert.equal(result.diagnostics.length, 3);
});

Deno.test("the etc. rule preserves non-target and technical text", () => {
  const input =
    "Etc. alone, etc.., projectetc..., etc...suffix, /etc/... and file.etc...name";
  const result = runPipeline(input, [ETC_ELLIPSIS_RULE], {
    locale: "fr-FR",
  });

  assert.equal(result.value, input);
  assert.deepEqual(result.diagnostics, []);
});

Deno.test("the etc. rule crosses unprotected text-node boundaries", () => {
  const result = runTextNodePipeline(
    [
      { id: "word-start", value: "Liste, et" },
      { id: "word-end", value: "c." },
      { id: "space", value: " " },
      { id: "ellipsis", value: "…" },
      { id: "tail", value: " Suite." },
    ],
    [ETC_ELLIPSIS_RULE],
    { locale: "fr-FR", mode: "fix" },
  );

  assert.equal(result.value, "Liste, etc. Suite.");
  assert.deepEqual(
    result.nodes.map(({ value }) => value),
    ["Liste, et", "c.", "", "", " Suite."],
  );
  assert.deepEqual(
    result.changes.map(({ segmentId, expected, replacement }) => ({
      segmentId,
      expected,
      replacement,
    })),
    [
      { segmentId: "space", expected: " ", replacement: "" },
      { segmentId: "ellipsis", expected: "…", replacement: "" },
    ],
  );
});

Deno.test("the etc. rule does not cross protected segments", () => {
  const result = runPipeline(
    [
      { value: "Liste, etc." },
      { value: " ", protected: true },
      { value: "… Suite." },
    ],
    [ETC_ELLIPSIS_RULE],
    { locale: "fr-FR" },
  );

  assert.equal(result.value, "Liste, etc. … Suite.");
  assert.deepEqual(result.diagnostics, []);
});

Deno.test("the etc. rule supports lint mode with source coordinates", () => {
  const input = "Liste, etc.… Suite.";
  const result = runPipeline(input, [ETC_ELLIPSIS_RULE], {
    locale: "fr-FR",
    mode: "lint",
  });

  assert.equal(result.value, input);
  assert.deepEqual(result.changes, []);
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].coordinateSpace, "source");
  assert.equal(result.diagnostics[0].start, 7);
  assert.equal(result.diagnostics[0].end, 11);
});

Deno.test("the etc. rule reports changes in original UTF-16 coordinates", () => {
  const result = runPipeline("🚀 etc.…", [ETC_ELLIPSIS_RULE], {
    locale: "fr-FR",
  });

  assert.deepEqual(result.changes, [{
    segmentIndex: 0,
    start: 7,
    end: 8,
    expected: "…",
    replacement: "",
    ruleIds: ["punctuation.ellipsis.after-etc.forbidden"],
  }]);
});

Deno.test("the Imprimerie nationale preset applies the etc. rule idempotently", () => {
  const first = runPipeline(
    "Liste, etc... Suite.",
    IMPRIMERIE_NATIONALE_RULES,
    {
      locale: "fr-FR",
    },
  );
  const second = runPipeline(first.value, IMPRIMERIE_NATIONALE_RULES, {
    locale: "fr-FR",
  });

  assert.equal(first.value, "Liste, etc. Suite.");
  assert.equal(second.value, first.value);
  assert.deepEqual(second.diagnostics, []);
});

Deno.test("the etc. rule is scoped to metropolitan French", () => {
  const input = "Liste, etc... Suite.";
  const result = runPipeline(input, [ETC_ELLIPSIS_RULE], {
    locale: "fr-CA",
  });

  assert.equal(result.value, input);
  assert.deepEqual(result.appliedRuleIds, []);
});
