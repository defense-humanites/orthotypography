# Architecture technique v0.4

## Objectif

Le cœur transforme des segments de texte déjà isolés par une intégration. Il ne parse ni HTML, ni Markdown, ni MDX : ces formats appartiennent aux adaptateurs, qui transmettent au moteur des segments textuels et des segments protégés.

## Séparation des responsabilités

| Couche | Responsabilité |
|---|---|
| catalogue | sources, localisateurs, règles documentaires et presets nommés |
| runtime | implémentations pures des règles atomiques |
| pipeline | ordre, dépendances, segments protégés et diagnostics |
| intégrations | analyse syntaxique des documents et reconstruction sans perte |
| distribution | source JSR canonique et paquet npm généré par `dnt` |

Une règle documentaire n’est pas automatiquement une règle exécutable. `RuleDefinition` décrit ce qui est attesté ; `RuntimeRule` porte l’algorithme. Cette séparation interdit qu’une expression régulière expérimentale soit confondue avec une prescription éditoriale.

## Pipeline

L’ordre stable est : classification, glyphes, guillemets, espaces de ponctuation, espaces numériques, nettoyage. Une dépendance ne peut pas remonter vers une phase ultérieure. Le compilateur du pipeline rejette les identifiants dupliqués, les dépendances absentes et les cycles avant toute transformation.

Les intégrations peuvent protéger un segment entier. Cette primitive suffit au cœur pour préserver code, attributs ou syntaxe, sans lier la bibliothèque à un parseur particulier. Le classificateur numérique peut en outre retourner des plages : le pipeline les transforme immédiatement en segments protégés. Les positions ne survivent donc jamais à une transformation susceptible de les décaler.

### Coordonnées des diagnostics

Une intégration peut attribuer un `id` stable à chaque `TextSegment`. Ces
identifiants doivent être non vides et uniques dans un appel au pipeline ; ils
sont conservés quand le classificateur découpe un nœud en fragments protégés.

Avec `mode: "lint"`, aucune règle ne transforme le texte. Chaque diagnostic et
chaque emplacement `related` est alors exprimé dans l’espace `source` :
`segmentIndex` et `segmentId` désignent le segment fourni par l’intégration,
tandis que `start` et `end` sont des offsets UTF-16 semi-ouverts dans sa valeur
initiale. Une paire peut donc relier deux nœuds distincts sans fusionner leurs
positions. `segmentValue` constitue l’instantané exact auquel appliquer ces
offsets.

Dans tout autre mode, des règles antérieures peuvent avoir modifié ou découpé
le texte. Les diagnostics utilisent alors l’espace `runtime` : ils désignent le
fragment au moment précis de l’exécution de la règle, identifié par son index,
sa révision et `segmentValue`. Une intégration qui doit publier des positions
dans le document source exécute donc une passe `lint` séparée ; elle ne doit pas
projeter les offsets d’une passe de correction sur l’arbre d’origine.

## Catalogue initial

Le catalogue machine contient deux presets candidats :

- `fr-FR/imprimerie-nationale-2002` ;
- `fr-CA/oqlf`.

Les comportements ambigus restent en `lint` ou `manual-review`. Le
classificateur numérique protège les constructions techniques et identifie les
mesures et les monnaies dont la notation figure dans les registres.
L’espacement des unités est
activé en diagnostic par défaut ; sa correction doit être demandée
explicitement. La règle euro suit la même politique ; les symboles monétaires
ambigus restent hors correction automatique.

## API initiale

```ts
import { compilePipeline, runPipeline } from "@orthotypography/core";
import { PRESETS, RULES, SOURCES } from "@orthotypography/core/catalogue";
```

Cette version expose l’infrastructure, les données documentaires, le registre
versionné des unités et préfixes, le registre monétaire initial, le
classificateur numérique, six règles
exécutables de ponctuation, l’espacement des pourcentages et celui des
guillemets français appariés. La composition `IMPRIMERIE_NATIONALE_RULES`
protège d’abord les constructions numériques et techniques, puis applique le
sous-ensemble exécutable du preset attesté. Elle diagnostique l’espacement des
unités et de l’euro sans les corriger par défaut. Elle ne constitue pas un
profil français universel.

## Distribution

Les mêmes sources TypeScript alimentent toutes les distributions JavaScript. Elles sont publiées directement sur JSR sous `@orthotypography/core` ; le paquet npm de même nom et de même version est généré par `@deno/dnt`, avec ESM et déclarations TypeScript. Comme dans `greek-conversion`, la publication de confiance est déclenchée par une release GitHub et reste désactivée tant que la variable `PUBLISH_ENABLED` n’est pas explicitement réglée à `true`.

## Prochain lot

1. Exécuter et auditer le premier import complet de la List One ISO 4217.
2. Définir le contrat d’une intégration rehype, puis Astro, dans un dépôt séparé.
