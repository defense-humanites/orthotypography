# Conception — diagnostics reliés à leurs changements v0.1

**Date :** 30 septembre 2026 **Issue :**
[nº 26](https://github.com/orthotypography/orthotypography/issues/26)
(changements proposés rattachés aux diagnostics) **Base examinée :** `main` au
commit `bfcb659`, après le chantier de la suite logique
([nº 21](https://github.com/orthotypography/orthotypography/issues/21)) **Statut
:** proposition à valider ; aucune implémentation dans ce document

## 1. Objet

Une intégration qui veut à la fois signaler et corriger exécute aujourd’hui deux
passes : `lint` pour des diagnostics en coordonnées sources, `fix` pour les
changements. Rien ne relie un diagnostic au changement qui le corrige. Ce
document fixe le contrat qui permet à une seule passe de fournir les deux,
rattachés l’un à l’autre, pour la ligne `0.2`.

## 2. État actuel

- Une règle renvoie deux listes indépendantes, `edits` et `diagnostics`
  (`RuleResult`). Le lien entre une modification et le diagnostic qui la
  justifie n’existe que dans le code de la règle.
- En mode `lint`, aucune règle ne modifie le texte : chaque règle voit le texte
  d’origine et les diagnostics sont en coordonnées `source`.
- En mode `fix`, chaque règle voit le texte laissé par les précédentes. Un
  diagnostic dont l’objet recoupe un texte déjà modifié passe dans l’espace
  `runtime` (fragment, révision, valeur du moment), que l’intégration ne peut
  pas projeter sur son document.
- Le journal des changements fusionne les modifications contiguës de plusieurs
  règles en un seul `TextChange`, qui garde la liste de leurs `ruleIds`.
- L’editor SDK exécute les deux passes : `prepareDocumentPlan` prend les
  diagnostics de `lint` et les changements de `fix`. Les adaptateurs rehype,
  Sätteri et Astro transmettent les diagnostics du mode choisi, y compris des
  emplacements `runtime` en mode `fix`.

Mesure sur le corpus (18 paragraphes, toutes les règles exécutables, un segment)
: en mode `fix`, 5 diagnostics sur 67 sont en coordonnées `runtime`, et un
paragraphe n’a pas les mêmes diagnostics en `lint` et en `fix`, parce qu’une
correction antérieure crée ou supprime l’objet d’une règle suivante.

## 3. Décisions proposées

1. **Les modifications appartiennent aux diagnostics.** Une règle ne renvoie
   plus de liste `edits` séparée : chaque `RunDiagnostic` porte, le cas échéant,
   les modifications qui le corrigent. Une correction sans diagnostic devient
   impossible par construction ; le harnais d’invariants le vérifie déjà.
2. **Une passe `fix` suffit.** Elle applique les modifications des règles en
   mode `fix` et renvoie tous les diagnostics, chacun relié aux changements
   finaux qui contiennent ses modifications.
3. **Tous les emplacements sont en coordonnées sources.** L’espace `runtime`
   disparaît. Un objet situé dans un texte déjà modifié est rapporté sur la
   plage source du changement qui l’a produit (§ 6).
4. **Le lien est une liste d’identifiants.** Chaque `TextChange` reçoit un `id`
   stable dans le résultat ; chaque diagnostic porte `changeIds`. Le lien est de
   plusieurs à plusieurs, parce que le journal fusionne des modifications
   voisines.
5. **Le mode `lint` reste** une passe sans modification ni cascade, utile aux
   vérifications en intégration continue. Ses diagnostics portent leur
   `replacement` indicatif comme aujourd’hui, sans `changeIds`.

Les alternatives écartées sont au § 11.

## 4. Contrat des règles

```ts
interface RunDiagnostic extends RunLocation {
  readonly message: string;
  readonly replacement?: string;
  readonly related?: readonly RunLocation[];
  /** Modifications qui corrigent ce diagnostic ; appliquées en mode `fix`. */
  readonly edits?: readonly RunEdit[];
}

interface RuleResult {
  readonly diagnostics?: readonly RunDiagnostic[];
  /** Réservé aux règles de la phase `classify`. */
  readonly annotations?: readonly Annotation[];
}
```

- Le pipeline valide l’ensemble des modifications d’une règle comme aujourd’hui
  (§ 4.1 de la
  [conception de la suite logique](conception-suite-logique-v0.1.md)), toutes
  diagnostics confondues : deux diagnostics ne peuvent pas proposer des
  modifications qui se chevauchent.
- Une règle peut renvoyer ses modifications quel que soit le mode ; le pipeline
  ne les applique qu’en mode `fix`. Les règles n’ont plus à tester `run.mode`
  pour décider de renvoyer ou non leurs corrections.
- Une règle de simple diagnostic (groupement des chiffres) ne renvoie pas
  d’`edits`.

Les règles livrées produisent déjà un diagnostic par groupe de modifications ;
leur migration consiste à déplacer ces modifications dans le diagnostic
correspondant.

## 5. Résultat du pipeline

```ts
interface TextChange {
  /** Identifiant stable dans ce résultat, dans l’ordre de `changes`. */
  readonly id: string;
  readonly segmentIndex: number;
  readonly segmentId?: string;
  readonly start: number;
  readonly end: number;
  readonly expected: string;
  readonly replacement: string;
  readonly ruleIds: readonly string[];
}

interface DiagnosticLocation {
  readonly segmentIndex: number;
  readonly segmentId?: string;
  /** Valeur source du segment, à laquelle s’appliquent start et end. */
  readonly segmentValue: string;
  readonly start: number;
  readonly end: number;
}

interface RuleDiagnostic extends DiagnosticLocation {
  readonly ruleId: string;
  readonly message: string;
  readonly replacement?: string;
  readonly related?: readonly DiagnosticLocation[];
  /** Changements appliqués qui contiennent les modifications de ce diagnostic. */
  readonly changeIds?: readonly string[];
}
```

- `coordinateSpace` et `segmentRevision` disparaissent.
- Invariants, vérifiés par le harnais : chaque `id` de `changeIds` désigne un
  changement du résultat ; chaque changement est désigné par au moins un
  diagnostic ; appliquer tous les changements reproduit la sortie du mode `fix`,
  comme aujourd’hui.

## 6. Projection des emplacements sur la source

Le journal d’un segment source est une suite de pièces, inchangées ou produites
par des règles. Un emplacement exprimé sur le texte courant se projette borne
par borne :

- une borne située dans une pièce inchangée garde sa position source exacte ;
- une borne `start` située dans une pièce modifiée prend le début source de
  cette pièce, une borne `end` sa fin source.

La plage obtenue contient donc toujours l’objet du diagnostic, élargie au plus
petit changement qui l’englobe. Un objet entièrement inséré par une règle
antérieure (plage source vide) est rapporté sur la position de l’insertion. Un
diagnostic dont l’objet traverse plusieurs segments reste interdit tant qu’il
n’est pas découpé par la règle, comme aujourd’hui.

## 7. Liaison des diagnostics et des changements

Chaque modification appliquée porte l’identité du diagnostic qui la propose. Le
journal conserve ces identités dans ses pièces, comme il conserve déjà les
`ruleIds`, et les réunit quand il fusionne des pièces. Chaque changement final
connaît ainsi ses diagnostics d’origine, et `changeIds` s’en déduit en une
passe. Le coût reste linéaire dans le nombre de modifications, comme le journal
(§ « Après le journal linéaire » des
[mesures de performance](performances-v0.1.md)).

Un diagnostic dont les modifications ont été absorbées par une modification
ultérieure (le texte qu’il corrigeait a été remplacé par une autre règle) reste
relié au changement final qui les contient.

## 8. Modes

| Mode de la règle | Modifications              | Diagnostics              |
| ---------------- | -------------------------- | ------------------------ |
| `fix`            | appliquées, dans `changes` | source, avec `changeIds` |
| `lint`           | ignorées                   | source, sans `changeIds` |
| `manual-review`  | ignorées                   | source, sans `changeIds` |

Le mode de chaque règle reste celui de l’option `mode` du pipeline, ou à défaut
son mode par défaut. En mode global `lint`, aucune règle n’applique rien et le
résultat est celui d’aujourd’hui, en coordonnées sources.

Les propositions des règles qui ne s’appliquent pas (mode `lint` au sein d’une
passe de correction) ne reçoivent pas de changement source : exprimées sur un
texte déjà modifié, elles ne se composent pas toujours avec les changements
appliqués. Leur `replacement` reste indicatif (§ 11).

## 9. Conséquences pour les intégrations

- **editor SDK.** `prepareDocumentPlan` n’exécute plus qu’une passe `fix` ; le
  plan relie chaque diagnostic à ses changements, sans changer l’acceptation par
  lots complets (l’acceptation partielle reste exclue). La revue peut afficher,
  pour chaque diagnostic, les changements qu’il entraîne.
- **rehype, Sätteri, Astro.** Les diagnostics transmis sont toujours en
  coordonnées sources, y compris en mode `fix` ; le champ `coordinateSpace` de
  `AdapterDiagnostic` disparaît.
- Notes de migration dans le `CHANGELOG` du cœur et dans la feuille de route des
  intégrations, qui adoptent ces changements avec le passage au cœur `0.2`
  publié, comme l’interface des règles
  ([PR nº 50](https://github.com/orthotypography/orthotypography/pull/50)).

## 10. Étapes et vérifications

| Étape | Contenu                                                                  | Sorties                                                                    |
| ----- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 1     | Modifications portées par les diagnostics ; migration des règles livrées | identiques                                                                 |
| 2     | Emplacements toujours sources ; suppression de l’espace `runtime`        | identiques en `lint` ; en `fix`, seuls les emplacements `runtime` changent |
| 3     | `id` des changements et `changeIds` des diagnostics                      | ajout des champs                                                           |

Chaque étape vérifie les tests, les invariants (dont ceux du § 5), les
instantanés du corpus, une comparaison complète avec l’implémentation
précédente, les tests des intégrations sur une version de développement, et
`deno task bench --scaling`.

## 11. Alternatives écartées et hors champ

- **Changements indépendants par diagnostic**, calculés comme si la règle était
  seule sur le texte d’origine : ils ne reproduiraient pas la cascade des
  règles, et leur somme ne donnerait pas la sortie `fix`.
- **Changements recopiés dans chaque diagnostic** au lieu d’identifiants : un
  changement fusionné apparaîtrait dans plusieurs diagnostics, et l’intégration
  devrait dédoublonner avant d’appliquer.
- **Garder l’espace `runtime`** : il oblige toujours les intégrations à une
  seconde passe pour publier des positions.
- **Propositions sources pour les règles non appliquées** : à traiter, s’il le
  faut, après l’acceptation partielle, que les intégrations excluent
  aujourd’hui.
- **Codes de message et erreurs typées** : issue
  [nº 27](https://github.com/orthotypography/orthotypography/issues/27), qui
  suivra ce contrat.
