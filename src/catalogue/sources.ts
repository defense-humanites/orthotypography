import type { SourceDefinition } from "../model.ts";

export const SOURCES = [
  {
    id: "imprimerie-nationale-2002",
    citation:
      "IMPRIMERIE NATIONALE. Lexique des règles typographiques en usage à l’Imprimerie nationale. Paris : Imprimerie nationale, 2002. ISBN 978-2-7433-0482-9.",
  },
  {
    id: "oqlf-spacing",
    citation:
      "OFFICE QUÉBÉCOIS DE LA LANGUE FRANÇAISE. Espacement avant et après les signes de ponctuation et les symboles. Vitrine linguistique.",
    url:
      "https://vitrinelinguistique.oqlf.gouv.qc.ca/22039/la-typographie/espacement/espacement-avant-et-apres-les-signes-de-ponctuation-et-les-symboles",
    accessedAt: "2026-08-29",
  },
  {
    id: "oqlf-space-types",
    citation:
      "OFFICE QUÉBÉCOIS DE LA LANGUE FRANÇAISE. Types d’espacement. Vitrine linguistique.",
    url:
      "https://vitrinelinguistique.oqlf.gouv.qc.ca/24565/la-typographie/espacement/types-despacement",
    accessedAt: "2026-08-29",
  },
  {
    id: "oqlf-quotes",
    citation:
      "OFFICE QUÉBÉCOIS DE LA LANGUE FRANÇAISE. Généralités sur les guillemets. Vitrine linguistique.",
    url:
      "https://vitrinelinguistique.oqlf.gouv.qc.ca/23363/la-ponctuation/guillemets/generalites-sur-les-guillemets",
    accessedAt: "2026-08-29",
  },
  {
    id: "bipm-si-9-4.01",
    citation:
      "BUREAU INTERNATIONAL DES POIDS ET MESURES. Le Système international d’unités (SI). 9e éd., version 4.01. Sèvres : BIPM, 2026. DOI 10.59161/AUEZ1291.",
    url: "https://doi.org/10.59161/AUEZ1291",
    accessedAt: "2026-08-30",
  },
  {
    id: "iso-4217-six",
    citation:
      "SIX GROUP. ISO 4217 — Currency Codes: List One, Current Currency & Funds. Zurich : SIX Financial Information, 2026.",
    url:
      "https://www.six-group.com/en/products-services/financial-information/market-reference-data/data-standards.html",
    accessedAt: "2026-08-30",
  },
  {
    id: "oqlf-currency-symbols",
    citation:
      "OFFICE QUÉBÉCOIS DE LA LANGUE FRANÇAISE. Écriture des symboles d’unités monétaires. Vitrine linguistique, 2019.",
    url:
      "https://vitrinelinguistique.oqlf.gouv.qc.ca/21400/les-abreviations-et-les-symboles/les-symboles/ecriture-des-symboles-dunites-monetaires",
    accessedAt: "2026-08-30",
  },
] as const satisfies readonly SourceDefinition[];
