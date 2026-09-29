# Mesures de performance — référence v0.1

**Date :** 26 septembre 2026 **Base mesurée :** `main` au commit
[`140b38c`](https://github.com/orthotypography/orthotypography/commit/140b38c),
code du cœur identique à `0.1.0-alpha.3` **Commande :** `deno task bench --full`
**Environnement :** Deno 2.9.6, conteneur Linux x86-64 partagé ; les valeurs
absolues varient selon la machine, seules les tendances comptent.

Le texte répète le corpus de `tests/fixtures/corpus/` jusqu’à la taille visée et
passe par `IMPRIMERIE_NATIONALE_RULES`, soit en un seul segment, soit en nœuds
d’environ 120 caractères. Chaque valeur est la médiane d’au plus trois
exécutions.

| Entrée      | Caractères | Mode   | Temps médian |
| ----------- | ---------: | ------ | -----------: |
| un segment  |     24 997 | `lint` |        41 ms |
| 199 nœuds   |     24 997 | `lint` |       111 ms |
| un segment  |     24 997 | `fix`  |        98 ms |
| 199 nœuds   |     24 997 | `fix`  |       104 ms |
| un segment  |    124 996 | `lint` |       568 ms |
| 995 nœuds   |    124 996 | `lint` |     1 783 ms |
| un segment  |    124 996 | `fix`  |     1 575 ms |
| 995 nœuds   |    124 996 | `fix`  |     1 670 ms |
| un segment  |    499 999 | `lint` |     8 318 ms |
| 3 977 nœuds |    499 999 | `lint` |    25 608 ms |
| un segment  |    499 999 | `fix`  |    33 104 ms |
| 3 977 nœuds |    499 999 | `fix`  |    25 910 ms |

Quand la taille est multipliée par 20, le temps est multiplié par 200 à 340 : la
croissance est quadratique en mode `fix` comme dans le découpage en nœuds, y
compris en `lint`. Les causes et les corrections attendues sont suivies dans les
issues [nº 20](https://github.com/orthotypography/orthotypography/issues/20)
(journal des changements) et
[nº 21](https://github.com/orthotypography/orthotypography/issues/21)
(reconstruction de la suite logique à chaque segment). Toute modification de ces
chantiers compare ses mesures à ce tableau, sur la même machine.

## Après le journal linéaire

Mesures de la même commande après la
[PR de l’issue nº 20](https://github.com/orthotypography/orthotypography/issues/20),
dans le même environnement :

| Entrée      | Caractères | Mode   |     Avant |     Après |
| ----------- | ---------: | ------ | --------: | --------: |
| un segment  |     24 997 | `fix`  |     98 ms |     41 ms |
| un segment  |    124 996 | `fix`  |  1 575 ms |    519 ms |
| un segment  |    499 999 | `fix`  | 33 104 ms |  7 195 ms |
| 3 977 nœuds |    499 999 | `fix`  | 25 910 ms | 22 017 ms |
| un segment  |    499 999 | `lint` |  8 318 ms |  8 095 ms |

Le mode `fix` coûte désormais autant que le mode `lint` : sur 250 000 caractères
en un segment, le pipeline hors règles prend environ 90 ms. La croissance
restante vient des règles elles-mêmes, qui reconstruisent la suite logique à
chaque fragment ; la règle des guillemets français en représente à elle seule
plus de 90 %. Ce coût relève de
l’[issue nº 21](https://github.com/orthotypography/orthotypography/issues/21).

## Après la mise en cache de l’appariement des guillemets

La règle des guillemets français recalculait l’appariement de toute la suite
logique pour chaque fragment. Il est désormais calculé une fois par suite et
réutilisé tant que les segments sont les mêmes objets.

| Entrée      | Caractères | Mode   | Journal linéaire | Avec le cache |
| ----------- | ---------: | ------ | ---------------: | ------------: |
| un segment  |    124 996 | `fix`  |           519 ms |         97 ms |
| un segment  |    499 999 | `lint` |         8 095 ms |        324 ms |
| un segment  |    499 999 | `fix`  |         7 195 ms |        417 ms |
| 3 977 nœuds |    499 999 | `lint` |        21 882 ms |        423 ms |
| 3 977 nœuds |    499 999 | `fix`  |        22 017 ms |        506 ms |

Entre 125 000 et 500 000 caractères, le temps est multiplié par 3,3 à 4,6 pour
une taille multipliée par 4 : la croissance est désormais presque linéaire. Les
autres règles consultent encore les segments voisins à chaque fragment ; la vue
unique de la suite logique de
l’[issue nº 21](https://github.com/orthotypography/orthotypography/issues/21)
supprimera ce coût résiduel.

## Croissance sur entrées défavorables

Les mesures précédentes portent sur de la prose. `deno task bench --scaling`
mesure aussi des entrées construites pour faire apparaître une croissance
quadratique : jetons sans espace contenant de nombreuses virgules, ponctuation
haute très dense, nœuds d’un caractère, nœuds d’espaces autour des signes, nœud
protégé dans chaque groupe de mots. Chaque ligne passe par
`IMPRIMERIE_NATIONALE_RULES` à 31 250, 62 500 et 125 000 caractères et donne le
facteur de croissance pour un doublement de la taille : 2 pour une croissance
linéaire, 4 pour une croissance quadratique. Une ligne s’arrête après une mesure
de plus de 20 s.

Trois coûts quadratiques du pipeline ont été corrigés, sans changement des
sorties :

- l’application des modifications d’un fragment reconstruisait la valeur à
  chaque modification ; elle est désormais assemblée en une passe ;
- la vérification des plages protégées d’une modification sur la suite logique
  parcourait toutes les plages ; elle procède par recherche dichotomique ;
- trois transmissions de tableaux en arguments (`push(...)`, `splice(...)`)
  dépassaient la pile d’appels au-delà d’environ 125 000 changements ou
  fragments.

Mesures après ces corrections, dans le même environnement que ci-dessus :

| Entrée                            | Mode   |    31 250 |    62 500 |   125 000 | Facteur par doublement |
| --------------------------------- | ------ | --------: | --------: | --------: | ---------------------: |
| corpus, un segment                | `lint` |     43 ms |     36 ms |     60 ms |                    1,2 |
| corpus, un segment                | `fix`  |     45 ms |     35 ms |     81 ms |                    1,3 |
| corpus, nœuds de quatre mots      | `lint` |     67 ms |     92 ms |    173 ms |                    1,6 |
| corpus, nœuds de quatre mots      | `fix`  |     61 ms |    109 ms |    254 ms |                    2,0 |
| corpus, nœuds d’un caractère      | `lint` | 10 765 ms | 49 996 ms |         — |                      — |
| corpus, nœuds d’un caractère      | `fix`  | 12 353 ms | 52 769 ms |         — |                      — |
| virgules dans un seul jeton       | `lint` |  1 269 ms |  5 055 ms | 20 860 ms |                    4,1 |
| virgules dans un seul jeton       | `fix`  |  1 312 ms |  5 274 ms | 24 330 ms |                    4,3 |
| ponctuation haute espacée         | `lint` |     18 ms |     20 ms |     42 ms |                    1,5 |
| ponctuation haute espacée         | `fix`  |     51 ms |    158 ms |  3 008 ms |                    7,7 |
| nœuds d’espaces autour des signes | `lint` |  3 860 ms | 15 895 ms | 74 378 ms |                    4,4 |
| nœuds d’espaces autour des signes | `fix`  |  3 543 ms | 14 296 ms | 66 945 ms |                    4,3 |
| nœud protégé par groupe de mots   | `lint` |    130 ms |    363 ms |    764 ms |                    2,4 |
| nœud protégé par groupe de mots   | `fix`  |    158 ms |    390 ms |    791 ms |                    2,2 |

Les lignes encore quadratiques viennent de règles qui n’ont pas encore migré
vers la suite logique
([nº 21](https://github.com/orthotypography/orthotypography/issues/21)) :

- la virgule suivie d’un jeton technique relit tout le jeton qui précède chaque
  virgule, et les règles de ponctuation gardent leur propre copie de
  l’application des modifications : la migration de la ponctuation corrige ces
  deux lignes ;
- l’interdiction des points de suspension après `etc.` reconstruit la suite
  logique pour chaque fragment, d’où les lignes de nœuds d’un caractère et de
  nœuds d’espaces : la migration des points de suspension la corrigera.

Chaque migration de l’étape 2 et de l’étape 3 reprend cette commande et doit
ramener les lignes concernées vers un facteur 2.

## Après la migration de la ponctuation

La migration de la ponctuation vers la suite logique
([PR nº 45](https://github.com/orthotypography/orthotypography/pull/45)) lit le
jeton qui précède une virgule à partir de positions calculées une fois par
passe, et abandonne la copie de l’application des modifications propre à ces
règles. Mesures de la même commande, lignes concernées :

| Entrée                      | Mode   | 31 250 | 62 500 | 125 000 | Facteur par doublement |
| --------------------------- | ------ | -----: | -----: | ------: | ---------------------: |
| virgules dans un seul jeton | `lint` |  56 ms |  59 ms |  108 ms |                    1,4 |
| virgules dans un seul jeton | `fix`  | 101 ms | 126 ms |  242 ms |                    1,6 |
| ponctuation haute espacée   | `lint` |  17 ms |  18 ms |   32 ms |                    1,4 |
| ponctuation haute espacée   | `fix`  |  48 ms |  66 ms |  110 ms |                    1,5 |

Les nœuds d’un caractère et les nœuds d’espaces restent quadratiques avec
`IMPRIMERIE_NATIONALE_RULES`, à cause de la seule règle `etc.` ; avec
`IMPRIMERIE_NATIONALE_PUNCTUATION_RULES`, ces entrées et le nœud protégé par
groupe de mots croissent d’un facteur 2,0 à 2,2 par doublement, mesuré jusqu’à
250 000 caractères pour les nœuds d’un caractère et jusqu’à 1 000 000 pour les
deux autres (par exemple 2,5 s, 5,1 s puis 10,9 s en `fix` pour les nœuds
d’espaces à 250 000, 500 000 et 1 000 000 de caractères).

## Après la migration des points de suspension

La migration des points de suspension
([PR nº 47](https://github.com/orthotypography/orthotypography/pull/47)) achève
l’étape 2 : la règle `etc.` et les règles facultatives de glyphe et d’espace
initial analysent chaque suite non protégée une seule fois, et le classement des
candidats n’examine plus le texte qui précède chacun d’eux.
`deno task bench
--scaling` inclut désormais ces règles facultatives et trois
entrées de points de suspension. Mesures dans le même environnement :

| Entrée                                  | Mode   |   31 250 |   62 500 |  125 000 | Facteur par doublement |
| --------------------------------------- | ------ | -------: | -------: | -------: | ---------------------: |
| corpus, un segment                      | `lint` |    48 ms |    66 ms |   121 ms |                    1,6 |
| corpus, un segment                      | `fix`  |    36 ms |    80 ms |   200 ms |                    2,4 |
| corpus, nœuds de quatre mots            | `lint` |    99 ms |   134 ms |   305 ms |                    1,8 |
| corpus, nœuds de quatre mots            | `fix`  |    91 ms |   176 ms |   432 ms |                    2,2 |
| corpus, nœuds d’un caractère            | `lint` | 1 512 ms | 3 055 ms | 6 868 ms |                    2,1 |
| corpus, nœuds d’un caractère            | `fix`  | 1 448 ms | 3 341 ms | 7 188 ms |                    2,2 |
| virgules dans un seul jeton             | `lint` |    19 ms |    58 ms |   135 ms |                    2,7 |
| virgules dans un seul jeton             | `fix`  |   101 ms |   235 ms |   440 ms |                    2,1 |
| ponctuation haute espacée               | `lint` |    16 ms |    21 ms |    44 ms |                    1,7 |
| ponctuation haute espacée               | `fix`  |    47 ms |   105 ms |   198 ms |                    2,1 |
| points de suspension denses             | `lint` |    21 ms |    43 ms |   105 ms |                    2,2 |
| points de suspension denses             | `fix`  |    30 ms |    48 ms |   118 ms |                    2,0 |
| points de suspension dans un seul jeton | `lint` |    39 ms |    40 ms |    89 ms |                    1,5 |
| points de suspension dans un seul jeton | `fix`  |    36 ms |    39 ms |    92 ms |                    1,6 |
| nœuds de points de suspension           | `lint` |   435 ms | 1 207 ms | 2 627 ms |                    2,5 |
| nœuds de points de suspension           | `fix`  |   589 ms | 1 293 ms | 3 265 ms |                    2,4 |
| nœuds d’espaces autour des signes       | `lint` |   856 ms | 1 519 ms | 3 488 ms |                    2,0 |
| nœuds d’espaces autour des signes       | `fix`  |   709 ms | 1 876 ms | 4 140 ms |                    2,4 |
| nœud protégé par groupe de mots         | `lint` |   311 ms |   561 ms | 1 366 ms |                    2,1 |
| nœud protégé par groupe de mots         | `fix`  |   256 ms |   664 ms | 1 475 ms |                    2,4 |

Sur `main` avant cette PR, 62 500 nœuds d’un caractère prenaient environ 50 s
avec le preset seul, et avec les règles facultatives les points de suspension
denses passaient de 1,5 s à 23 s entre 31 250 et 125 000 caractères, les points
de suspension dans un seul jeton de 24 s à 113 s entre 31 250 et 62 500
caractères. À 500 000 caractères, les trois entrées de points de suspension
prennent de 0,5 à 5 s, avec un facteur 1,5 à 2,4 par doublement.

La règle facultative de groupement des chiffres n’est pas mesurée : elle lit
encore les fragments voisins à chaque fragment et reste fortement quadratique en
nombre de nœuds (15 s pour 8 000 nœuds d’un caractère, 78 s pour 16 000). Elle
relève de l’étape 3, avec les autres règles numériques.
