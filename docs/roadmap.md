# Feuille de route du cœur

État vérifié le 12 septembre 2026 sur
[`09b599b`](https://github.com/defense-humanites/orthotypography/commit/09b599b52fd6fee20c22694b074e93275334075f),
après la fusion de la PR nº 3. Ce document sert de passation ; les prochaines
tâches sont proposées et ne constituent pas une promesse de release.

## État acquis

| Chantier                | État vérifié                                                                                                                               | Preuve                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Distribution JavaScript | Alpha publique `0.1.0-alpha.2`, distribution JSR et npm                                                                                    | [Release](https://github.com/defense-humanites/orthotypography/releases/tag/v0.1.0-alpha.2), [manifeste](../deno.json) |
| Catalogue documentaire  | Modèle de règles, autorités et deux presets français candidats ; prescriptions d’espacement après ponctuation représentées par des identifiants autonomes | [Catalogue](catalogue-documentaire-v0.1.md), [matrice](matrice-couverture-in-2002-v0.1.md) |
| Normalisation           | Pipeline, classification numérique, ponctuation exécutable et traitement de suites textuelles traversant les nœuds                         | [README](../README.md), [architecture](architecture-v0.4.md)                                                           |
| Changements localisés   | `TextChange` et `applyTextChanges` avec contrôles du texte attendu, des segments, des bornes UTF-16, des chevauchements et des protections | [Contrat](integration-contract-v0.1.md), [implémentation](../src/changes.ts)                                           |
| Registres               | Unités et monnaies documentées ; leur présence ne signifie pas que toutes les corrections sont activées par défaut                         | [Unités](registre-unites-v0.7.md), [monnaies](registre-monnaies-v0.7.md)                                               |
| Matrice de couverture   | Prescriptions du dépouillement reliées au catalogue, à l’exécution, aux tests, aux exclusions et au preset IN 2002                   | [Matrice](matrice-couverture-in-2002-v0.1.md)                                                                          |
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
2. **Matrice de couverture.** Première version achevée dans
   [`matrice-couverture-in-2002-v0.1.md`](matrice-couverture-in-2002-v0.1.md).
   La maintenir à chaque ajout de catalogue, d’exécution, de test ou de preset.
3. **Extension atomique des règles.** L’interdiction des points de suspension
   après `etc.` et `space.after.comma` ont été fusionnées dans les PR
   [nº 2](https://github.com/defense-humanites/orthotypography/pull/2) et
   [nº 3](https://github.com/defense-humanites/orthotypography/pull/3). Les
   prescriptions suivant le point et la ponctuation haute possèdent désormais
   des identifiants documentaires autonomes, sélectionnés en `manual-review`.
   La prochaine tranche peut séparer la provenance du runtime à comportement
   constant ou choisir une autre lacune explicite de la matrice.
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
