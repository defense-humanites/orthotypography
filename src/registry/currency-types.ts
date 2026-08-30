export interface CurrencyDefinition {
  readonly code: string;
  readonly numericCode: string;
  readonly name: string;
  readonly minorUnit: number | null;
  readonly sourceId: "iso-4217-six";
}

export interface CurrencyRegistryProvenance {
  readonly sourceUrl: string;
  readonly publishedAt: string | null;
  readonly retrievedAt: string;
  readonly sourceSha256: string | null;
  readonly scope: "subset" | "complete";
}
