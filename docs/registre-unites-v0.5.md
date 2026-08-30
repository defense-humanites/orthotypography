# Registre des unités v0.5

## 1. Source normative

Référence bibliographique : BUREAU INTERNATIONAL DES POIDS ET MESURES. *Le Système international d’unités (SI)*. 9e éd., version 4.01. Sèvres : BIPM, 2026. DOI [10.59161/AUEZ1291](https://doi.org/10.59161/AUEZ1291).

Le registre transpose les tableaux 2, 4, 7 et 8 ainsi que les règles des sections 5.2 et 5.4.3. La version des données est `bipm-si-9.4.01-2026`.

## 2. Décisions de modélisation

- Les symboles sont sensibles à la casse : `Pa` est reconnu, `pa` ne l’est pas.
- Les 24 préfixes, de `Q` à `q`, sont des données séparées des unités.
- Un préfixe et un symbole forment un symbole indivisible ; les préfixes composés sont rejetés.
- `kg` est reconnu directement mais ne reçoit aucun préfixe. Les multiples et sous-multiples de masse se forment sur `g` : `mg`, non `µkg`.
- Les noms développés comme « kilogrammes » ne sont pas des symboles et restent hors du registre.
- Les unités d’angle `°`, `′` et `″` conservent l’exception normative sans espace.
- Les unités non SI admises sont reconnues sans extrapoler leurs préfixes dans ce premier lot.
- Les unités composées (`m/s`, `kW·h`, exposants) sont différées : elles nécessitent une grammaire, pas une liste supplémentaire d’expressions régulières.

## 3. Périmètre machine

Le registre contient :

1. les sept unités de base ;
2. les vingt-deux unités dérivées à nom et symbole spéciaux ;
3. `g`, base technique des préfixes de masse ;
4. un sous-ensemble explicite des unités non SI admises par le BIPM ;
5. les vingt-quatre préfixes décimaux officiels, y compris `R`, `r`, `Q` et `q` adoptés en 2022 et intégrés à la version 4.01.

`resolveUnitSymbol()` résout d’abord un symbole exact, puis au plus un préfixe suivi d’une unité préfixable. Il n’effectue aucune correction de casse et n’accepte aucun alias Unicode pour `µ`.

## 4. Incidence typographique

Le BIPM prescrit que la valeur numérique précède l’unité et qu’une espace les sépare, sauf pour les trois symboles d’angle. Le choix d’une espace insécable `U+00A0` dans un preset orthotypographique reste une transposition éditoriale portée par la règle et ses sources, non par le registre métrologique lui-même.

La présence d’un symbole dans le registre autorise sa classification comme mesure candidate. Elle n’autorise pas automatiquement une correction : les symboles courts et les identifiants techniques exigent encore les protections syntaxiques des intégrations.

`UNIT_SPACING_RULE` est donc publiée en mode `lint` par défaut. Le mode `fix` doit être demandé explicitement ; il remplace alors le séparateur reconnu par `U+00A0`, conformément au preset éditorial, sans modifier le symbole.
