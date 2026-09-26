# Revue d’architecture du cœur — v0.1

**Date :** 26 septembre 2026
**Base examinée :** `@orthotypography/core@0.1.0-alpha.3`, commit
[`7905702`](https://github.com/defense-humanites/orthotypography/commit/7905702e1a56ec3b0130504b766835896ce48c49)
**Objet :** évaluer l’architecture avant d’étendre le catalogue exécutable
(tirets, glyphes des guillemets, autres règles numériques).

Cette revue constate et propose. Chaque proposition fait l’objet d’une issue
délimitée ; aucune décision d’API n’est prise ici. Les mesures ont été faites
hors CI, sous Deno 2.9, avec `IMPRIMERIE_NATIONALE_RULES`.

## 1. Acquis à conserver

- La distinction entre `RuleDefinition` documentaire et `RuntimeRule`
  exécutable, qui empêche de confondre une heuristique avec une prescription.
- Les `TextChange` en coordonnées UTF-16 sources, gardés par `expected`, et
  `applyTextChanges`, qui valide un lot complet avant toute application.
- Les segments protégés comme unique primitive de préservation, qui tient le
  cœur à l’écart des parseurs et des éditeurs.
- La compilation du pipeline, qui refuse doublons, dépendances absentes,
  dépendances vers une phase ultérieure et cycles avant toute transformation.
- Les contrôles de divergence du journal des changements, qui interrompent le
  traitement plutôt que de produire un résultat incohérent.

## 2. Constats

### 2.1 Coût quadratique du mode `fix`

| Entrée | Temps en `fix` |
| --- | --- |
| 24 400 caractères, un segment | 0,3 s |
| 122 000 caractères, un segment | 7,3 s |
| 488 000 caractères, un segment | 150 s |
| 1 000 nœuds, 122 000 caractères | 2,5 s |

À 122 000 caractères, 74 % du temps est passé dans `applyLedgerEdit` : chaque
édition reconstruit la valeur du journal, parcourt et découpe ses morceaux puis
les fusionne. Le mode `fix` est environ sept fois plus lent que le mode `lint`
sur la même entrée. Un chapitre ou un document d’éditeur de taille ordinaire
devient donc coûteux, a fortiori sous JavaScriptCore dans l’application macOS.
→ [nº 20](https://github.com/defense-humanites/orthotypography/issues/20)

### 2.2 Application segment par segment

`RuntimeRule.apply` reçoit un segment, lit les autres par `context.segments` et
peut modifier ses voisins par `segmentEdits`. Chaque module reconstruit donc la
suite logique et ses voisinages : `applyEdits` existe en quatre exemplaires, la
reconstruction de la suite en quatre variantes. Cette reconstruction a lieu à
chaque segment, d’où un second coût quadratique, et deux règles touchant la
même frontière doivent convenir de celle qui la modifie, comme lors de
l’atomisation de la ponctuation haute. Il est proposé que le pipeline fournisse
une vue unique de la suite logique et projette lui-même les résultats.
→ [nº 21](https://github.com/defense-humanites/orthotypography/issues/21)

### 2.3 Classification non partagée

Seules les constructions à protéger sortent du classificateur numérique, sous
forme de segments protégés ; les règles de pourcentage, d’unités, d’euro et de
groupement reclassifient chaque fragment. Une construction répartie sur deux
nœuds échappe ainsi aux règles numériques : `Il mesure 25` suivi de `%.` reste
inchangé, alors que la ponctuation traverse les nœuds. Des annotations typées,
calculées une fois pendant la phase `classify`, donneraient à `dependsOn` le
sens d’une dépendance de données.
→ [nº 22](https://github.com/defense-humanites/orthotypography/issues/22)

### 2.4 Presets et modes hors du catalogue

`IMPRIMERIE_NATIONALE_RULES` est assemblé à la main, sans test de
correspondance avec le preset documentaire, et `fr-CA/oqlf` n’a pas de
composition exécutable. `PresetRuleSelection.mode` n’est jamais lu. Le mode du
pipeline s’impose à toutes les règles : `mode: "fix"` corrige aussi unités et
euro, documentés comme diagnostics par défaut. `manual-review` n’a pas de
sémantique d’exécution.
→ [nº 23](https://github.com/defense-humanites/orthotypography/issues/23)

### 2.5 Locales comparées à l’identique

Avec `fr`, `fr-BE` ou `fr-fr`, aucune règle ne s’applique et
`appliedRuleIds` est vide, sans erreur.
→ [nº 24](https://github.com/defense-humanites/orthotypography/issues/24)

### 2.6 Règle exécutable et définition documentaire liées

Une règle exécutable embarque une `RuleDefinition` complète. Une règle tierce
ou de test doit donc fabriquer sources et statut ; les tests du SDK empruntaient
la dernière définition d’une composition et ont cessé de fonctionner avec
`0.1.0-alpha.3`.
→ [nº 25](https://github.com/defense-humanites/orthotypography/issues/25)

### 2.7 Diagnostics et corrections disjoints

Hors mode `lint`, un diagnostic peut être exprimé dans l’espace `runtime`. Les
intégrations effectuent donc une passe `lint` et une passe `fix`, et la
première ignore les effets en cascade des corrections antérieures. Rattacher à
chaque diagnostic corrigeable sa proposition de `TextChange` servirait
directement les parcours de revue.
→ [nº 26](https://github.com/defense-humanites/orthotypography/issues/26)

### 2.8 Erreurs et messages

Les erreurs sont des `Error` sans code et les messages de diagnostic des
phrases anglaises fixées dans chaque règle. Une interface en français ne peut
ni les distinguer ni les traduire.
→ [nº 27](https://github.com/defense-humanites/orthotypography/issues/27)

### 2.9 Filet de tests et matrice

Les tests sont écrits règle par règle ; aucun test générique ne vérifie
l’application des changements, l’intégrité des segments protégés,
l’idempotence ou la concordance entre diagnostics et corrections, et aucune
mesure de performance n’existe. La matrice de couverture est maintenue à la
main et a déjà dû être resynchronisée plusieurs fois.
→ [nº 19](https://github.com/defense-humanites/orthotypography/issues/19),
[nº 28](https://github.com/defense-humanites/orthotypography/issues/28)

## 3. Ordre proposé

1. Filet de sécurité : invariants génériques, corpus et mesure de performance
   ([nº 19](https://github.com/defense-humanites/orthotypography/issues/19)).
2. Journal des changements linéaire, sans changement d’API
   ([nº 20](https://github.com/defense-humanites/orthotypography/issues/20)).
3. Vue de la suite logique et annotations typées
   ([nº 21](https://github.com/defense-humanites/orthotypography/issues/21),
   [nº 22](https://github.com/defense-humanites/orthotypography/issues/22)),
   avec la séparation entre règle exécutable et définition
   ([nº 25](https://github.com/defense-humanites/orthotypography/issues/25)) :
   rupture de l’API des règles, à regrouper dans une ligne `0.2`.
4. Presets compilés, modes par règle et correspondance des locales
   ([nº 23](https://github.com/defense-humanites/orthotypography/issues/23),
   [nº 24](https://github.com/defense-humanites/orthotypography/issues/24)).
5. Diagnostics porteurs de corrections, erreurs et messages codés
   ([nº 26](https://github.com/defense-humanites/orthotypography/issues/26),
   [nº 27](https://github.com/defense-humanites/orthotypography/issues/27)),
   planifiés avec la feuille de route des intégrations.
6. Matrice générée
   ([nº 28](https://github.com/defense-humanites/orthotypography/issues/28)).

Les étapes 3 et 5 modifient le contrat consommé par les adaptateurs et le SDK.
L’extension du catalogue exécutable reprend après l’étape 3, afin que les
nouvelles règles soient écrites directement dans le nouveau modèle.
