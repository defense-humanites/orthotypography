import type {
  CurrencyDefinition,
  CurrencyRegistryProvenance,
} from "../src/registry/currency-types.ts";

export const SIX_LIST_ONE_URL =
  "https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml";

export interface Iso4217ListOneEntry extends CurrencyDefinition {
  readonly entity: string;
}

export interface ParsedIso4217ListOne {
  readonly publishedAt: string | null;
  readonly entries: readonly Iso4217ListOneEntry[];
  readonly entitiesWithoutCurrency: readonly string[];
}

export interface CurrencyDifference {
  readonly added: readonly CurrencyDefinition[];
  readonly removed: readonly CurrencyDefinition[];
  readonly changed: readonly {
    code: string;
    before: CurrencyDefinition;
    after: CurrencyDefinition;
  }[];
}

function decodeXmlText(value: string): string {
  return value.replace(
    /&(?:amp|apos|gt|lt|quot|#\d+|#x[\da-f]+);/giu,
    (entity) => {
      const named: Record<string, string> = {
        "&amp;": "&",
        "&apos;": "'",
        "&gt;": ">",
        "&lt;": "<",
        "&quot;": '"',
      };
      const known = named[entity];
      if (known !== undefined) return known;
      const hexadecimal = /^&#x([\da-f]+);$/iu.exec(entity);
      const decimal = /^&#(\d+);$/u.exec(entity);
      const codePoint = Number.parseInt(
        hexadecimal?.[1] ?? decimal?.[1] ?? "",
        hexadecimal ? 16 : 10,
      );
      if (!Number.isSafeInteger(codePoint) || codePoint > 0x10ffff) {
        throw new Error(`Invalid XML character reference: ${entity}`);
      }
      return String.fromCodePoint(codePoint);
    },
  );
}

function readElement(block: string, name: string): string | null {
  const match = new RegExp(
    `<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`,
    "u",
  ).exec(block);
  if (match === null) return null;
  return decodeXmlText(match[1].replace(/<[^>]+>/gu, ""))
    .replace(/\s+/gu, " ")
    .trim();
}

function required(value: string | null, field: string, index: number): string {
  if (value === null || value.length === 0) {
    throw new Error(`Missing ${field} in CcyNtry ${index}`);
  }
  return value;
}

/** Parses the authoritative SIX List One XML without accepting partial rows. */
export function parseIso4217ListOneXml(xml: string): ParsedIso4217ListOne {
  const publishedAt = /<ISO_4217\b[^>]*\bPblshd="([^"]+)"/u.exec(xml)?.[1] ??
    null;
  if (publishedAt !== null && !/^\d{4}-\d{2}-\d{2}$/u.test(publishedAt)) {
    throw new Error(`Invalid SIX publication date: ${publishedAt}`);
  }
  const blocks = [...xml.matchAll(/<CcyNtry\b[^>]*>([\s\S]*?)<\/CcyNtry>/gu)];
  if (blocks.length === 0) {
    throw new Error("The XML contains no CcyNtry elements");
  }

  const entries: Iso4217ListOneEntry[] = [];
  const entitiesWithoutCurrency: string[] = [];
  for (const [index, match] of blocks.entries()) {
    const block = match[1];
    const entity = required(readElement(block, "CtryNm"), "CtryNm", index);
    const code = readElement(block, "Ccy");
    const numericCode = readElement(block, "CcyNbr");
    const minorUnitValue = readElement(block, "CcyMnrUnts");

    if (code === null || code.length === 0) {
      if (numericCode || minorUnitValue) {
        throw new Error(`Incomplete currency identity for ${entity}`);
      }
      entitiesWithoutCurrency.push(entity);
      continue;
    }

    const name = required(readElement(block, "CcyNm"), "CcyNm", index);
    const number = required(numericCode, "CcyNbr", index);
    const minor = required(minorUnitValue, "CcyMnrUnts", index);
    if (!/^[A-Z]{3}$/u.test(code)) {
      throw new Error(`Invalid alphabetic currency code: ${code}`);
    }
    if (!/^\d{3}$/u.test(number)) {
      throw new Error(`Invalid numeric currency code for ${code}: ${number}`);
    }
    if (minor !== "N.A." && !/^\d+$/u.test(minor)) {
      throw new Error(`Invalid minor unit for ${code}: ${minor}`);
    }
    if (minor !== "N.A." && Number.parseInt(minor, 10) > 9) {
      throw new Error(`Minor unit is out of range for ${code}: ${minor}`);
    }

    entries.push({
      entity,
      code,
      numericCode: number,
      name,
      minorUnit: minor === "N.A." ? null : Number.parseInt(minor, 10),
      sourceId: "iso-4217-six",
    });
  }
  return { publishedAt, entries, entitiesWithoutCurrency };
}

/** Collapses repeated territory rows into unique, validated currency identities. */
export function collapseIso4217Currencies(
  entries: readonly Iso4217ListOneEntry[],
): readonly CurrencyDefinition[] {
  const byCode = new Map<string, CurrencyDefinition>();
  const byNumericCode = new Map<string, string>();
  for (const { entity: _entity, ...currency } of entries) {
    const existingCode = byNumericCode.get(currency.numericCode);
    if (existingCode !== undefined && existingCode !== currency.code) {
      throw new Error(
        `Numeric code ${currency.numericCode} is shared by ${existingCode} and ${currency.code}`,
      );
    }
    byNumericCode.set(currency.numericCode, currency.code);

    const existing = byCode.get(currency.code);
    if (existing !== undefined) {
      if (
        existing.numericCode !== currency.numericCode ||
        existing.name !== currency.name ||
        existing.minorUnit !== currency.minorUnit
      ) {
        throw new Error(`Conflicting rows for currency ${currency.code}`);
      }
      continue;
    }
    byCode.set(currency.code, currency);
  }
  return [...byCode.values()].sort((left, right) =>
    left.code.localeCompare(right.code)
  );
}

export function compareCurrencies(
  before: readonly CurrencyDefinition[],
  after: readonly CurrencyDefinition[],
): CurrencyDifference {
  const oldByCode = new Map(
    before.map((currency) => [currency.code, currency]),
  );
  const newByCode = new Map(after.map((currency) => [currency.code, currency]));
  const added = after.filter(({ code }) => !oldByCode.has(code));
  const removed = before.filter(({ code }) => !newByCode.has(code));
  const changed = after.flatMap((currency) => {
    const previous = oldByCode.get(currency.code);
    if (
      previous === undefined ||
      previous.numericCode === currency.numericCode &&
        previous.name === currency.name &&
        previous.minorUnit === currency.minorUnit
    ) return [];
    return [{ code: currency.code, before: previous, after: currency }];
  });
  return { added, removed, changed };
}

export function renderCurrencyDataModule(
  currencies: readonly CurrencyDefinition[],
  provenance: CurrencyRegistryProvenance,
): string {
  const version = `iso-4217-six-${provenance.retrievedAt}`;
  const rows = currencies.map((currency) => {
    const minorUnit = currency.minorUnit === null ? "null" : currency.minorUnit;
    return `  {\n    code: ${
      JSON.stringify(currency.code)
    },\n    numericCode: ${JSON.stringify(currency.numericCode)},\n    name: ${
      JSON.stringify(currency.name)
    },\n    minorUnit: ${minorUnit},\n    sourceId: "iso-4217-six",\n  },`;
  }).join("\n");
  return `import type {\n  CurrencyDefinition,\n  CurrencyRegistryProvenance,\n} from "./currency-types.ts";\n\n/** Generated from SIX ISO 4217 List One. Do not edit manually. */\nexport const CURRENCY_REGISTRY_PROVENANCE = ${
    JSON.stringify(provenance, null, 2)
  } as const satisfies CurrencyRegistryProvenance;\n\nexport const CURRENCY_REGISTRY_VERSION = ${
    JSON.stringify(version)
  };\n\nexport const CURRENCIES = [\n${rows}\n] as const satisfies readonly CurrencyDefinition[];\n`;
}

export function renderCurrencyDiffReport(
  difference: CurrencyDifference,
  provenance: CurrencyRegistryProvenance,
  entityCount: number,
  unassignedEntityCount: number,
): string {
  const codes = (values: readonly CurrencyDefinition[]) =>
    values.length === 0
      ? "aucun"
      : values.map(({ code }) => `\`${code}\``).join(", ");
  const changed = difference.changed.length === 0
    ? "aucun"
    : difference.changed.map(({ code }) => `\`${code}\``).join(", ");
  return `# Mise à jour ISO 4217\n\n- Source : ${provenance.sourceUrl}\n- Publication SIX : ${
    provenance.publishedAt ?? "non indiquée"
  }\n- Récupération : ${provenance.retrievedAt}\n- SHA-256 source : \`${provenance.sourceSha256}\`\n- Entrées territoriales : ${entityCount}\n- Entités sans monnaie universelle : ${unassignedEntityCount}\n\n## Différence avec le registre précédent\n\n- Ajouts : ${
    codes(difference.added)
  }\n- Retraits : ${codes(difference.removed)}\n- Modifications : ${changed}\n`;
}
