# Registre des unités v0.7

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

## 3. Arbre des expressions composées

`resolveUnitExpression()` construit un arbre syntaxique exposé en lecture seule. Ses nœuds
publics sont `factor`, `product`, `quotient`, `group` et `power`. La liste
aplatie `factors` reste disponible pour les consommateurs qui veulent seulement
connaître les symboles, leurs puissances et leur position effective.

La grammaire reconnaît :

- les produits séparés par une espace ou le point opérateur `⋅` (`U+22C5`) ;
- au plus un solidus à chaque niveau de l’arbre ;
- les groupes parenthésés et leurs puissances, comme `(m/s)²` ;
- les quotients imbriqués désambiguïsés, comme `m/(s⋅kg)` ou `m/(s/kg)` ;
- les exposants entiers écrits en caractères Unicode (`m²`, `s⁻²`) ;
- les facteurs préfixés indivisibles (`kW⋅h`).

Ainsi, `m/s/kg` reste invalide, tandis que `m/(s/kg)` est accepté parce que la
parenthèse fixe explicitement la portée du second solidus. La profondeur des
groupes est limitée à seize niveaux pour borner le travail du parseur.

La grammaire rejette aussi les exposants nuls, les préfixes composés et le point
médian `·` (`U+00B7`), distinct du point opérateur normatif.

## 4. Classification automatique

Le classificateur reconnaît les puissances et les expressions comportant `⋅`,
`/` ou un groupe parenthésé simple. Il ne déduit pas les produits séparés par
une simple espace, afin de ne pas absorber la prose placée après une unité
courte. L’API du registre sait néanmoins valider ces produits lorsqu’une
intégration fournit déjà la frontière de l’expression.

## 5. Incidence typographique

Le BIPM prescrit que la valeur numérique précède l’unité et qu’une espace les
sépare, sauf pour les trois symboles d’angle. Le choix de `U+00A0` reste une
transposition éditoriale portée par la règle et ses sources.

`UNIT_SPACING_RULE` reste en mode `lint` par défaut. Le mode `fix` remplace
uniquement le séparateur entre la valeur et une expression reconnue ; il ne
réécrit ni les opérateurs, ni les exposants, ni les parenthèses.
