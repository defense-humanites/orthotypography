# Orthotypography — Dépouillement du *Lexique* pour le noyau français

**Version :** 0.3  
**Date d’établissement :** 29 août 2026  
**Statut :** relevé primaire du périmètre microtypographique v1  
**Profil candidat :** `fr-FR/imprimerie-nationale-2002`

## 1. Source examinée

| Champ | Valeur |
|---|---|
| Référence bibliographique (ISO 690) | IMPRIMERIE NATIONALE. *Lexique des règles typographiques en usage à l’Imprimerie nationale*. Paris : Imprimerie nationale, 2002. ISBN 978-2-7433-0482-9. |
| Édition | édition de 2002 ; l’avant-propos la présente comme la « troisième édition », complétant celle de 1975 |

### 1.1 Portée bibliographique et méthodologique

Les prescriptions sont relevées par entrée thématique. Le *Lexique* emploie les catégories de la composition typographique traditionnelle ; les points de code Unicode proposés dans ce document constituent donc des transpositions techniques du projet, et non des prescriptions attribuées directement à l’ouvrage.

La hiérarchie de preuve retenue est :

1. formulation explicite de la prescription ;
2. tableau typographique explicite ;
3. exemples concordants.

Le présent document paraphrase les prescriptions et ne reproduit pas l’ouvrage.

## 2. Localisateurs utilisés

Un localisateur prend la forme :

```text
IN-2002/<entrée>/<sous-rubrique ou tableau>
```

Ces localisateurs sémantiques peuvent être complétés ultérieurement par des numéros de page sans être remplacés.

## 3. Résultats qui débloquent le profil français

| ID atomique | Prescription relevée | Encodage candidat | État | Localisateur |
|---|---|---|---|---|
| `space.before.comma` | aucun blanc avant la virgule | aucun caractère | `VERIFIED` | `IN-2002/Ponctuation/Espacement` |
| `space.before.period` | aucun blanc avant le point | aucun caractère | `VERIFIED` | même localisateur |
| `space.after.comma` | espace justifiante après | `U+0020` | `VERIFIED_MAPPING` | tableau Virgule |
| `space.after.period` | espace justifiante après si du texte suit | `U+0020` | `VERIFIED_MAPPING` | tableau Point |
| `space.before.semicolon` | espace fine insécable | `U+202F` | `VERIFIED_MAPPING` | tableau Point-virgule |
| `space.before.exclamation` | espace fine insécable | `U+202F` | `VERIFIED_MAPPING` | tableau Point d’exclamation |
| `space.before.question` | espace fine insécable | `U+202F` | `VERIFIED_MAPPING` | tableau Point d’interrogation |
| `space.after.highPunctuation` | espace justifiante | `U+0020` | `VERIFIED_MAPPING` | mêmes tableaux |
| `space.before.colon` | espace de mots insécable | `U+00A0` | `VERIFIED_MAPPING` | tableau Deux-points |
| `space.after.colon` | espace justifiante | `U+0020` | `VERIFIED_MAPPING` | tableau Deux-points |
| `quotes.primary.glyphs` | guillemets français ouvrant et fermant | `U+00AB`, `U+00BB` | `VERIFIED` | Ponctuation, Citations |
| `quotes.primary.innerSpacing` | espace de mots insécable à l’intérieur | `U+00A0` | `VERIFIED_MAPPING` | tableaux Guillemets ouvrant/fermant |
| `ellipsis.count` | toujours trois points dans l’usage décrit | trois points ou `U+2026`, voir § 5.4 | `VERIFIED_SEMANTICS` | Ponctuation → Points de suspension |
| `ellipsis.spacing.final` | ellipse de fin de mot ou de phrase collée à la dernière lettre | aucun caractère avant | `VERIFIED` | même localisateur |
| `ellipsis.spacing.initial` | ellipse remplaçant un début suivie de l’espace normale | `U+0020` après | `VERIFIED_MAPPING` | même localisateur |
| `ellipsis.spacing.word` | ellipse remplaçant un mot isolé entourée d’espaces normales | `U+0020` autour | `VERIFIED_MAPPING` | même localisateur |
| `dash.parenthetical.glyph` | le tableau représente le tiret ou « moins » par un demi-cadratin | `U+2013` | `VERIFIED_BY_TABLE` | tableau Tiret (moins) |
| `dash.spacing` | espace justifiante avant et après | `U+0020` | `VERIFIED_MAPPING` | même tableau |
| `dash.closing.beforePeriod` | suppression du second tiret avant le point final | aucun tiret fermant | `VERIFIED` | Ponctuation → Tirets |
| `number.groupDigits` | tranches de trois séparées par une espace insécable non dilatable, parties entière et décimale | `U+202F` candidat | `VERIFIED_SEMANTICS` | `IN-2002/Nombres en chiffres arabes/Nota a` |
| `number.decimalSeparator` | virgule dans les exemples et comme origine du groupement | `U+002C` | `VERIFIED` | même localisateur |
| `number.noGrouping.ordinal` | chiffres collés pour millésimes, matricules, folios et autres numérotages | aucun séparateur | `VERIFIED` | Nombres en chiffres arabes → Nota b |
| `space.before.percent` | exemples composés avec une espace insécable avant `%` | `U+00A0` candidat | `VERIFIED_BY_EXAMPLE` | Nombres en chiffres arabes, exemples du § 4 |
| `percent.glyph` | `%` et `‰` sont les formes ordinaires | `U+0025`, `U+2030` | `VERIFIED` | `IN-2002/Pourcentage` |
| `space.numberUnit` | exemples séparant valeur et symbole ; symbole placé à droite | `U+00A0` candidat | `VERIFIED_BY_EXAMPLE` | `IN-2002/Unités de mesure/Remarques sur les symboles` |
| `unit.symbol.period` | aucun point final | sans point | `VERIFIED` | même localisateur |
| `unit.symbol.plural` | aucune marque du pluriel | symbole invariant | `VERIFIED` | même localisateur |
| `unit.symbol.case` | capitale lorsque le nom dérive d’un nom propre | selon registre d’unités | `VERIFIED` | même localisateur |
| `currency.euro.position` | symbole à droite de la valeur | valeur puis espace puis `€` | `VERIFIED_BY_EXAMPLE` | `IN-2002/Euro` |
| `space.numberEuro` | exemples avec espace insécable entre valeur et `€` | `U+00A0` candidat | `VERIFIED_BY_EXAMPLE` | même localisateur |

`VERIFIED_MAPPING` signifie que le terme traditionnel se transpose sans ambiguïté fonctionnelle raisonnable vers le point de code proposé. `VERIFIED_BY_EXAMPLE` reste moins fort qu’une formulation explicite. `VERIFIED_SEMANTICS` signifie que la fonction est établie mais que le point de code final demande une décision technique.

## 4. Comparaison avec `fr-CA/oqlf`

| Construction | `fr-FR/imprimerie-nationale-2002` | `fr-CA/oqlf` | Conséquence |
|---|---|---|---|
| avant `:` | espace de mots insécable → `<NBSP>` | `<NBSP>` | primitive commune |
| avant `;?!` | fine insécable obligatoire → `<NNBSP>` | aucune ou fine ; fine préférée en composition soignée | même primitive, presets canadiens distincts |
| intérieur de `« »` | espace de mots insécable → `<NBSP>` | `<NBSP>` | primitive commune |
| ellipse | trois points décrits fonctionnellement | glyphe `…` documenté par l’OQLF | politique de glyphe distincte de la fonction |
| groupement numérique | espace insécable non dilatable, groupes de trois des deux côtés de la virgule | groupes de trois ; quatre chiffres facultatifs | seuils et point de code à comparer |
| tiret d’incise | demi-cadratin dans le tableau, espaces justifiantes | demi-cadratin dans les exemples, insécabilité précisée autour de l’incise | primitive de glyphe commune, stratégie d’insécabilité différente |
| pourcentage | espace avant `%` attestée par exemples | `<NBSP>` explicitement documentée | comportement commun, force documentaire différente |
| unités | symbole à droite, espacé, invariant | `<NBSP>` explicitement prescrite | comportement commun |
| euro | `40 €`, `29,95 €` | monnaies à droite avec `<NBSP>` | comportement commun pour l’euro |

Le principal écart confirmé du noyau n’est donc pas le deux-points ni les guillemets, mais le caractère obligatoire de la fine devant `;?!` en France, alors que l’OQLF admet aussi l’absence d’espace au Canada.

## 5. Décisions d’encodage

### 5.1 Espace de mots insécable

La transposition proposée est `U+00A0 NO-BREAK SPACE`. Elle concerne notamment le deux-points et l’intérieur des guillemets. Le tableau distingue explicitement « espace fine insécable » et « espace mots insécable » ; cette distinction terminologique fonde le choix de deux caractères Unicode différents.

### 5.2 Espace fine insécable

La transposition proposée est `U+202F NARROW NO-BREAK SPACE`. Elle concerne `;`, `!` et `?`. Ici, la largeur fine et l’insécabilité sont toutes deux explicites.

### 5.3 Groupement des chiffres

Le texte prescrit une espace « insécable et non dilatable » sans la qualifier de fine ni désigner de point de code. Deux options restent défendables :

- `U+202F`, dont la finesse et l’insécabilité correspondent fonctionnellement au groupement des chiffres ;
- `U+00A0` avec une politique CSS empêchant sa dilatation, plus littérale sur le mot « insécable ».

Recommandation candidate : `U+202F`, mais conserver l’état `VERIFIED_SEMANTICS` jusqu’à comparaison visuelle avec l’édition imprimée.

### 5.4 Points de suspension

Le *Lexique* prescrit la fonction et le nombre de points, non un point de code Unicode. `...` et `…` ne doivent donc pas être confondus dans les données documentaires. Le glyphe `U+2026` peut être choisi par le preset moderne, avec l’OQLF comme autorité complémentaire, mais il ne doit pas être présenté comme une citation Unicode de l’Imprimerie nationale.

### 5.5 Espaces justifiantes

Dans un flux Unicode ou HTML courant, l’espace justifiante après un signe est représentée par `U+0020`. La justification relève ensuite du moteur de mise en page. Elle ne doit pas être remplacée par une espace insécable.

## 6. Exceptions explicites et limites

- Les prescriptions d’espacement sont annoncées « en dehors des courtes justifications », où elles peuvent être nuancées.
- Les parenthèses et crochets ne portent aucun blanc intérieur.
- Les points de suspension ne suivent jamais `etc.`.
- Un tiret fermant disparaît devant un point final.
- Les nombres ayant fonction de numérotage ne sont pas groupés.
- Les symboles d’unités sont distincts des noms d’unités : `5 bar` et `5 bars` peuvent être corrects dans des systèmes différents.
- Les angles et coordonnées possèdent des règles propres ; `20°` ne suit pas automatiquement la règle générale `nombre + unité`.
- Les guillemets anglais ne sont admis qu’exceptionnellement dans un texte français ; le *Lexique* ne justifie donc pas une conversion automatique uniforme des citations imbriquées vers `“…”`.
- Le *Lexique* règle la composition éditoriale, pas les URL, le code, les versions logicielles ou la syntaxe HTML moderne : ces protections restent des décisions techniques du projet.

## 7. Conséquences sur les transformations

| Règle | Mode recommandé | Motif |
|---|---|---|
| espace devant `;?!:` | `fix` après classification | prescription et encodage établis ; protéger heures, ratios, URI et code |
| espaces internes de guillemets français appariés | `fix` | prescription établie ; appariement préalable obligatoire |
| conversion de guillemets droits | `fix` contextuel ou `lint` | fonction ouvrante/fermante à reconnaître |
| groupement des chiffres | `lint` initialement | distinguer quantités, numérotages, versions et identifiants |
| espace avant `%` | `fix` après reconnaissance du nombre | concordance Lexique/OQLF |
| espace entre nombre et unité | `fix` avec registre d’unités | éviter noms communs et identifiants |
| position de `€` | `fix` si construction monétaire certaine | risque de modifier une donnée citée dans une autre convention |
| conversion `...` → `…` | option de preset | le point de code n’est pas imposé par le Lexique |
| conversion de `-` en tiret | `manual-review` par défaut | caractère source trop ambigu |
| espaces autour d’un tiret déjà reconnu | `fix` | règle du tableau, avec exception avant point final |

## 8. Statut du preset français

Le blocage documentaire principal est levé, mais la bonne unité de publication reste un preset nommé :

```text
fr-FR/imprimerie-nationale-2002
```

Il peut passer de `BLOCKED` à `CANDIDATE`. Il ne doit pas être renommé immédiatement `fr-FR/general`, pour trois raisons :

1. le *Lexique* décrit une marche professionnelle identifiée ;
2. certaines règles relèvent de la composition imprimée et demandent une adaptation au Web ;
3. la transposition des catégories typographiques traditionnelles vers Unicode exige quelques choix techniques explicites.

## 9. Travail documentaire restant

### Nécessaire avant le premier code

1. Valider le choix Unicode du groupement numérique.
2. Vérifier la largeur typographique des espaces dans les exemples litigieux.
3. Définir la représentation des espaces pour les sorties `unicode`, `html` et texte contraint.
4. Convertir les vecteurs Markdown du catalogue 0.2 en données de test après décision sur ces points.

### Reportable après le noyau

- appels de notes et astérisques ;
- dialogues et citations sur plusieurs alinéas ;
- abréviations et nombres ordinaux ;
- dates, heures et coordonnées détaillées ;
- capitales, noms propres et organismes ;
- bibliographies, tableaux et formules scientifiques complexes.

## 10. Recommandation

Le moteur initial peut désormais être spécifié autour d’un socle français commun et de deux presets nommés : `fr-FR/imprimerie-nationale-2002` et `fr-CA/oqlf`. Le schéma documentaire doit conserver séparément le terme de la source, le caractère Unicode choisi et le niveau de certitude de cette transposition. Cette séparation évitera de transformer un choix d’encodage contemporain en prétendue règle historique de l’Imprimerie nationale.
