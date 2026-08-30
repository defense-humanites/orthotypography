# Registre monétaire v0.7

## 1. Sources

Référence d’identité : SIX GROUP. *ISO 4217 — Currency Codes: List One,
Current Currency & Funds*. Zurich : SIX Financial Information, 2026.

Référence typographique : OFFICE QUÉBÉCOIS DE LA LANGUE FRANÇAISE. « Écriture
des symboles d’unités monétaires ». *Vitrine linguistique*, 2019.

SIX est le secrétariat de l’agence de maintenance d’ISO 4217 et publie la List
One en XML. ISO autorise l’utilisation gratuite de ses codes de monnaies.

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

## 3. Import reproductible

La commande `deno task currency:update` télécharge la List One depuis l’URL
officielle de SIX, valide chaque ligne et affiche un aperçu des ajouts, retraits
et modifications. Elle n’écrit rien sans l’option explicite `--write` :

```sh
deno task currency:update --write
```

Une source locale peut être contrôlée avec `--input chemin.xml`; la date de
récupération peut être fixée avec `--retrieved-at AAAA-MM-JJ`. L’écriture
produit deux fichiers à relire ensemble : le module de données et
`docs/iso-4217-update.md`.

Le module généré conserve l’URL, la date de publication annoncée dans le XML,
la date de récupération, l’empreinte SHA-256 de la source et l’indication
`scope: "complete"`. L’empreinte sert ici à vérifier la reproductibilité d’une
donnée en ligne évolutive ; elle n’identifie pas un ouvrage consulté.

Le parseur :

- distingue l’unité mineure `N.A.` de la valeur numérique `0` ;
- accepte les répétitions territoriales seulement si leurs données concordent ;
- rejette les codes alphabétiques ou numériques invalides ;
- rejette le partage d’un code numérique par deux codes alphabétiques ;
- refuse l’écriture si moins de cent monnaies ou fonds distincts sont présents.

## 4. État du registre distribué

Le registre distribué reste pour l’instant un sous-ensemble audité contenant
`EUR`, `USD`, `CAD`, `CHF` et `GBP`. Sa provenance porte donc explicitement
`scope: "subset"` et aucune empreinte de source n’est inventée. Il sera remplacé
par la sortie complète seulement après une exécution réussie de l’import et la
revue du rapport de différences.

Les codes sont sensibles à la casse. Les symboles `€`, `$` et `£` sont des
notations éditoriales distinctes des codes ISO.

## 5. Règle euro

`EURO_SPACING_RULE` ne traite que `€`, symbole non ambigu dans le registre. Elle
diagnostique par défaut les formes `12€` et `€12` et propose `12 €`. Le mode
`fix` doit être demandé explicitement. Les codes `EUR`, les symboles `$` et `£`
et les segments protégés ne sont pas modifiés.
