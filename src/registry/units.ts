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

export interface ResolvedUnitFactor extends ResolvedUnitSymbol {
  readonly exponent: number;
  readonly position: "numerator" | "denominator";
}

export interface ResolvedUnitExpression {
  readonly symbol: string;
  readonly ast: UnitExpressionNode;
  readonly factors: readonly ResolvedUnitFactor[];
  readonly spacing: UnitSpacing;
  readonly compound: boolean;
}

export interface UnitFactorNode extends ResolvedUnitSymbol {
  readonly kind: "factor";
}

export interface UnitProductNode {
  readonly kind: "product";
  readonly operands: readonly UnitExpressionNode[];
}

export interface UnitQuotientNode {
  readonly kind: "quotient";
  readonly numerator: UnitExpressionNode;
  readonly denominator: UnitExpressionNode;
}

export interface UnitGroupNode {
  readonly kind: "group";
  readonly expression: UnitExpressionNode;
}

export interface UnitPowerNode {
  readonly kind: "power";
  readonly base: UnitExpressionNode;
  readonly exponent: number;
}

export type UnitExpressionNode =
  | UnitFactorNode
  | UnitProductNode
  | UnitQuotientNode
  | UnitGroupNode
  | UnitPowerNode;

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

const superscriptDigits: Readonly<Record<string, string>> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
};

const unitFactorPattern = /^[\p{L}µΩ°′″]+/u;
const superscriptPattern = /^[⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/u;
const whitespacePattern = /[\t \u00a0\u202f]/u;

function decodeSuperscript(value: string): number | null {
  const negative = value.startsWith("⁻");
  const digits = [...(negative ? value.slice(1) : value)]
    .map((digit) => superscriptDigits[digit])
    .join("");
  if (digits.length === 0 || digits.startsWith("0")) return null;
  const magnitude = Number.parseInt(digits, 10);
  if (!Number.isSafeInteger(magnitude)) return null;
  return magnitude * (negative ? -1 : 1);
}

class UnitExpressionParser {
  #index = 0;

  constructor(private readonly source: string) {}

  parse(): UnitExpressionNode | null {
    this.#skipWhitespace();
    const expression = this.#parseExpression(0);
    this.#skipWhitespace();
    return expression !== null && this.#index === this.source.length
      ? expression
      : null;
  }

  #parseExpression(depth: number): UnitExpressionNode | null {
    const numerator = this.#parseProduct(depth);
    if (numerator === null) return null;
    this.#skipWhitespace();
    if (this.source[this.#index] !== "/") return numerator;
    this.#index++;
    this.#skipWhitespace();
    const denominator = this.#parseProduct(depth);
    return denominator === null
      ? null
      : { kind: "quotient", numerator, denominator };
  }

  #parseProduct(depth: number): UnitExpressionNode | null {
    const first = this.#parsePrimary(depth);
    if (first === null) return null;
    const operands: UnitExpressionNode[] = [first];

    while (true) {
      const hadWhitespace = this.#skipWhitespace();
      if (this.source[this.#index] === "⋅") {
        this.#index++;
        this.#skipWhitespace();
      } else if (!hadWhitespace || !this.#startsPrimary()) {
        break;
      }
      const operand = this.#parsePrimary(depth);
      if (operand === null) return null;
      operands.push(operand);
    }
    return operands.length === 1 ? first : { kind: "product", operands };
  }

  #parsePrimary(depth: number): UnitExpressionNode | null {
    if (depth > 16) return null;
    let node: UnitExpressionNode;
    if (this.source[this.#index] === "(") {
      this.#index++;
      this.#skipWhitespace();
      const expression = this.#parseExpression(depth + 1);
      this.#skipWhitespace();
      if (expression === null || this.source[this.#index] !== ")") return null;
      this.#index++;
      node = { kind: "group", expression };
    } else {
      const symbol = unitFactorPattern.exec(this.source.slice(this.#index))
        ?.[0];
      if (symbol === undefined) return null;
      const resolved = resolveUnitSymbol(symbol);
      if (resolved === null) return null;
      this.#index += symbol.length;
      node = { kind: "factor", ...resolved };
    }

    const superscript = superscriptPattern.exec(
      this.source.slice(this.#index),
    )?.[0];
    if (superscript === undefined) return node;
    const exponent = decodeSuperscript(superscript);
    if (exponent === null) return null;
    this.#index += superscript.length;
    return { kind: "power", base: node, exponent };
  }

  #skipWhitespace(): boolean {
    const start = this.#index;
    while (whitespacePattern.test(this.source[this.#index] ?? "")) {
      this.#index++;
    }
    return this.#index > start;
  }

  #startsPrimary(): boolean {
    return this.source[this.#index] === "(" ||
      unitFactorPattern.test(this.source.slice(this.#index));
  }
}

function flattenUnitExpression(
  node: UnitExpressionNode,
  position: ResolvedUnitFactor["position"] = "numerator",
  exponent = 1,
): readonly ResolvedUnitFactor[] {
  switch (node.kind) {
    case "factor": {
      const { kind: _kind, ...factor } = node;
      return [{ ...factor, exponent, position }];
    }
    case "power":
      return flattenUnitExpression(
        node.base,
        position,
        exponent * node.exponent,
      );
    case "group":
      return flattenUnitExpression(node.expression, position, exponent);
    case "product":
      return node.operands.flatMap((operand) =>
        flattenUnitExpression(operand, position, exponent)
      );
    case "quotient":
      return [
        ...flattenUnitExpression(node.numerator, position, exponent),
        ...flattenUnitExpression(
          node.denominator,
          position === "numerator" ? "denominator" : "numerator",
          exponent,
        ),
      ];
  }
}

/**
 * Resolves a conservative SI unit expression.
 *
 * Products may use whitespace or U+22C5 DOT OPERATOR. Each expression level
 * may contain one solidus; parentheses make nested quotients unambiguous.
 * Integer powers use Unicode superscripts.
 */
export function resolveUnitExpression(
  expression: string,
): ResolvedUnitExpression | null {
  const ast = new UnitExpressionParser(expression).parse();
  if (ast === null) return null;
  const factors = flattenUnitExpression(ast);
  const compound = ast.kind !== "factor";
  return {
    symbol: expression,
    ast,
    factors,
    spacing: compound ? "space" : factors[0].unit.spacing,
    compound,
  };
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
