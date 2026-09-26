# Feuille de route du cœur

État vérifié le 26 septembre 2026 sur
[`713339a`](https://github.com/defense-humanites/orthotypography/commit/713339a5cb5a5b0f0c0e237795dd41022a468b34),
après la fusion de la PR nº 12. La préparation de `0.1.0-alpha.3` est proposée
dans les PR nº 13 à 16, ni fusionnées ni publiées à cette date. Ce document sert de passation ; les prochaines
tâches sont proposées et ne constituent pas une promesse de release.

## État acquis

| Chantier                | État vérifié                                                                                                                               | Preuve                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Distribution JavaScript | Alpha publique `0.1.0-alpha.2`, distribution JSR et npm ; `0.1.0-alpha.3` préparée dans la [PR nº 16](https://github.com/defense-humanites/orthotypography/pull/16), non publiée | [Release](https://github.com/defense-humanites/orthotypography/releases/tag/v0.1.0-alpha.2), [manifeste](../deno.json) |
| Catalogue documentaire  | Modèle de règles, autorités et deux presets français candidats ; prescriptions d’espacement après ponctuation représentées par des identifiants autonomes | [Catalogue](catalogue-documentaire-v0.1.md), [matrice](matrice-couverture-in-2002-v0.1.md) |
| Normalisation           | Pipeline, classification numérique, ponctuation exécutable et traitement de suites textuelles traversant les nœuds                         | [README](../README.md), [architecture](architecture-v0.4.md)                                                           |
| Changements localisés   | `TextChange` et `applyTextChanges` avec contrôles du texte attendu, des segments, des bornes UTF-16, des chevauchements et des protections | [Contrat](integration-contract-v0.1.md), [implémentation](../src/changes.ts)                                           |
| Registres               | Unités et monnaies documentées ; leur présence ne signifie pas que toutes les corrections sont activées par défaut                         | [Unités](registre-unites-v0.7.md), [monnaies](registre-monnaies-v0.7.md)                                               |
| Matrice de couverture   | Prescriptions du dépouillement reliées au catalogue, à l’exécution, aux tests, aux exclusions et au preset IN 2002                   | [Matrice](matrice-couverture-in-2002-v0.1.md)                                                                          |
| Groupement des chiffres | Prescription historique et transposition Unicode spécifiées ; premier lint candidat limité aux quantités déjà classifiées, hors preset et sans correction | [Spécification](groupement-chiffres-v0.1.md), [matrice](matrice-couverture-in-2002-v0.1.md) |
| Ponctuation haute       | Règles d’espace avant et après exécutées et diagnostiquées sous huit identifiants atomiques, à sortie inchangée ; tranche fusionnée dans la PR nº 7 | [Catalogue](../src/catalogue/rules.ts), [tests](../tests/high_punctuation_atomicity_test.ts), [matrice](matrice-couverture-in-2002-v0.1.md) |
| Points de suspension    | Quatre règles atomiques cataloguées ; reconnaissance interne de `U+2026` et de trois `U+002E`, correction du glyphe des formes finales ou initiales certaines (PR nº 10) et espace après `…` initiale structurelle (PR nº 11), tous deux hors preset | [Conception](points-de-suspension-v0.1.md), [tests](../tests/ellipsis_initial_spacing_test.ts), [matrice](matrice-couverture-in-2002-v0.1.md) |
| Validation de release   | 87 tests annoncés pour alpha.2, contrôles JSR et npm ; 146 tests exécutés localement sur la branche de préparation d’alpha.3 | Notes de la release ci-dessus ; ce nombre n'est pas une nouvelle exécution des tests                                   |

Le cœur reste indépendant des parseurs Markdown/HTML et des API d'éditeurs. Les
adaptateurs et leur avancement sont suivis dans la
[feuille de route des intégrations](https://github.com/defense-humanites/orthotypography-integrations/blob/main/docs/roadmap.md).

La [PR nº 9](https://github.com/defense-humanites/orthotypography/pull/9), fusionnée, conserve les vérifications Deno sur chaque PR et
chaque push vers `main`, mais limite les contrôles de paquets JSR et npm aux
changements du cœur, du manifeste, des scripts et des workflows de publication
ou de CI. Elle permet aussi une exécution manuelle complète, parallélise les
contrôles de paquets avec les tests et annule les exécutions de PR dépassées.
Le workflow de publication garde tous ses contrôles sur le tag de release.

La [CI de la PR nº 11](https://github.com/defense-humanites/orthotypography/actions/runs/36231507386)
a réussi `deno task check`, `deno task test`, le contrôle JSR et le contrôle
npm. Cette validation de PR ne constitue ni une publication ni un essai dans
un éditeur ; sur `main`, le manifeste et le dernier tag restent à
`0.1.0-alpha.2`.

La préparation de `0.1.0-alpha.3` comprend quatre PR ouvertes :

- [nº 13](https://github.com/defense-humanites/orthotypography/pull/13) renomme l’identifiant non publié `number.groupDigits` en
  `number.digits.grouping`, selon la convention des autres règles ; le
  dépouillement conserve `number.groupDigits` comme identifiant de prescription ;
- [nº 14](https://github.com/defense-humanites/orthotypography/pull/14) retire le jeton npm du workflow de publication, la publication
  de confiance étant configurée, et réécrit `RELEASING.md` ;
- [nº 15](https://github.com/defense-humanites/orthotypography/pull/15) actualise `CONTRIBUTING.md` ;
- [nº 16](https://github.com/defense-humanites/orthotypography/pull/16), qui dépend de la nº 13, fixe la version, complète le
  `CHANGELOG`, actualise le README et synchronise la matrice de couverture.

La publication suivra `RELEASING.md` après fusion et sur instruction explicite.
Côté intégrations, les tests hors ligne des adaptateurs Markdown/Astro passent
contre `main`, mais cinq tests du SDK Google Docs dépendent du nombre exact de
requêtes ou de l’ordre du preset et devront être adaptés lors de la montée de
version.

## Prochaines tâches proposées

1. **Cohérence documentaire et linguistique.** Auditer les textes hors de
   `docs/`, traduire leur prose en anglais et actualiser les instructions
   devenues obsolètes. `CONTRIBUTING.md` et `RELEASING.md` sont traités dans
   les PR [nº 15](https://github.com/defense-humanites/orthotypography/pull/15) et [nº 14](https://github.com/defense-humanites/orthotypography/pull/14) ; reste à décider si les
   descriptions françaises de `src/catalogue/rules.ts` relèvent des données ou
   de la prose à traduire. Conserver les données
   linguistiques nécessaires aux règles et aux tests. Terminé lorsque les
   fichiers concernés respectent `AGENTS.md` et que les commandes documentées
   correspondent au manifeste courant.
2. **Matrice de couverture.** Première version achevée dans
   [`matrice-couverture-in-2002-v0.1.md`](matrice-couverture-in-2002-v0.1.md).
   Son en-tête et ses sections sur les points de suspension sont synchronisés
   dans la [PR nº 16](https://github.com/defense-humanites/orthotypography/pull/16). La maintenir à chaque ajout de catalogue,
   d’exécution, de test ou de preset.
3. **Extension atomique des règles.** L’interdiction des points de suspension
   après `etc.` et `space.after.comma` ont été fusionnées dans les PR
   [nº 2](https://github.com/defense-humanites/orthotypography/pull/2) et
   [nº 3](https://github.com/defense-humanites/orthotypography/pull/3). Les
   prescriptions suivant le point et la ponctuation haute ont reçu des
   identifiants documentaires autonomes dans la
   [PR nº 4](https://github.com/defense-humanites/orthotypography/pull/4). La
   [conception des points de suspension](points-de-suspension-v0.1.md), fusionnée
   dans la [PR nº 5](https://github.com/defense-humanites/orthotypography/pull/5),
   fixe le choix de glyphe, les fonctions d’espacement, les protections et le
   découpage recommandé, sans ajouter de comportement exécutable. La
   [spécification du groupement des chiffres](groupement-chiffres-v0.1.md),
   fusionnée dans la
   [PR nº 6](https://github.com/defense-humanites/orthotypography/pull/6),
   stabilise ensuite la transposition Unicode et borne un premier lint aux
   mesures, pourcentages et monnaies classifiés. La règle reste hors preset,
   sans correction automatique ; les quantités autonomes et les autres règles
   numériques demeurent exclues. La PR
   [nº 7](https://github.com/defense-humanites/orthotypography/pull/7) atomise
   ensuite l’exécution des espaces suivant les quatre signes de ponctuation
   haute sous leurs identifiants documentaires propres. Elle conserve l’ordre,
   les protections et les sorties du preset ; seule la provenance des
   diagnostics et des changements est affinée. La
   [PR nº 8](https://github.com/defense-humanites/orthotypography/pull/8)
   a catalogué le glyphe et les trois fonctions d’espacement des points de
   suspension. Cette première tranche reconnaissait les deux représentations
   et diagnostiquait seulement les trois points ASCII de fonction finale ou
   initiale certaine, sans corriger le glyphe ni les espaces.
   La [PR nº 10](https://github.com/defense-humanites/orthotypography/pull/10)
   a fusionné la tranche H : correction atomique `...` → `…` pour les fonctions
   `final` et `initial` certaines, en mode explicite `fix`. Le mode par défaut
   reste `lint` et l’export de reconnaissance demeure un alias du même objet.
   La [PR nº 11](https://github.com/defense-humanites/orthotypography/pull/11)
   a ensuite fusionné la tranche I : `punctuation.ellipsis.initial.space-after`
   diagnostique par défaut l’absence d’espace après `…` au début structurel
   certain, puis insère `U+0020` en mode `fix` explicite. Ces deux règles
   restent hors du preset et ne sont pas encore publiées. `...Suite` demeure
   exclu par le classificateur actuel. La règle
   `punctuation.ellipsis.final.no-space-before` reste documentaire : les
   ellipses finales certaines sont déjà collées à la lettre précédente,
   tandis que `Alors ...` n’a pas de fonction établie.
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
