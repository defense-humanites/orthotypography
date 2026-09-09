# Feuille de route du cœur

État vérifié le 9 septembre 2026 sur
[`9455cb50`](https://github.com/defense-humanites/orthotypography/commit/9455cb50bbcb946a51e767d0833ccb4313cc847d),
avant l'ajout de cette feuille de route. Ce document sert de passation ; les
prochaines tâches sont proposées et ne constituent pas une promesse de release.

## État acquis

| Chantier                | État vérifié                                                                                                                               | Preuve                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Distribution JavaScript | Alpha publique `0.1.0-alpha.2`, distribution JSR et npm                                                                                    | [Release](https://github.com/defense-humanites/orthotypography/releases/tag/v0.1.0-alpha.2), [manifeste](../deno.json) |
| Catalogue documentaire  | Modèle de règles, autorités et deux presets français candidats ; couverture documentaire distincte de l'exécution                          | [Catalogue](catalogue-documentaire-v0.1.md), [catalogue français](catalogue-francais-v0.2.md)                          |
| Normalisation           | Pipeline, classification numérique, ponctuation exécutable et traitement de suites textuelles traversant les nœuds                         | [README](../README.md), [architecture](architecture-v0.4.md)                                                           |
| Changements localisés   | `TextChange` et `applyTextChanges` avec contrôles du texte attendu, des segments, des bornes UTF-16, des chevauchements et des protections | [Contrat](integration-contract-v0.1.md), [implémentation](../src/changes.ts)                                           |
| Registres               | Unités et monnaies documentées ; leur présence ne signifie pas que toutes les corrections sont activées par défaut                         | [Unités](registre-unites-v0.7.md), [monnaies](registre-monnaies-v0.7.md)                                               |
| Validation de release   | 87 tests annoncés pour alpha.2, contrôles JSR et npm                                                                                       | Notes de la release ci-dessus ; ce nombre n'est pas une nouvelle exécution des tests                                   |

Le cœur reste indépendant des parseurs Markdown/HTML et des API d'éditeurs. Les
adaptateurs et leur avancement sont suivis dans la
[feuille de route des intégrations](https://github.com/defense-humanites/orthotypography-integrations/blob/main/docs/roadmap.md).

## Prochaines tâches proposées

1. **Cohérence documentaire et linguistique.** Auditer les textes hors de
   `docs/`, traduire leur prose en anglais et actualiser les instructions
   devenues obsolètes, notamment celles de contribution. Conserver les données
   linguistiques nécessaires aux règles et aux tests. Terminé lorsque les
   fichiers concernés respectent `AGENTS.md` et que les commandes documentées
   correspondent au manifeste courant.
2. **Matrice de couverture.** Relier chaque règle documentaire à son éventuelle
   implémentation lint/fix, ses tests, ses exceptions et son activation par
   preset. Terminé lorsque le catalogue ne laisse plus confondre règle recensée,
   diagnostic disponible et correction automatique disponible.
3. **Extension atomique des règles.** Choisir une règle manquante à partir de
   cette matrice, documenter sa source et ses exclusions, puis l'implémenter
   dans une tâche dédiée avec cas positifs, négatifs et idempotence.
4. **Stabilité du contrat d'intégration.** Examiner les besoins remontés par les
   adaptateurs sans transférer leurs contraintes natives dans le cœur. Toute
   évolution publique doit avoir des tests de contrat et une stratégie explicite
   de compatibilité et de versionnement.

## Pilotage et passation

Le chat Core porte les décisions typographiques et le contrat du moteur. La
coordination arbitre les dépendances et les publications avec les intégrations.
Chaque réalisation reçoit une issue délimitée : objectif, source, périmètre,
critères d'acceptation, validations et dépendances. Ajouter ici les liens vers
les issues et PR lorsqu'elles existent, sans inventer de numéro.

Après une fusion ou une publication, actualiser l'état et ses preuves. Une PR
fusionnée, une CI réussie et une version disponible dans les registres sont des
étapes distinctes. Les fichiers `AGENTS.md` portent les consignes stables ;
cette feuille porte l'état et les prochaines décisions.
