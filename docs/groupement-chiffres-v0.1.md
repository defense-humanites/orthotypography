# Groupement des chiffres — spécification v0.1

**Date :** 12 septembre 2026  
**Règle :** `number.groupDigits`  
**Autorité :** *Lexique des règles typographiques en usage à l’Imprimerie
nationale*, édition 2002  
**Statut :** prescription historique vérifiée ; transposition Unicode décidée ;
premier lint volontairement partiel

## 1. Prescription attestée et transposition moderne

Le nota a de l’entrée « Nombres en chiffres arabes » prescrit, pour les nombres
qui expriment une quantité, des tranches de trois chiffres séparées par une
espace insécable et non dilatable. Les groupes se construisent depuis la virgule
vers la gauche dans la partie entière et vers la droite dans la partie décimale.
L’exemple `74 835,140 71` atteste les deux directions. Les exemples `5 000` et
`6 000` montrent que la prescription concerne déjà les quantités à quatre
chiffres.

Le nota b distingue explicitement les nombres qui ont une fonction de
numérotage ou une valeur ordinale : millésimes, matricules, folios et catégories
analogues restent composés de chiffres collés. L’exemple « page 1247 de
l’édition de 1961 » confirme que la seule longueur du token ne permet pas de
décider s’il s’agit d’une quantité.

Ces formulations appartiennent au vocabulaire de la composition traditionnelle
et ne nomment aucun point de code. Le choix Unicode suivant est donc une
décision du projet, pas une prescription attribuée au *Lexique* :

- `U+202F NARROW NO-BREAK SPACE` est la sortie canonique candidate. Elle rend
  directement l’insécabilité et fournit une espace étroite dont la largeur ne
  suit pas celle de l’espace de mots ; l’édition EPUB examinée encode également
  ainsi les séparateurs de ses exemples, ce qui constitue un indice éditorial
  moderne et non une preuve sur la composition imprimée d’origine ;
- `U+00A0 NO-BREAK SPACE` respecte l’insécabilité, mais sa largeur de mot et son
  comportement de justification dépendent davantage du moteur de rendu. La
  v0.1 l’accepte en entrée comme groupement fonctionnel et ne demande pas sa
  conversion ;
- `U+0020 SPACE` et la tabulation sont sécables et ne satisfont pas la fonction
  attestée. Ils peuvent être signalés dans le périmètre exécutable certain.

Cette décision permet de cataloguer la règle avec `U+202F` comme sortie
canonique sans prétendre que le texte historique désigne une « espace fine ».
Une future politique de sortie contrainte pourra choisir une représentation
différente sans modifier la prescription documentaire.

## 2. Domaine numérique

La règle documentaire s’applique aux chiffres ASCII qui expriment une quantité,
selon les conventions suivantes :

1. une partie entière de quatre chiffres ou plus est groupée par tranches de
   trois depuis la virgule ou, en son absence, depuis la fin du nombre ;
2. une partie décimale de quatre chiffres ou plus est groupée par tranches de
   trois depuis la virgule ; le dernier groupe peut donc contenir un ou deux
   chiffres, comme `140 71` dans la source ;
3. une partie de trois chiffres ou moins reste compacte ;
4. le signe éventuel et la virgule ne font pas partie des groupes et ne sont pas
   modifiés par cette règle ;
5. `number.groupDigits` ne décide ni ne convertit le séparateur décimal. Un
   point décimal, une notation scientifique, une fraction, un ratio ou une base
   autre que dix restent hors de cette première spécification exécutable.

Exemples de formes canoniques candidates : `1 234`, `74 835`,
`2 782 320`, `74 835,140 71`. `123`, `12,345` et `0,123` ne demandent aucun
groupement supplémentaire.

## 3. Exclusions sémantiques et techniques

Le groupement ne doit pas être déduit de la seule présence d’au moins quatre
chiffres. Sont exclus sans information structurelle affirmant une quantité :

- années, millésimes, dates et heures ;
- pages, folios, paragraphes, articles, notes et autres numérotations ;
- matricules, numéros de série, de dossier, de téléphone, de compte ou de
  billet ;
- codes postaux, codes légaux ou administratifs, ISBN, ISSN et autres codes ;
- versions, adresses IPv4 ou IPv6, ports, URI, chemins et noms techniques ;
- identifiants mêlant lettres, chiffres ou séparateurs, références, clés et
  valeurs structurées ;
- fractions, ratios, coordonnées, plages, notations scientifiques et données
  régies par un format externe.

Les intégrations doivent continuer à marquer comme protégés le code, les liens,
les champs structurés et tout contexte qu’elles connaissent mieux que le cœur.
Le cœur ne dépend d’aucun parseur Markdown ou HTML et n’interprète aucune API
d’éditeur.

## 4. Périmètre exécutable v0.1

Le premier comportement `DIGIT_GROUPING_RULE` est uniquement diagnostique,
n’effectue aucune édition et n’appartient à aucun preset. Il dépend de
`classify.numeric-constructs` et examine seulement les quantités que le
classificateur reconnaît déjà comme :

- mesure suivie d’un symbole d’unité enregistré ;
- pourcentage ou pour mille ;
- montant associé à une notation monétaire enregistrée.

Dans ce sous-ensemble, il signale une partie entière ou décimale de quatre
chiffres ou plus qui est compacte ou groupée avec `U+0020` ou une tabulation.
Il accepte `U+202F` et `U+00A0`, ne propose pas de remplacement et ne transforme
jamais le texte, même si le pipeline est invoqué en mode `fix`.

Les constructions reconnues peuvent traverser des segments textuels contigus
et non protégés. Le diagnostic conserve les coordonnées UTF-16 de chaque
segment ; les portions situées dans d’autres segments sont exposées comme
emplacements associés. Une limite protégée interrompt la reconnaissance.

## 5. Limites et suites

Cette tranche ne couvre pas les quantités autonomes telles que
`2782320 habitants`, car leur distinction d’avec un identifiant ou un
numérotage exige plus de contexte. Elle ne normalise pas `U+00A0` vers `U+202F`,
ne répare pas un groupement irrégulier non reconnu, ne traite pas les signes, ne
choisit pas le séparateur décimal et n’ajoute pas la règle au preset IN 2002.

Avant tout mode `fix`, il faudra stabiliser une représentation des corrections
inter-segments, décider si `U+00A0` doit rester une entrée conforme ou seulement
tolérée, étendre prudemment la reconnaissance des quantités autonomes et
documenter les sorties Unicode, HTML et texte contraint.
