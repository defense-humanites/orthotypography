# Conception des points de suspension — Imprimerie nationale 2002

**Version :** 0.1

**Date :** 12 septembre 2026

**Base examinée :** `12ef7c38e6923383c7955cd1f2c445fe6aa32b90`

**Statut :** spécification candidate, sans implémentation runtime

## 1. Objet

Ce document ferme les décisions préalables à une future famille de règles sur
les points de suspension. Il distingue :

- la prescription typographique attestée par le *Lexique* ;
- la fonction des points dans le texte ;
- leur représentation en caractères Unicode ;
- les corrections déterministes et les cas qui exigent un diagnostic ou une
  décision humaine.

Cette tranche ne crée aucun `RuleDefinition`, `RuntimeRule` ou changement
d’API. Les identifiants proposés ci-dessous restent candidats jusqu’à une PR
d’implémentation dédiée.

## 2. Autorités et niveaux de décision

### 2.1 Imprimerie nationale

À l’entrée « Ponctuation », le *Lexique* établit les points suivants :

- les points de suspension marquent une suppression, une interruption ou un
  sous-entendu ;
- ils sont toujours au nombre de trois ;
- ils laissent subsister la ponctuation normale, avant ou après eux selon le
  sens, sauf le point final ou certains points abréviatifs qui se confondent
  avec eux ;
- dans une citation, une coupure éditoriale est généralement placée entre
  crochets pour la distinguer d’une suspension due à l’auteur ;
- ils ne doivent jamais suivre `etc.` ;
- lorsqu’ils remplacent le début d’un texte, ils sont suivis de l’espace
  normale des mots ;
- lorsqu’ils tiennent lieu d’une fin de mot ou de phrase, ils sont collés à la
  dernière lettre ;
- lorsqu’ils remplacent un mot unique, ils sont précédés et suivis de l’espace
  normale.

Le tableau d’espacement et les paragraphes explicatifs prescrivent une forme
visuelle et une fonction, mais aucun point de code Unicode.

### 2.2 Unicode

Unicode définit `U+2026 HORIZONTAL ELLIPSIS` comme le caractère ordinaire
destiné à représenter une ellipse dans le texte :

- [Unicode 17.0, chapitre 6](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-6/) ;
- [table des noms du bloc General Punctuation](https://www.unicode.org/charts/nameslist/n_2000.html).

`U+2026` possède une décomposition de compatibilité en trois `U+002E FULL
STOP`. Il est conservé par NFC et NFD, tandis que NFKC et NFKD le transforment
en `...`. Les formes de normalisation de compatibilité peuvent effacer des
distinctions de présentation et ne doivent pas être appliquées aveuglément à
un texte éditorial :

- [UAX nº 15 — Unicode Normalization Forms](https://www.unicode.org/reports/tr15/).

### 2.3 Décision du projet

Le preset moderne `fr-FR/imprimerie-nationale-2002` choisira `U+2026` comme
sortie canonique d’une ellipse reconnue. Cette décision est une transposition
technique d’Orthotypography, et non une attribution rétroactive au *Lexique*.

La conversion `...` → `…` doit constituer une règle atomique visible. Elle ne
doit appartenir ni à NFC ni à une normalisation Unicode implicite. Un preset
souhaitant préserver trois `U+002E` pourra simplement ne pas sélectionner cette
règle de glyphe.

## 3. Modèle fonctionnel candidat

Une séquence candidate est soit `U+2026`, soit exactement trois `U+002E`
contigus. Sa représentation ne suffit pas à déterminer sa fonction.

| Fonction candidate | Définition | Espacement attendu | Certitude accessible au cœur |
|---|---|---|---|
| `final` | suspension terminant un mot ou une phrase | aucun blanc avant ; espace après seulement si le texte continue | forte lorsque la séquence est attachée à une lettre à gauche |
| `initial` | suppression du début d’une unité textuelle | `U+0020` avant le premier mot conservé | forte au début structurel d’un bloc, plus faible après un simple caractère ouvrant |
| `word` | suppression tenant lieu d’un mot entier | `U+0020` avant et après | faible sans annotation sémantique |
| `editorial-omission` | coupure ajoutée dans une citation | représentation entre crochets selon la marche retenue | dépend de la structure de citation fournie par l’intégration |
| `unknown` | séquence dont la fonction ne peut être établie | aucune correction automatique | certaine comme indétermination |

La classification doit rester interne tant qu’aucun besoin d’intégration ne
justifie une extension du contrat public. Ajouter un indice sémantique à
`TextSegment` constituerait une évolution distincte du contrat et devrait être
coordonné avec `@orthotypography/editor-sdk`.

## 4. Règles atomiques candidates

| Identifiant machine candidat | Responsabilité | Mode initial recommandé |
|---|---|---|
| `punctuation.ellipsis.glyph` | convertir exactement trois `U+002E` reconnus comme ellipse en `U+2026` | `lint`, puis `fix` lorsque la classification de prose est sûre |
| `punctuation.ellipsis.final.no-space-before` | supprimer le blanc précédant une ellipse de fonction `final` | `fix` seulement si la fonction est établie |
| `punctuation.ellipsis.initial.space-after` | insérer `U+0020` après une ellipse de fonction `initial` si du texte suit | `fix` au début structurel certain ; sinon `lint` |
| `punctuation.ellipsis.word.space-around` | entourer de `U+0020` une ellipse remplaçant un mot | `manual-review` sans indice sémantique |

La règle existante `punctuation.ellipsis.after-etc.forbidden` demeure autonome.
Les nouvelles règles doivent exclure sa cible afin d’éviter une conversion
intermédiaire inutile de `etc...` en `etc.…` avant suppression.

## 5. Classification et protections

La future implémentation devrait suivre les étapes suivantes :

1. réunir une suite logique de segments textuels contigus sans traverser un
   segment protégé ;
2. reconnaître `…` ou exactement `...`, y compris lorsque la séquence traverse
   des limites de segments ;
3. exclure les constructions numériques et techniques déjà classifiées ;
4. exclure les tokens de code, URI, chemins, versions, adresses, opérateurs et
   leaders typographiques fournis comme contenus protégés ;
5. déterminer la fonction à partir des voisins et des limites structurelles ;
6. appliquer d’abord la règle de glyphe, puis une seule règle d’espacement
   compatible avec la fonction retenue ;
7. produire des éditions atomiques par segment et les projeter sur les
   coordonnées UTF-16 d’origine.

### 5.1 Cas à préserver

La reconnaissance ne doit pas transformer automatiquement :

- deux points ou quatre points et davantage ;
- `...args`, l’opérateur de propagation ou de reste JavaScript ;
- `../dossier`, `./fichier` et les chemins apparentés ;
- les versions, adresses IP, noms d’hôte ou suites de points servant de
  séparateurs ;
- les lignes de points espacés employées pour une suppression importante ;
- les émoticônes, œuvres littéraires protégées, citations diplomatiques et
  segments portant une autre langue ;
- une séquence coupée par un segment protégé.

Une syntaxe technique non protégée qui est lexicalement identique à de la prose
reste indécidable. L’intégration demeure responsable de sa protection.

### 5.2 Ponctuation adjacente

La ponctuation normale entourant les points de suspension doit être conservée.
Une future règle ne doit donc pas supprimer globalement `,`, `;`, `:`, `?` ou
`!` au contact d’une ellipse.

Le point final et les points abréviatifs demandent une décision sémantique. Une
suite de quatre points ne doit pas être réduite automatiquement : elle peut
exprimer un point suivi d’une ellipse, une saisie fautive ou une ponctuation
expressive. Le cas déterministe de `etc.` reste traité par sa règle spécialisée.

### 5.3 Guillemets, parenthèses et crochets

Un guillemet, une parenthèse ou un crochet fermant peut suivre immédiatement
une ellipse sans recevoir d’espace intérieure supplémentaire. Un délimiteur
ouvrant ne suffit pas toujours à établir que l’ellipse remplace le début du
texte qu’il contient : la limite structurelle fournie par l’intégration est
plus fiable que le seul caractère.

Les coupures éditoriales entre crochets doivent rester distinctes des
suspensions de l’auteur. Leur style exact, notamment la présence éventuelle de
blancs à l’intérieur des crochets, ne sera pas normalisé avant une décision de
marche plus précise.

## 6. Vecteurs de décision

Les sorties ci-dessous décrivent la cible d’une future implémentation, pas un
comportement actuellement disponible.

| Entrée | Fonction ou contexte | Décision candidate |
|---|---|---|
| `Il hésite...` | `final`, prose sûre | `Il hésite…` en `fix` |
| `Il hésite…` | `final`, déjà normalisé | préserver |
| `Il hésite... puis répond.` | `final`, texte continu | `Il hésite… puis répond.` en `fix` |
| `Il hésite…puis répond.` | `final`, espace suivante absente | `Il hésite… puis répond.` en `fix` |
| `... Suite du texte` au début d’un bloc | `initial` certain | `… Suite du texte` en `fix` |
| `…Suite du texte` au début d’un bloc | `initial` certain | `… Suite du texte` en `fix` |
| `mot ... mot` | `word` ou suspension rhétorique | `lint` ou `manual-review` |
| `Alors ...` | `final` possible, mais fonction non établie | `lint`, sans suppression automatique du blanc |
| `Quoi ?...` | ponctuation normale potentiellement conservée | `lint` avant conversion |
| `[...]` ou `[…]` dans une citation | coupure éditoriale possible | préserver jusqu’à classification structurelle |
| `etc...` | interdiction déjà exécutable | `etc.` par la règle spécialisée |
| `version 1.2.3` | construction technique | préserver |
| `const copie = {...objet}` | code | segment protégé, préserver |
| `../dossier` | chemin | préserver |
| `....` | séquence ambiguë | `lint`, jamais réduction automatique |

## 7. Ordre futur dans le pipeline

La famille s’insère dans les phases existantes sans modifier leur ordre :

1. `classify` protège d’abord les constructions numériques et techniques ;
2. `glyphs` reconnaît la séquence et applique éventuellement
   `punctuation.ellipsis.glyph` ;
3. `punctuation-spacing` applique au plus une règle d’espacement déterminée par
   la fonction ;
4. `cleanup` conserve la règle spécialisée après `etc.` et les nettoyages
   strictement locaux.

Pour éviter une édition intermédiaire après `etc.`, la règle de glyphe doit
exclure ce contexte, même si la règle spécialisée intervient dans une phase
ultérieure.

## 8. Découpage recommandé de l’implémentation

La mise en œuvre ne devrait pas être livrée en un seul lot :

1. **Reconnaissance et diagnostic.** Ajouter les définitions documentaires et
   un classificateur conservateur, sans correction d’espacement.
2. **Glyphe.** Implémenter `punctuation.ellipsis.glyph` pour les seuls cas de
   prose reconnus, avec protections, segmentation, UTF-16 et idempotence.
3. **Fonction finale.** Ajouter l’espacement de `final`, qui offre les cas
   automatiques les plus sûrs.
4. **Fonctions initiale et mot.** N’activer `fix` que pour les limites
   structurelles certaines ; conserver les autres cas en `lint` ou
   `manual-review`.

Chaque tranche devra mettre à jour la matrice de couverture et distinguer règle
cataloguée, diagnostic disponible, correction disponible, activation par
preset et version effectivement publiée.
