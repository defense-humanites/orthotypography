/**
 * Measures pipeline time on repeated corpus text.
 *
 * Usage: `deno task bench [--quick | --full]`. The default sizes are 25,000 and
 * 125,000 characters; `--quick` keeps the smallest size and `--full` adds
 * 500,000 characters. Each size runs as one segment and as nodes of about 120
 * characters, in lint and fix modes.
 */
import {
  IMPRIMERIE_NATIONALE_RULES,
  runPipeline,
  runTextNodePipeline,
} from "../src/mod.ts";
import type { RuleMode } from "../src/model.ts";

const corpusFiles = ["prose.txt", "technique.txt", "nombres.txt"];
const corpusDirectory = new URL("../tests/fixtures/corpus/", import.meta.url);

const sizes = Deno.args.includes("--quick")
  ? [25_000]
  : Deno.args.includes("--full")
  ? [25_000, 125_000, 500_000]
  : [25_000, 125_000];

const corpus = (await Promise.all(
  corpusFiles.map((file) => Deno.readTextFile(new URL(file, corpusDirectory))),
)).join("\n");

function textOfSize(size: number): string {
  let text = "";
  while (text.length < size) text += corpus;
  const cut = text.lastIndexOf(" ", size);
  return text.slice(0, cut > 0 ? cut : size);
}

function nodesOf(text: string): { id: string; value: string }[] {
  const nodes: { id: string; value: string }[] = [];
  let start = 0;
  while (start < text.length) {
    const next = text.indexOf(" ", start + 120);
    const end = next === -1 ? text.length : next + 1;
    nodes.push({ id: `n${nodes.length}`, value: text.slice(start, end) });
    start = end;
  }
  return nodes;
}

function measure(run: () => void): number {
  const samples: number[] = [];
  const started = performance.now();
  do {
    const start = performance.now();
    run();
    samples.push(performance.now() - start);
  } while (samples.length < 3 && performance.now() - started < 5_000);
  samples.sort((left, right) => left - right);
  return samples[Math.floor(samples.length / 2)];
}

const modes: readonly RuleMode[] = ["lint", "fix"];
console.log("| Input | Characters | Mode | Median time |");
console.log("| --- | ---: | --- | ---: |");
for (const size of sizes) {
  const text = textOfSize(size);
  const nodes = nodesOf(text);
  for (const mode of modes) {
    const single = measure(() =>
      runPipeline(text, IMPRIMERIE_NATIONALE_RULES, { locale: "fr-FR", mode })
    );
    console.log(
      `| one segment | ${text.length} | ${mode} | ${single.toFixed(0)} ms |`,
    );
    const segmented = measure(() =>
      runTextNodePipeline(nodes, IMPRIMERIE_NATIONALE_RULES, {
        locale: "fr-FR",
        mode,
      })
    );
    console.log(
      `| ${nodes.length} nodes | ${text.length} | ${mode} | ${
        segmented.toFixed(0)
      } ms |`,
    );
  }
}
