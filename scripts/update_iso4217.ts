import { CURRENCIES } from "../src/registry/currency-data.ts";
import type { CurrencyRegistryProvenance } from "../src/registry/currency-types.ts";
import {
  collapseIso4217Currencies,
  compareCurrencies,
  parseIso4217ListOneXml,
  renderCurrencyDataModule,
  renderCurrencyDiffReport,
  SIX_LIST_ONE_URL,
} from "./iso4217.ts";

function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = Deno.args.find((argument) => argument.startsWith(prefix));
  if (inline !== undefined) return inline.slice(prefix.length);
  const index = Deno.args.indexOf(`--${name}`);
  return index === -1 ? undefined : Deno.args[index + 1];
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function loadXml(input: string | undefined): Promise<string> {
  if (input !== undefined) return await Deno.readTextFile(input);
  const response = await fetch(SIX_LIST_ONE_URL, {
    headers: { accept: "application/xml, text/xml" },
  });
  if (!response.ok) {
    throw new Error(`SIX List One download failed: HTTP ${response.status}`);
  }
  return await response.text();
}

if (import.meta.main) {
  const retrievedAt = option("retrieved-at") ??
    new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(retrievedAt)) {
    throw new Error(`Invalid retrieval date: ${retrievedAt}`);
  }

  const xml = await loadXml(option("input"));
  const parsed = parseIso4217ListOneXml(xml);
  const currencies = collapseIso4217Currencies(parsed.entries);
  if (currencies.length < 100) {
    throw new Error(
      `Refusing an incomplete List One containing ${currencies.length} currencies`,
    );
  }

  const provenance = {
    sourceUrl: SIX_LIST_ONE_URL,
    publishedAt: parsed.publishedAt,
    retrievedAt,
    sourceSha256: await sha256(xml),
    scope: "complete",
  } as const satisfies CurrencyRegistryProvenance;
  const difference = compareCurrencies(CURRENCIES, currencies);
  const report = renderCurrencyDiffReport(
    difference,
    provenance,
    parsed.entries.length,
    parsed.entitiesWithoutCurrency.length,
  );

  if (!Deno.args.includes("--write")) {
    console.log(report);
    console.log("Preview only; pass --write to update the checked-in files.");
  } else {
    const output = option("output") ?? "src/registry/currency-data.ts";
    const reportPath = option("report") ?? "docs/iso-4217-update.md";
    await Deno.writeTextFile(
      output,
      renderCurrencyDataModule(currencies, provenance),
    );
    await Deno.writeTextFile(reportPath, report);
    console.log(`Updated ${output} and ${reportPath}.`);
  }
}
