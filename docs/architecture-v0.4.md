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

Les intégrations peuvent protéger un segment entier. Cette primitive suffit au cœur pour préserver code, attributs, URL ou syntaxe, sans lier la bibliothèque à un parseur particulier.

## Catalogue initial

Le catalogue machine contient deux presets candidats :

- `fr-FR/imprimerie-nationale-2002` ;
- `fr-CA/oqlf`.

Les comportements ambigus restent en `lint` ou `manual-review`. Le classificateur numérique est déclaré comme dépendance mais n’est pas encore implémenté ; les règles d’unités et de monnaies ne doivent donc pas être activées en correction automatique avant le prochain lot.

## API initiale

```ts
import { compilePipeline, runPipeline } from "@orthotypography/core";
import { PRESETS, RULES, SOURCES } from "@orthotypography/core/catalogue";
```

Cette version expose l’infrastructure et les données documentaires. Elle ne promet pas encore une fonction universelle de correction de texte brut.

## Distribution

La source TypeScript Deno 2 est publiée directement sur JSR sous `@orthotypography/core`. Le paquet npm de même nom et de même version est généré par `@deno/dnt`, avec ESM et déclarations TypeScript. Comme dans `greek-conversion`, la publication de confiance est déclenchée par une release GitHub et reste désactivée tant que la variable `PUBLISH_ENABLED` n’est pas explicitement réglée à `true`.

## Prochain lot

1. Implémenter le classificateur des constructions numériques et ses vecteurs négatifs.
2. Implémenter les règles sûres de ponctuation basse sur segments textuels.
3. Ajouter les règles `;?!:` avec diagnostics et tests d’idempotence.
4. Définir le contrat d’une intégration rehype, puis Astro, dans un dépôt séparé.
