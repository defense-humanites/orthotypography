# Mesures de performance — référence v0.1

**Date :** 26 septembre 2026 **Base mesurée :** `main` au commit
[`140b38c`](https://github.com/defense-humanites/orthotypography/commit/140b38c),
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
issues [nº 20](https://github.com/defense-humanites/orthotypography/issues/20)
(journal des changements) et
[nº 21](https://github.com/defense-humanites/orthotypography/issues/21)
(reconstruction de la suite logique à chaque segment). Toute modification de ces
chantiers compare ses mesures à ce tableau, sur la même machine.
