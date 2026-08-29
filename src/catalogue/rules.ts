import type { RuleDefinition } from "../model.ts";

const frenchLocales = ["fr-FR", "fr-CA"] as const;

export const RULES = [
  {
    id: "punctuation.comma.no-space-before",
    description: "Supprimer tout blanc précédant une virgule de phrase.",
    locales: frenchLocales,
    phase: "punctuation-spacing",
    status: "VERIFIED",
    defaultMode: "fix",
    sources: [
      {
        sourceId: "imprimerie-nationale-2002",
        locator: "Ponctuation/Espacement",
      },
      { sourceId: "oqlf-spacing", locator: "Virgule" },
    ],
    outcome: { before: "" },
    exceptions: ["séparateur décimal", "syntaxe protégée"],
  },
  {
    id: "punctuation.period.no-space-before",
    description: "Supprimer tout blanc précédant un point final.",
    locales: frenchLocales,
    phase: "punctuation-spacing",
    status: "VERIFIED",
    defaultMode: "fix",
    sources: [
      {
        sourceId: "imprimerie-nationale-2002",
        locator: "Ponctuation/Espacement",
      },
      { sourceId: "oqlf-spacing", locator: "Point" },
    ],
    outcome: { before: "" },
    exceptions: ["abréviation", "version", "adresse IP", "syntaxe protégée"],
  },
  {
    id: "punctuation.colon.nbsp-before",
    description:
      "Placer une espace insécable de mots avant un deux-points de phrase.",
    locales: frenchLocales,
    phase: "punctuation-spacing",
    status: "VERIFIED_MAPPING",
    defaultMode: "fix",
    sources: [
      {
        sourceId: "imprimerie-nationale-2002",
        locator: "Ponctuation/Tableau Deux-points",
      },
      { sourceId: "oqlf-spacing", locator: "Deux-points" },
    ],
    outcome: { before: "U+00A0", after: "U+0020" },
    exceptions: ["heure", "ratio", "URI", "port", "syntaxe protégée"],
    dependsOn: ["classify.numeric-constructs"],
  },
  {
    id: "punctuation.semicolon.nnbsp-before",
    description: "Placer une espace fine insécable avant un point-virgule.",
    locales: frenchLocales,
    phase: "punctuation-spacing",
    status: "VERIFIED_MAPPING",
    defaultMode: "fix",
    sources: [
      {
        sourceId: "imprimerie-nationale-2002",
        locator: "Ponctuation/Tableau Point-virgule",
      },
      { sourceId: "oqlf-space-types", locator: "Espace fine insécable" },
    ],
    outcome: { before: "U+202F", after: "U+0020" },
    exceptions: ["syntaxe protégée", "support contraint"],
  },
  {
    id: "punctuation.question.nnbsp-before",
    description:
      "Placer une espace fine insécable avant un point d’interrogation.",
    locales: frenchLocales,
    phase: "punctuation-spacing",
    status: "VERIFIED_MAPPING",
    defaultMode: "fix",
    sources: [
      {
        sourceId: "imprimerie-nationale-2002",
        locator: "Ponctuation/Tableau Point d’interrogation",
      },
      { sourceId: "oqlf-space-types", locator: "Espace fine insécable" },
    ],
    outcome: { before: "U+202F", after: "U+0020" },
    exceptions: [
      "séquence expressive",
      "syntaxe protégée",
      "support contraint",
    ],
  },
  {
    id: "punctuation.exclamation.nnbsp-before",
    description:
      "Placer une espace fine insécable avant un point d’exclamation.",
    locales: frenchLocales,
    phase: "punctuation-spacing",
    status: "VERIFIED_MAPPING",
    defaultMode: "fix",
    sources: [
      {
        sourceId: "imprimerie-nationale-2002",
        locator: "Ponctuation/Tableau Point d’exclamation",
      },
      { sourceId: "oqlf-space-types", locator: "Espace fine insécable" },
    ],
    outcome: { before: "U+202F", after: "U+0020" },
    exceptions: [
      "séquence expressive",
      "syntaxe protégée",
      "support contraint",
    ],
  },
  {
    id: "quotes.french.nbsp-inner",
    description:
      "Placer une espace insécable de mots à l’intérieur des guillemets français.",
    locales: frenchLocales,
    phase: "quotes",
    status: "VERIFIED_MAPPING",
    defaultMode: "fix",
    sources: [
      {
        sourceId: "imprimerie-nationale-2002",
        locator: "Ponctuation/Tableaux Guillemets",
      },
      { sourceId: "oqlf-quotes", locator: "Guillemets français" },
    ],
    outcome: { afterOpening: "U+00A0", beforeClosing: "U+00A0" },
    exceptions: [
      "guillemet non apparié",
      "support contraint",
      "syntaxe protégée",
    ],
  },
  {
    id: "number.percent.nbsp-before",
    description:
      "Placer une espace insécable entre une valeur et le symbole pour cent.",
    locales: frenchLocales,
    phase: "numeric-spacing",
    status: "VERIFIED_BY_EXAMPLE",
    defaultMode: "fix",
    sources: [
      {
        sourceId: "imprimerie-nationale-2002",
        locator: "Nombres en chiffres arabes/Pourcentages",
      },
      { sourceId: "oqlf-spacing", locator: "Symbole pour cent" },
    ],
    outcome: { beforeSymbol: "U+00A0" },
    exceptions: ["identifiant", "syntaxe protégée"],
    dependsOn: ["classify.numeric-constructs"],
  },
  {
    id: "number.unit.nbsp-before",
    description:
      "Placer une espace insécable entre une valeur et un symbole d’unité reconnu.",
    locales: frenchLocales,
    phase: "numeric-spacing",
    status: "VERIFIED_BY_EXAMPLE",
    defaultMode: "fix",
    sources: [
      {
        sourceId: "imprimerie-nationale-2002",
        locator: "Unités de mesure/Remarques sur les symboles",
      },
      { sourceId: "oqlf-spacing", locator: "Symboles d’unités de mesure" },
    ],
    outcome: { beforeSymbol: "U+00A0" },
    exceptions: ["angle", "nom commun", "unité inconnue", "syntaxe protégée"],
    dependsOn: ["classify.numeric-constructs"],
  },
  {
    id: "number.euro.nbsp-before",
    description:
      "Placer le symbole euro à droite de la valeur et l’en séparer par une espace insécable.",
    locales: frenchLocales,
    phase: "numeric-spacing",
    status: "VERIFIED_BY_EXAMPLE",
    defaultMode: "lint",
    sources: [
      { sourceId: "imprimerie-nationale-2002", locator: "Euro" },
      { sourceId: "oqlf-spacing", locator: "Symboles d’unités monétaires" },
    ],
    outcome: { position: "after", beforeSymbol: "U+00A0" },
    exceptions: [
      "citation d’une autre convention",
      "devise ambiguë",
      "syntaxe protégée",
    ],
    dependsOn: ["classify.numeric-constructs"],
  },
  {
    id: "classify.numeric-constructs",
    description:
      "Identifier les heures, ratios, mesures, monnaies et autres constructions numériques protégées.",
    locales: frenchLocales,
    phase: "classify",
    status: "TO_VERIFY",
    defaultMode: "manual-review",
    sources: [],
    outcome: { effect: "classification-only" },
    exceptions: ["entrée structurée par l’intégration"],
  },
] as const satisfies readonly RuleDefinition[];
