# Registre monétaire v0.6

## 1. Sources

Référence d’identité : SIX GROUP. *ISO 4217 — Currency Codes: List One,
Current Currency & Funds*. Zurich : SIX Financial Information, 2026.

Référence typographique : OFFICE QUÉBÉCOIS DE LA LANGUE FRANÇAISE. « Écriture
des symboles d’unités monétaires ». *Vitrine linguistique*, 2019.

SIX est le secrétariat de l’agence de maintenance d’ISO 4217. ISO autorise
l’utilisation gratuite de ses codes de monnaies. La version locale des données
est `iso-4217-six-2026-08-30`.

## 2. Séparation des données

ISO 4217 fournit des codes alphabétiques, des codes numériques et les unités
mineures. Il ne définit ni le glyphe éditorial d’une monnaie, ni sa position
dans une langue. Le registre sépare donc :

1. l’identité ISO de la monnaie ;
2. les symboles typographiques attestés ;
3. les règles locales de position et d’espacement.

Cette séparation empêche notamment d’interpréter `$` comme une devise unique.
Dans le périmètre initial, ce symbole peut désigner `USD` ou `CAD`; le moteur
expose cette ambiguïté et ne la résout pas sans contexte supplémentaire.

## 3. Périmètre initial

Le registre contient `EUR`, `USD`, `CAD`, `CHF` et `GBP`. Ce périmètre couvre
les quatre codes et les trois symboles que le classificateur reconnaissait
avant sa mise en registre ; `GBP` rend explicite l’identité associée à `£`. Il
ne prétend pas encore reproduire toute la List One. Une extension mondiale
devra être générée depuis le fichier XML officiel, avec date de récupération et
test de diff.

Les codes sont sensibles à la casse. Les symboles `€`, `$` et `£` sont des
notations éditoriales distinctes des codes ISO.

## 4. Règle euro

`EURO_SPACING_RULE` ne traite que `€`, symbole non ambigu dans le registre. Elle
diagnostique par défaut les formes `12€` et `€12` et propose `12 €`. Le mode
`fix` doit être demandé explicitement. Les codes `EUR`, les symboles `$` et `£`
et les segments protégés ne sont pas modifiés.
