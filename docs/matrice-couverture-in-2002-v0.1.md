# Matrice de couverture — Imprimerie nationale 2002

**Version :** 0.1  
**Date de vérification :** 9 septembre 2026  
**Base examinée :** `5ad411beef95e6ec987d352ccd6d9053ceb2ffee`  
**Source primaire :** *Lexique des règles typographiques en usage à
l’Imprimerie nationale*, édition 2002  
**Relevé de référence :**
[`depouillement-lexique-v0.3.md`](depouillement-lexique-v0.3.md)

## 1. Objet et vocabulaire

Cette matrice distingue cinq niveaux qui ne doivent pas être confondus :

- **attesté** : la prescription figure dans le dépouillement de la source ;
- **catalogué** : un `RuleDefinition` machine la représente, seul ou avec
  d’autres prescriptions proches ;
- **exécutable** : un `RuntimeRule` produit un diagnostic ou une correction ;
- **testé** : un test automatisé couvre le comportement indiqué ;
- **activé** : le preset documentaire et la composition exécutable de
  `fr-FR/imprimerie-nationale-2002` sélectionnent le comportement.

Une ligne « partielle » signale qu’une implémentation couvre seulement une
partie de la prescription ou que plusieurs prescriptions sont agrégées sous un
identifiant machine. Les protections de segments sont assurées par le pipeline
pour toutes les règles ; la colonne « exclusions » mentionne les décisions
supplémentaires propres au comportement.

## 2. Matrice

| Prescription atomique du dépouillement | Catalogue machine | Exécution au 9 septembre 2026 | Tests directs | Preset IN 2002 | Exclusions ou travail restant |
|---|---|---|---|---|---|
| `space.before.comma` | `punctuation.comma.no-space-before` | `SAFE_PUNCTUATION_RULES` : `fix` | `punctuation_test.ts`, `integration_test.ts` | oui | décimales et syntaxe technique protégées par classification |
| `space.before.period` | `punctuation.period.no-space-before` | `SAFE_PUNCTUATION_RULES` : `fix` | `punctuation_test.ts`, `integration_test.ts` | oui | versions, adresses IP, URI et autres constructions classifiées |
| `space.after.comma` | issue de source seulement | non | non | non | distinguer fin de segment, fin de texte et ponctuation adjacente |
| `space.after.period` | issue de source seulement | non | non | non | distinguer point final, abréviation et texte qui suit |
| `space.before.semicolon` | `punctuation.semicolon.nnbsp-before` | `HIGH_PUNCTUATION_RULES` : `fix` | `punctuation_test.ts`, `integration_test.ts` | oui | suites expressives et syntaxe protégée |
| `space.before.exclamation` | `punctuation.exclamation.nnbsp-before` | `HIGH_PUNCTUATION_RULES` : `fix` | `punctuation_test.ts`, `integration_test.ts` | oui | suites expressives et `!important` |
| `space.before.question` | `punctuation.question.nnbsp-before` | `HIGH_PUNCTUATION_RULES` : `fix` | `punctuation_test.ts`, `integration_test.ts` | oui | suites expressives et syntaxe protégée |
| `space.after.highPunctuation` | résultat agrégé dans les quatre règles de ponctuation haute | partielle : `fix` si du texte suit | `punctuation_test.ts`, `integration_test.ts` | oui, indirectement | pas d’identifiant atomique autonome ; préserver les suites expressives |
| `space.before.colon` | `punctuation.colon.nbsp-before` | `HIGH_PUNCTUATION_RULES` : `fix` | `punctuation_test.ts`, `integration_test.ts` | oui | heures, ratios, URI, ports, `::` |
| `space.after.colon` | résultat agrégé dans `punctuation.colon.nbsp-before` | partielle : `fix` si du texte suit | `punctuation_test.ts`, `integration_test.ts` | oui, indirectement | pas d’identifiant atomique autonome |
| `quotes.primary.glyphs` | issue de source seulement | non | négatifs dans `quotes_test.ts` | non | reconnaître sans ambiguïté le rôle ouvrant ou fermant des guillemets droits |
| `quotes.primary.innerSpacing` | `quotes.french.nbsp-inner` | `FRENCH_GUILLEMETS_SPACING_RULE` : `fix` | `quotes_test.ts`, `integration_test.ts` | oui | guillemets appariés seulement ; support contraint hors cœur |
| `ellipsis.count` | issue de source seulement | non | non | non | ne pas confondre fonction et choix entre `...` et `…` |
| `ellipsis.spacing.final` | issue de source seulement | non | non | non | classifier la fonction finale avant toute suppression d’espace |
| `ellipsis.spacing.initial` | issue de source seulement | non | non | non | classifier l’ellipse remplaçant un début de texte |
| `ellipsis.spacing.word` | issue de source seulement | non | non | non | classifier l’ellipse tenant lieu d’un mot isolé |
| interdiction des points de suspension après `etc.` | `punctuation.ellipsis.after-etc.forbidden` | `ETC_ELLIPSIS_RULE` : `fix` | `ellipsis_test.ts` | oui | token `etc.` autonome ; syntaxes techniques et segments protégés préservés |
| `dash.parenthetical.glyph` | issue de source seulement | non | non | non | le tiret source `-` est trop ambigu pour une conversion globale |
| `dash.spacing` | issue de source seulement | non | non | non | reconnaître préalablement le tiret d’incise ; cas fermant particulier |
| `dash.closing.beforePeriod` | issue de source seulement | non | non | non | reconnaître une incise appariée avant suppression |
| `number.groupDigits` | issue de source seulement | non | non | non | choix Unicode et classification quantités/numérotages à stabiliser |
| `number.decimalSeparator` | issue de source et classificateur | reconnaissance sans conversion | `numeric_classifier_test.ts` | non comme transformation | ne jamais convertir aveuglément versions, identifiants ou conventions citées |
| `number.noGrouping.ordinal` | issue de source et protection partielle par classification | pas de règle de groupement à exclure actuellement | `numeric_classifier_test.ts` pour dates, versions et identifiants | non | compléter avant une future règle de groupement |
| `space.before.percent` | `number.percent.nbsp-before` | `PERCENTAGE_SPACING_RULE` : `fix` | `numeric_spacing_test.ts` | oui | valeur numérique classifiée ; identifiants et URI protégés |
| `percent.glyph` | résultat agrégé dans `number.percent.nbsp-before` | reconnaissance de `%` et `‰`, sans conversion de glyphe | `numeric_spacing_test.ts` | oui, indirectement | aucun glyphe source alternatif défini |
| `space.numberUnit` | `number.unit.nbsp-before` | `UNIT_SPACING_RULE` : `lint` par défaut, `fix` explicite | `unit_spacing_test.ts` | oui | registre d’unités reconnu ; angles, noms communs et symboles ambigus exclus |
| `unit.symbol.period` | issue de source seulement | non | registre seulement | non | distinguer point fautif et ponctuation finale de phrase |
| `unit.symbol.plural` | issue de source seulement | non | registre seulement | non | éviter qu’un `s` forme un autre symbole valide, par exemple `ms` |
| `unit.symbol.case` | registre d’unités | validation exacte, sans réécriture | `unit_registry_test.ts` | non comme transformation | la casse est signifiante ; correction automatique potentiellement ambiguë |
| `currency.euro.position` | résultat agrégé dans `number.euro.nbsp-before` | `EURO_SPACING_RULE` : `lint` par défaut, `fix` explicite | `euro_spacing_test.ts` | oui | euro seulement ; conventions citées et monnaies ambiguës exclues |
| `space.numberEuro` | `number.euro.nbsp-before` | `EURO_SPACING_RULE` : `lint` par défaut, `fix` explicite | `euro_spacing_test.ts` | oui | montant classifié et symbole `€` non ambigu |
| classification des constructions numériques et techniques | `classify.numeric-constructs` | `NUMERIC_PROTECTION_RULE` : classification et protection | `numeric_classifier_test.ts`, tests des règles dépendantes | oui, `manual-review` dans le catalogue | autorité documentaire sans objet direct ; statut `TO_VERIFY` maintenu |

## 3. Règle retenue pour l’extension atomique

La première extension issue de cette matrice est
`punctuation.ellipsis.after-etc.forbidden`. Le *Lexique* formule deux fois
l’interdiction : aux entrées « Abréviations » et « Ponctuation ». Contrairement
à une normalisation générale du glyphe ou de l’espacement des ellipses, cette
règle ne demande pas d’inférer une suppression, une interruption ou un
sous-entendu.

La correction conserve le point abréviatif final de `etc.` et supprime
uniquement les points de suspension adjacents, qu’ils soient représentés par
`U+2026` ou par une suite usuelle de points. Elle s’applique à travers des
segments textuels contigus, mais ne traverse pas un segment protégé. Les tokens
plus longs, les chemins et les syntaxes techniques ne sont pas assimilés à
l’abréviation autonome.

## 4. Priorités révélées par la matrice

1. Créer des identifiants documentaires autonomes pour les espaces suivant la
   ponctuation basse et haute avant d’étendre leur comportement.
2. Décider séparément le système de glyphe des points de suspension et la
   classification de leurs trois fonctions d’espacement.
3. Stabiliser le caractère Unicode du groupement numérique, puis compléter les
   exclusions de numérotage avant tout mode `fix`.
4. Maintenir les règles d’unités et d’euro en `lint` par défaut tant que leurs
   ambiguïtés documentées ne sont pas levées.
