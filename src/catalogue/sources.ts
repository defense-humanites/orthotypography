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
] as const satisfies readonly SourceDefinition[];
