# Matrice de couverture — Imprimerie nationale 2002

**Version :** 0.1  
**Date de vérification :** 12 septembre 2026
**Base examinée :** `12ef7c38e6923383c7955cd1f2c445fe6aa32b90`
**Source primaire :** *Lexique des règles typographiques en usage à
l’Imprimerie nationale*, édition 2002  
**Relevé de référence :**
[`depouillement-lexique-v0.3.md`](depouillement-lexique-v0.3.md)

**Conception des ellipses :**
[`points-de-suspension-v0.1.md`](points-de-suspension-v0.1.md)

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

| Prescription atomique du dépouillement | Catalogue machine | Exécution au 12 septembre 2026 | Tests directs | Preset IN 2002 | Exclusions ou travail restant |
|---|---|---|---|---|---|
| `space.before.comma` | `punctuation.comma.no-space-before` | `SAFE_PUNCTUATION_RULES` : `fix` | `punctuation_test.ts`, `integration_test.ts` | oui | décimales et syntaxe technique protégées par classification |
| `space.before.period` | `punctuation.period.no-space-before` | `SAFE_PUNCTUATION_RULES` : `fix` | `punctuation_test.ts`, `integration_test.ts` | oui | versions, adresses IP, URI et autres constructions classifiées |
| `space.after.comma` | `punctuation.comma.space-after` | `SPACE_AFTER_COMMA_RULE` : `fix` contextuel | `comma_spacing_test.ts` | oui | fin de texte et ponctuation adjacente exclues ; décimales, URI, chemins et segments protégés préservés |
| `space.after.period` | `punctuation.period.space-after` | non ; `manual-review` documentaire | `catalogue_test.ts` pour le catalogue seulement | oui, `manual-review` | distinguer point final, abréviation et texte qui suit avant toute exécution |
| `space.before.semicolon` | `punctuation.semicolon.nnbsp-before` | `HIGH_PUNCTUATION_RULES` : `fix` | `punctuation_test.ts`, `integration_test.ts` | oui | suites expressives et syntaxe protégée |
| `space.before.exclamation` | `punctuation.exclamation.nnbsp-before` | `HIGH_PUNCTUATION_RULES` : `fix` | `punctuation_test.ts`, `integration_test.ts` | oui | suites expressives et `!important` |
| `space.before.question` | `punctuation.question.nnbsp-before` | `HIGH_PUNCTUATION_RULES` : `fix` | `punctuation_test.ts`, `integration_test.ts` | oui | suites expressives et syntaxe protégée |
| `space.after.semicolon` | `punctuation.semicolon.space-after` | couverture indirecte : l’effet reste agrégé dans `punctuation.semicolon.nnbsp-before` | `punctuation_test.ts`, `integration_test.ts` ; catalogue dans `catalogue_test.ts` | oui, `manual-review` | séparer ultérieurement la provenance d’exécution sans modifier la sortie |
| `space.after.exclamation` | `punctuation.exclamation.space-after` | couverture indirecte : l’effet reste agrégé dans `punctuation.exclamation.nnbsp-before` | `punctuation_test.ts`, `integration_test.ts` ; catalogue dans `catalogue_test.ts` | oui, `manual-review` | préserver les suites expressives et `!important` lors d’une future séparation du runtime |
| `space.after.question` | `punctuation.question.space-after` | couverture indirecte : l’effet reste agrégé dans `punctuation.question.nnbsp-before` | `punctuation_test.ts`, `integration_test.ts` ; catalogue dans `catalogue_test.ts` | oui, `manual-review` | préserver les suites expressives lors d’une future séparation du runtime |
| `space.before.colon` | `punctuation.colon.nbsp-before` | `HIGH_PUNCTUATION_RULES` : `fix` | `punctuation_test.ts`, `integration_test.ts` | oui | heures, ratios, URI, ports, `::` |
| `space.after.colon` | `punctuation.colon.space-after` | couverture indirecte : l’effet reste agrégé dans `punctuation.colon.nbsp-before` | `punctuation_test.ts`, `integration_test.ts` ; catalogue dans `catalogue_test.ts` | oui, `manual-review` | séparer ultérieurement la provenance d’exécution en conservant les protections techniques |
| `quotes.primary.glyphs` | issue de source seulement | non | négatifs dans `quotes_test.ts` | non | reconnaître sans ambiguïté le rôle ouvrant ou fermant des guillemets droits |
| `quotes.primary.innerSpacing` | `quotes.french.nbsp-inner` | `FRENCH_GUILLEMETS_SPACING_RULE` : `fix` | `quotes_test.ts`, `integration_test.ts` | oui | guillemets appariés seulement ; support contraint hors cœur |
| `ellipsis.count` | non ; candidat `punctuation.ellipsis.glyph` | non | non | non | `U+2026` retenu comme sortie moderne du projet, distincte de la prescription historique des trois points |
| `ellipsis.spacing.final` | non ; candidat `punctuation.ellipsis.final.no-space-before` | non | non | non | `fix` seulement si la fonction finale est établie ; espace après si le texte continue |
| `ellipsis.spacing.initial` | non ; candidat `punctuation.ellipsis.initial.space-after` | non | non | non | `fix` au début structurel certain ; sinon `lint` |
| `ellipsis.spacing.word` | non ; candidat `punctuation.ellipsis.word.space-around` | non | non | non | `manual-review` sans indice sémantique fourni par la structure |
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

## 3. Extensions atomiques retenues

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

La tranche suivante est `punctuation.comma.space-after`, identifiant autonome
de la prescription `space.after.comma`. Elle insère `U+0020` lorsque du texte
suit immédiatement la virgule, y compris quand ce texte commence dans un autre
segment non protégé. Elle ne signale pas la fin du texte ni une ponctuation
adjacente. Elle préserve les décimales réparties ou non entre segments, les URI,
les chemins reconnus et toute limite protégée. Une syntaxe technique non
protégée qui serait lexicalement identique à de la prose reste indécidable dans
le cœur : l’intégration doit alors fournir un segment protégé.

Le catalogue distingue désormais aussi les prescriptions suivant le point, le
deux-points, le point-virgule, le point d’interrogation et le point
d’exclamation. Ces cinq entrées sont sélectionnées en `manual-review` dans le
preset documentaire : aucune nouvelle correction n’est introduite. Pour les
quatre signes de ponctuation haute, le runtime existant continue de produire
l’espace suivante sous l’identifiant de la règle qui traite l’espace
précédente. Cette couverture agrégée reste explicitement transitoire ; une
future tranche pourra séparer la provenance des changements à sortie
strictement identique.

La conception des points de suspension est stabilisée dans
[`points-de-suspension-v0.1.md`](points-de-suspension-v0.1.md), sans ajout au
catalogue ni au runtime. Elle choisit `U+2026` comme sortie moderne explicite,
distingue quatre fonctions textuelles, préserve la ponctuation adjacente et
réserve la correction automatique aux classifications certaines. Les
séquences techniques, les suites de longueur différente de trois et les
coupures éditoriales non structurées restent protégées ou soumises à revue.

## 4. Priorités révélées par la matrice

1. Séparer, dans le runtime, la provenance des espaces précédant et suivant la
   ponctuation haute, sans modifier les sorties ni relâcher les protections.
2. Implémenter séparément la reconnaissance en diagnostic, la règle de glyphe,
   puis les espacements `final`, `initial` et `word` selon les niveaux de sûreté
   définis dans la spécification.
3. Stabiliser le caractère Unicode du groupement numérique, puis compléter les
   exclusions de numérotage avant tout mode `fix`.
4. Maintenir les règles d’unités et d’euro en `lint` par défaut tant que leurs
   ambiguïtés documentées ne sont pas levées.
