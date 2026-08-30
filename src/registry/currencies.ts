/** Version and retrieval date of the monetary data represented here. */
export const CURRENCY_REGISTRY_VERSION = "iso-4217-six-2026-08-30";

export interface CurrencyDefinition {
  readonly code: string;
  readonly numericCode: string;
  readonly name: string;
  readonly minorUnit: number;
  readonly sourceId: "iso-4217-six";
}

export type CurrencySymbolAmbiguity = "unique" | "shared";

export interface CurrencySymbolDefinition {
  readonly symbol: string;
  readonly currencyCodes: readonly string[];
  readonly ambiguity: CurrencySymbolAmbiguity;
  readonly sourceId: "oqlf-currency-symbols";
}

export interface ResolvedCurrencyNotation {
  readonly notation: string;
  readonly kind: "code" | "symbol";
  readonly currencies: readonly CurrencyDefinition[];
  readonly ambiguous: boolean;
}

const isoSourceId = "iso-4217-six" as const;
const symbolSourceId = "oqlf-currency-symbols" as const;

/** Initial audited subset of active ISO 4217 currencies used by the runtime. */
export const CURRENCIES = [
  {
    code: "EUR",
    numericCode: "978",
    name: "Euro",
    minorUnit: 2,
    sourceId: isoSourceId,
  },
  {
    code: "USD",
    numericCode: "840",
    name: "US Dollar",
    minorUnit: 2,
    sourceId: isoSourceId,
  },
  {
    code: "CAD",
    numericCode: "124",
    name: "Canadian Dollar",
    minorUnit: 2,
    sourceId: isoSourceId,
  },
  {
    code: "CHF",
    numericCode: "756",
    name: "Swiss Franc",
    minorUnit: 2,
    sourceId: isoSourceId,
  },
  {
    code: "GBP",
    numericCode: "826",
    name: "Pound Sterling",
    minorUnit: 2,
    sourceId: isoSourceId,
  },
] as const satisfies readonly CurrencyDefinition[];

/** Editorial symbols are separate from ISO codes and may be ambiguous. */
export const CURRENCY_SYMBOLS = [
  {
    symbol: "€",
    currencyCodes: ["EUR"],
    ambiguity: "unique",
    sourceId: symbolSourceId,
  },
  {
    symbol: "$",
    currencyCodes: ["USD", "CAD"],
    ambiguity: "shared",
    sourceId: symbolSourceId,
  },
  {
    symbol: "£",
    currencyCodes: ["GBP"],
    ambiguity: "unique",
    sourceId: symbolSourceId,
  },
] as const satisfies readonly CurrencySymbolDefinition[];

const currenciesByCode = new Map<string, CurrencyDefinition>(
  CURRENCIES.map((currency) => [currency.code, currency] as const),
);
const symbolsByValue = new Map<string, CurrencySymbolDefinition>(
  CURRENCY_SYMBOLS.map((symbol) => [symbol.symbol, symbol] as const),
);

/** Resolves an exact uppercase ISO 4217 alphabetic code. */
export function resolveCurrencyCode(code: string): CurrencyDefinition | null {
  return currenciesByCode.get(code) ?? null;
}

/** Resolves an ISO code or editorial symbol without hiding ambiguity. */
export function resolveCurrencyNotation(
  notation: string,
): ResolvedCurrencyNotation | null {
  const currency = resolveCurrencyCode(notation);
  if (currency !== null) {
    return {
      notation,
      kind: "code",
      currencies: [currency],
      ambiguous: false,
    };
  }

  const symbol = symbolsByValue.get(notation);
  if (symbol === undefined) return null;
  const currencies = symbol.currencyCodes.map((code) => {
    const resolved = currenciesByCode.get(code);
    if (resolved === undefined) {
      throw new Error(`Unknown currency code for symbol ${notation}: ${code}`);
    }
    return resolved;
  });
  return {
    notation,
    kind: "symbol",
    currencies,
    ambiguous: symbol.ambiguity === "shared",
  };
}

export interface CurrencyRegistryIssue {
  readonly path: string;
  readonly message: string;
}

/** Validates uniqueness and symbol references in the monetary registry. */
export function validateCurrencyRegistry(): readonly CurrencyRegistryIssue[] {
  const issues: CurrencyRegistryIssue[] = [];
  const codes = new Set<string>();
  const numericCodes = new Set<string>();
  const symbols = new Set<string>();

  for (const currency of CURRENCIES) {
    if (!/^[A-Z]{3}$/.test(currency.code)) {
      issues.push({
        path: `currencies.${currency.code}`,
        message: "invalid code",
      });
    }
    if (!/^\d{3}$/.test(currency.numericCode)) {
      issues.push({
        path: `currencies.${currency.code}.numericCode`,
        message: "invalid numeric code",
      });
    }
    if (codes.has(currency.code)) {
      issues.push({
        path: `currencies.${currency.code}`,
        message: "duplicate code",
      });
    }
    if (numericCodes.has(currency.numericCode)) {
      issues.push({
        path: `currencies.${currency.code}.numericCode`,
        message: "duplicate numeric code",
      });
    }
    codes.add(currency.code);
    numericCodes.add(currency.numericCode);
  }

  for (const symbol of CURRENCY_SYMBOLS) {
    if (symbols.has(symbol.symbol)) {
      issues.push({
        path: `symbols.${symbol.symbol}`,
        message: "duplicate symbol",
      });
    }
    symbols.add(symbol.symbol);
    for (const code of symbol.currencyCodes) {
      if (!codes.has(code)) {
        issues.push({
          path: `symbols.${symbol.symbol}.${code}`,
          message: "unknown currency code",
        });
      }
    }
    if ((symbol.currencyCodes.length > 1) !== (symbol.ambiguity === "shared")) {
      issues.push({
        path: `symbols.${symbol.symbol}.ambiguity`,
        message: "ambiguity does not match referenced currencies",
      });
    }
  }
  return issues;
}
