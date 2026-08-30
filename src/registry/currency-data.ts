import type {
  CurrencyDefinition,
  CurrencyRegistryProvenance,
} from "./currency-types.ts";

/** Provenance of the currently checked-in monetary identity data. */
export const CURRENCY_REGISTRY_PROVENANCE = {
  sourceUrl:
    "https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml",
  publishedAt: null,
  retrievedAt: "2026-08-30",
  sourceSha256: null,
  scope: "subset",
} as const satisfies CurrencyRegistryProvenance;

/** Version of the monetary identity data represented here. */
export const CURRENCY_REGISTRY_VERSION = "iso-4217-six-2026-08-30-subset";

/** Initial audited subset of active ISO 4217 currencies used by the runtime. */
export const CURRENCIES = [
  {
    code: "EUR",
    numericCode: "978",
    name: "Euro",
    minorUnit: 2,
    sourceId: "iso-4217-six",
  },
  {
    code: "USD",
    numericCode: "840",
    name: "US Dollar",
    minorUnit: 2,
    sourceId: "iso-4217-six",
  },
  {
    code: "CAD",
    numericCode: "124",
    name: "Canadian Dollar",
    minorUnit: 2,
    sourceId: "iso-4217-six",
  },
  {
    code: "CHF",
    numericCode: "756",
    name: "Swiss Franc",
    minorUnit: 2,
    sourceId: "iso-4217-six",
  },
  {
    code: "GBP",
    numericCode: "826",
    name: "Pound Sterling",
    minorUnit: 2,
    sourceId: "iso-4217-six",
  },
] as const satisfies readonly CurrencyDefinition[];
