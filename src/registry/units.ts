/** Version of the normative data represented by this registry. */
export const UNIT_REGISTRY_VERSION = "bipm-si-9.4.01-2026";

export type UnitCategory =
  | "si-base"
  | "si-derived"
  | "si-mass-prefix-base"
  | "accepted-with-si";

export type UnitSpacing = "space" | "none";

export interface UnitDefinition {
  readonly symbol: string;
  readonly name: string;
  readonly category: UnitCategory;
  readonly spacing: UnitSpacing;
  readonly prefixable: boolean;
  readonly sourceId: "bipm-si-9-4.01";
}

export interface UnitPrefixDefinition {
  readonly symbol: string;
  readonly name: string;
  readonly power: number;
}

export interface ResolvedUnitSymbol {
  readonly symbol: string;
  readonly unit: UnitDefinition;
  readonly prefix?: UnitPrefixDefinition;
}

const sourceId = "bipm-si-9-4.01" as const;

export const SI_PREFIXES = [
  { symbol: "Q", name: "quetta", power: 30 },
  { symbol: "R", name: "ronna", power: 27 },
  { symbol: "Y", name: "yotta", power: 24 },
  { symbol: "Z", name: "zetta", power: 21 },
  { symbol: "E", name: "exa", power: 18 },
  { symbol: "P", name: "peta", power: 15 },
  { symbol: "T", name: "tera", power: 12 },
  { symbol: "G", name: "giga", power: 9 },
  { symbol: "M", name: "mega", power: 6 },
  { symbol: "k", name: "kilo", power: 3 },
  { symbol: "h", name: "hecto", power: 2 },
  { symbol: "da", name: "deca", power: 1 },
  { symbol: "d", name: "deci", power: -1 },
  { symbol: "c", name: "centi", power: -2 },
  { symbol: "m", name: "milli", power: -3 },
  { symbol: "µ", name: "micro", power: -6 },
  { symbol: "n", name: "nano", power: -9 },
  { symbol: "p", name: "pico", power: -12 },
  { symbol: "f", name: "femto", power: -15 },
  { symbol: "a", name: "atto", power: -18 },
  { symbol: "z", name: "zepto", power: -21 },
  { symbol: "y", name: "yocto", power: -24 },
  { symbol: "r", name: "ronto", power: -27 },
  { symbol: "q", name: "quecto", power: -30 },
] as const satisfies readonly UnitPrefixDefinition[];

const baseUnits = [
  ["s", "second"],
  ["m", "metre"],
  ["kg", "kilogram"],
  ["A", "ampere"],
  ["K", "kelvin"],
  ["mol", "mole"],
  ["cd", "candela"],
] as const;

const derivedUnits = [
  ["rad", "radian"],
  ["sr", "steradian"],
  ["Hz", "hertz"],
  ["N", "newton"],
  ["Pa", "pascal"],
  ["J", "joule"],
  ["W", "watt"],
  ["C", "coulomb"],
  ["V", "volt"],
  ["F", "farad"],
  ["Ω", "ohm"],
  ["S", "siemens"],
  ["Wb", "weber"],
  ["T", "tesla"],
  ["H", "henry"],
  ["°C", "degree Celsius"],
  ["lm", "lumen"],
  ["lx", "lux"],
  ["Bq", "becquerel"],
  ["Gy", "gray"],
  ["Sv", "sievert"],
  ["kat", "katal"],
] as const;

const acceptedUnits = [
  ["min", "minute", "space"],
  ["h", "hour", "space"],
  ["d", "day", "space"],
  ["°", "degree of plane angle", "none"],
  ["′", "minute of plane angle", "none"],
  ["″", "second of plane angle", "none"],
  ["l", "litre", "space"],
  ["L", "litre", "space"],
  ["t", "tonne", "space"],
  ["ha", "hectare", "space"],
  ["bar", "bar", "space"],
  ["Da", "dalton", "space"],
  ["au", "astronomical unit", "space"],
  ["eV", "electronvolt", "space"],
  ["dB", "decibel", "space"],
] as const;

export const SI_UNITS: readonly UnitDefinition[] = [
  ...baseUnits.map(([symbol, name]) => ({
    symbol,
    name,
    category: "si-base" as const,
    spacing: "space" as const,
    prefixable: symbol !== "kg",
    sourceId,
  })),
  ...derivedUnits.map(([symbol, name]) => ({
    symbol,
    name,
    category: "si-derived" as const,
    spacing: "space" as const,
    prefixable: true,
    sourceId,
  })),
  {
    symbol: "g",
    name: "gram",
    category: "si-mass-prefix-base",
    spacing: "space",
    prefixable: true,
    sourceId,
  },
  ...acceptedUnits.map(([symbol, name, spacing]) => ({
    symbol,
    name,
    category: "accepted-with-si" as const,
    spacing,
    prefixable: false,
    sourceId,
  })),
];

const unitsBySymbol = new Map(SI_UNITS.map((unit) => [unit.symbol, unit]));
const prefixesByLength = [...SI_PREFIXES].sort((left, right) =>
  right.symbol.length - left.symbol.length
);

/** Resolves an exact, case-sensitive unit symbol without accepting aliases. */
export function resolveUnitSymbol(symbol: string): ResolvedUnitSymbol | null {
  const exact = unitsBySymbol.get(symbol);
  if (exact !== undefined) return { symbol, unit: exact };

  for (const prefix of prefixesByLength) {
    if (!symbol.startsWith(prefix.symbol)) continue;
    const unit = unitsBySymbol.get(symbol.slice(prefix.symbol.length));
    if (unit?.prefixable === true) return { symbol, unit, prefix };
  }
  return null;
}

export interface UnitRegistryIssue {
  readonly path: string;
  readonly message: string;
}

/** Validates uniqueness and the special SI rules encoded by the registry. */
export function validateUnitRegistry(): readonly UnitRegistryIssue[] {
  const issues: UnitRegistryIssue[] = [];
  const unitSymbols = new Set<string>();
  const prefixSymbols = new Set<string>();
  const prefixPowers = new Set<number>();

  for (const unit of SI_UNITS) {
    if (unitSymbols.has(unit.symbol)) {
      issues.push({
        path: `units.${unit.symbol}`,
        message: "duplicate symbol",
      });
    }
    unitSymbols.add(unit.symbol);
  }
  for (const prefix of SI_PREFIXES) {
    if (prefixSymbols.has(prefix.symbol)) {
      issues.push({
        path: `prefixes.${prefix.symbol}`,
        message: "duplicate symbol",
      });
    }
    if (prefixPowers.has(prefix.power)) {
      issues.push({
        path: `prefixes.${prefix.symbol}`,
        message: "duplicate power",
      });
    }
    prefixSymbols.add(prefix.symbol);
    prefixPowers.add(prefix.power);
  }
  if (unitsBySymbol.get("kg")?.prefixable !== false) {
    issues.push({ path: "units.kg", message: "kilogram must not be prefixed" });
  }
  if (unitsBySymbol.get("g")?.prefixable !== true) {
    issues.push({ path: "units.g", message: "gram must carry mass prefixes" });
  }
  return issues;
}
