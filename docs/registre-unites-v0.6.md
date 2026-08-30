# Registre des unités v0.6

## 1. Source normative

Référence bibliographique : BUREAU INTERNATIONAL DES POIDS ET MESURES. *Le
Système international d’unités (SI)*. 9e éd., version 4.01. Sèvres : BIPM,
2026. DOI [10.59161/AUEZ1291](https://doi.org/10.59161/AUEZ1291).

Le registre transpose les tableaux 2, 4, 7 et 8 ainsi que les règles des
sections 5.2 et 5.4.3. La version des données est
`bipm-si-9.4.01-2026`.

## 2. Symboles atomiques

- Les symboles sont sensibles à la casse : `Pa` est reconnu, `pa` ne l’est pas.
- Les 24 préfixes, de `Q` à `q`, sont des données séparées des unités.
- Un préfixe et un symbole forment un symbole indivisible ; les préfixes
  composés sont rejetés.
- `kg` est reconnu directement mais ne reçoit aucun préfixe. Les multiples et
  sous-multiples de masse se forment sur `g` : `mg`, non `µkg`.
- Les noms développés comme « kilogrammes » ne sont pas des symboles.
- Les unités d’angle `°`, `′` et `″` conservent l’exception normative sans
  espace.
- Les unités non SI admises sont reconnues sans extrapoler leurs préfixes.

## 3. Expressions composées

`resolveUnitExpression()` applique une petite grammaire au-dessus du registre
atomique. Elle reconnaît :

- les produits séparés par une espace ou le point opérateur `⋅` (`U+22C5`) ;
- un unique solidus sans parenthèses (`m/s`) ;
- les exposants entiers écrits en caractères Unicode (`m²`, `s⁻²`) ;
- les facteurs préfixés indivisibles (`kW⋅h`).

Elle rejette les solidus multiples (`m/s/kg`), les exposants nuls, les
préfixes composés et le point médian `·` (`U+00B7`), distinct du point opérateur
normatif. Les parenthèses sont différées : leur ajout exigera un véritable
arbre syntaxique et une règle explicite de désambiguïsation.

Le classificateur automatique adopte un sous-ensemble encore plus prudent :
il reconnaît les puissances et les expressions comportant `⋅` ou `/`, mais pas
les produits séparés par une simple espace. Cette restriction évite d’absorber
la prose qui suit une unité courte ; l’API du registre sait néanmoins valider
ces produits lorsqu’une intégration fournit déjà la frontière de l’expression.

## 4. Périmètre machine

Le registre contient les sept unités de base, les vingt-deux unités dérivées à
nom spécial, `g`, un sous-ensemble explicite des unités non SI admises et les
vingt-quatre préfixes décimaux officiels.

`resolveUnitSymbol()` résout un symbole atomique exact. Il n’effectue aucune
correction de casse et n’accepte aucun alias Unicode pour `µ`.

## 5. Incidence typographique

Le BIPM prescrit que la valeur numérique précède l’unité et qu’une espace les
sépare, sauf pour les trois symboles d’angle. Le choix de `U+00A0` reste une
transposition éditoriale portée par la règle et ses sources.

`UNIT_SPACING_RULE` reste en mode `lint` par défaut. Le mode `fix` remplace
uniquement le séparateur entre la valeur et une expression reconnue ; il ne
réécrit ni les opérateurs, ni les exposants, ni la structure de l’unité.
