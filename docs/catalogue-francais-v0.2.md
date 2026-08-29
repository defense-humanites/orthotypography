# Orthotypography — Catalogue français comparé

**Version :** 0.2  
**Date d’établissement :** 29 août 2026  
**Statut :** spécification documentaire candidate  
**Périmètre :** `fr-CA/oqlf`, candidat `fr-FR/editorial`

> **Mise à jour du 29 août 2026.** Le *Lexique* a depuis été fourni et dépouillé pour le noyau microtypographique. Le statut français et les transpositions Unicode établies sont documentés dans [`depouillement-lexique-v0.3.md`](./depouillement-lexique-v0.3.md). La version 0.2 reste conservée comme état antérieur de la recherche ; ses mentions d’une source non disponible sont désormais remplacées par le relevé 0.3.

## 1. Résultat du lot

Au moment de son établissement, ce lot rendait spécifiable un premier profil canadien-français, `fr-CA/oqlf`, mais pas encore de preset français. Les lignes `fr-FR` ci-dessous constituent donc l’état provisoire antérieur au dépouillement consigné dans la version 0.3, jamais des valeurs implicites du moteur.

Décisions structurantes :

- publier les règles comme primitives atomiques, puis les composer en presets nommés ;
- distinguer les prescriptions d’une autorité des usages régionaux supposés ;
- représenter explicitement `U+0020`, `U+00A0` et `U+202F` ;
- réserver `fix` aux transformations dont le contexte est reconnu ;
- traiter le support contraint comme un preset, non comme une dégradation silencieuse ;
- exiger l’idempotence de chaque règle et du pipeline complet.

## 2. Notation Unicode

| Notation | Caractère | Point de code | Rôle |
|---|---:|---:|---|
| `<SP>` | espace | `U+0020` | espace sécable |
| `<NBSP>` | espace insécable | `U+00A0` | espace de largeur ordinaire insécable |
| `<NNBSP>` | espace fine insécable | `U+202F` | espace fine insécable |
| `«`, `»` | guillemets français | `U+00AB`, `U+00BB` | citation principale |
| `…` | points de suspension | `U+2026` | ellipse typographique |
| `–` | tiret demi-cadratin | `U+2013` | incise dans le profil OQLF étudié |
| `—` | tiret cadratin | `U+2014` | variante éditoriale possible |
| `-` | trait d’union-signe moins | `U+002D` | caractère ambigu, jamais promu aveuglément en tiret |
| `‑` | trait d’union insécable | `U+2011` | option technique, hors preset tant que non sourcée |
| `’` | apostrophe typographique | `U+2019` | règle future, non stabilisée dans ce lot |

Dans les vecteurs, la notation entre chevrons rend visibles les espaces ; elle ne fait pas partie des chaînes réelles.

## 3. Profils documentaires

| Profil | État | Garantie |
|---|---|---|
| `fr-CA/oqlf` | `CANDIDATE` | règles ci-dessous attestées par l’OQLF ; stabilisation après validation des localisateurs et tests |
| `fr-CA/oqlf-constrained` | `DRAFT` | repli sans certaines espaces insécables seulement lorsque le support ne permet pas de les produire |
| `fr-FR/editorial` | `PROVISIONAL` | candidats issus de sources institutionnelles ou internationales ; ne doit pas être exporté comme preset stable |
| `fr-FR/general` | `BLOCKED` | exige la confrontation du *Lexique* avec au moins une autre autorité française |

## 4. Matrice comparative

`fix` signifie correction automatique après reconnaissance du contexte ; `lint` signale sans imposer ; `manual-review` demande une décision humaine.

| ID atomique | `fr-CA/oqlf` | Candidat `fr-FR/editorial` | Action par défaut | État documentaire |
|---|---|---|---|---|
| `space.before.period` | aucune | aucune | `fix` | CA vérifié ; FR à recouper |
| `space.before.comma` | aucune | aucune | `fix` hors nombres | CA vérifié ; FR à recouper |
| `space.after.lowPunctuation` | `<SP>` si un segment suit | même candidat | `fix` contextuel | CA vérifié |
| `space.before.colon` | `<NBSP>` | `<NBSP>` candidat | `fix` après exclusion heures, URI, ratios | CA vérifié ; FR provisoire |
| `space.after.colon` | `<SP>` | `<SP>` candidat | `fix` contextuel | CA vérifié ; FR provisoire |
| `space.before.semicolon` | aucune ou `<NNBSP>` ; composition soignée : `<NNBSP>` | `<NNBSP>` candidat | `lint` sauf preset explicite | divergence CA vérifiée ; FR provisoire |
| `space.before.question` | aucune ou `<NNBSP>` ; composition soignée : `<NNBSP>` | `<NNBSP>` candidat | `lint` sauf preset explicite | divergence CA vérifiée ; FR provisoire |
| `space.before.exclamation` | aucune ou `<NNBSP>` ; composition soignée : `<NNBSP>` | `<NNBSP>` candidat | `lint` sauf preset explicite | divergence CA vérifiée ; FR provisoire |
| `quotes.primary.glyphs` | `«…»` | `«…»` candidat | `fix` seulement si l’appariement est certain | CA vérifié ; FR institutionnel partiel |
| `quotes.primary.innerSpacing` | `<NBSP>` après `«` et avant `»` | `<NBSP>` candidat ; variante fine à instruire | `fix` sur guillemets appariés | CA vérifié ; FR provisoire |
| `quotes.secondary.glyphs` | `“…”`, puis `‘…’` | marche à déterminer | `manual-review` | CA vérifié ; FR bloqué |
| `ellipsis.glyph` | `…` lorsque trois points ont fonction d’ellipse | même candidat | `fix` contextuel | CA vérifié ; FR provisoire |
| `ellipsis.spacing` | aucune avant ; `<SP>` après si du texte suit | même candidat | `fix` contextuel | CA vérifié ; FR provisoire |
| `space.before.percent` | `<NBSP>` | espace obligatoire ; insécabilité candidate | `fix` si valeur reconnue | CA vérifié ; FR/BIPM partiel |
| `space.numberUnit` | `<NBSP>` | espace obligatoire ; insécabilité candidate | `fix` si unité reconnue | CA et séparation SI vérifiées |
| `space.numberCurrency` | `<NBSP>`, symbole après la valeur | euro après valeur candidat ; autres monnaies selon marche | `lint` puis `fix` avec devise reconnue | CA vérifié ; FR provisoire |
| `number.decimalSeparator` | virgule | virgule candidate | `lint`, jamais conversion aveugle | CA vérifié ; FR provisoire |
| `number.groupDigits` | groupes de trois par espace ; groupement des nombres à quatre chiffres facultatif | espace fine candidate | `lint` | CA vérifié ; FR provisoire |
| `dash.parenthetical.glyph` | `–` dans la marche relevée | `–` ou `—` selon marche | `manual-review` depuis `-` | CA vérifié ; FR bloqué |
| `dash.parenthetical.spacing` | espaces autour ; insécabilité au contact de l’incise | à déterminer | `lint` | CA vérifié ; FR bloqué |
| `hyphen.spacing` | aucune espace | aucune espace candidate | `fix` seulement après classification | CA vérifié ; FR à recouper |

### 4.1 Ce que « vérifié » ne signifie pas

Une prescription vérifiée n’implique pas qu’un remplacement global soit sûr. Par exemple, l’espace avant le deux-points est attestée, mais `12:30`, `https://`, `ratio 1:2` et `::` ne sont pas des deux-points de phrase. La sûreté dépend donc à la fois de la source et de la capacité du moteur à typer le contexte.

## 5. Exceptions et contextes protégés

Avant toute transformation, le moteur ou l’intégration doit protéger :

- code, contenu préformaté, balises et attributs ;
- URL, URI, courriels, identifiants et chemins ;
- syntaxe Markdown/MDX non textuelle et entités HTML ;
- heures (`12:30`), ratios (`1:2`), ports, pseudo-éléments et doubles deux-points ;
- décimales, versions, adresses IP, dates et groupes définis par un format externe ;
- expressions mathématiques, primes, symboles et unités non reconnues ;
- émojis, émoticônes et ponctuation expressive intentionnelle ;
- segments portant une autre langue ;
- citations dont la graphie diplomatique doit être conservée ;
- poésie, art ASCII et espaces d’alignement.

Le cœur doit accepter des segments textuels déjà isolés. Les intégrations HTML, Markdown, MDX ou Astro portent la responsabilité de l’analyse syntaxique et ne doivent jamais envoyer le document brut à une série d’expressions régulières.

## 6. Ordre d’exécution candidat

1. **Segmenter et protéger** les structures non textuelles et les changements de langue.
2. **Classifier les constructions numériques** : heures, décimales, ratios, unités, monnaies et pourcentages.
3. **Reconnaître les paires** de guillemets et les fonctions possibles des tirets et points répétés.
4. **Normaliser les glyphes certains** : ellipse, guillemets appariés et autres substitutions activées.
5. **Régler les espaces internes aux guillemets**.
6. **Régler les espaces de ponctuation**, en respectant les protections numériques.
7. **Régler les espaces numériques** : unités, pourcentages, monnaies et groupements.
8. **Nettoyer localement les espaces produites**, sans toucher aux zones protégées.
9. **Exécuter une seconde passe de contrôle** : la sortie doit rester strictement identique.

Dépendances principales : `classify.numeric` doit précéder `space.before.colon` et `space.before.comma` ; `quotes.pair` doit précéder les glyphes et les espaces de guillemets ; la normalisation de l’ellipse doit précéder l’espacement après ellipse.

## 7. Vecteurs de conformité candidats

Chaque sortie doit être idempotente. Les cas `preserve` vérifient une exception ; les cas `review` ne produisent aucune correction automatique.

### 7.1 Ponctuation basse et deux-points

| Règle | Entrée | Sortie `fr-CA/oqlf` | Mode |
|---|---|---|---|
| virgule | `Bonjour<SP>, monde` | `Bonjour, monde` | `fix` |
| point | `Fin<SP>. Suite` | `Fin. Suite` | `fix` |
| décimale | `3,14` | `3,14` | `preserve` |
| deux-points | `Note<SP>: exemple` | `Note<NBSP>: exemple` | `fix` |
| deux-points absent | `Note:exemple` | `Note<NBSP>:<SP>exemple` | `fix` |
| heure | `Rendez-vous à 12:30` | `Rendez-vous à 12:30` | `preserve` |
| URL | `https://exemple.ca:443/a` | `https://exemple.ca:443/a` | `preserve` |
| ratio | `Un ratio de 1:2` | `Un ratio de 1:2` | `preserve` |

### 7.2 Point-virgule, interrogation et exclamation

| Entrée | Sortie soignée | Sortie contrainte | Mode |
|---|---|---|---|
| `Vraiment?` | `Vraiment<NNBSP>?` | `Vraiment?` | `fix` par preset |
| `Vraiment<SP>?` | `Vraiment<NNBSP>?` | `Vraiment?` | `fix` par preset |
| `Bravo!` | `Bravo<NNBSP>!` | `Bravo!` | `fix` par preset |
| `Oui; non` | `Oui<NNBSP>;<SP>non` | `Oui;<SP>non` | `fix` par preset |
| `Quoi?!` | `Quoi<NNBSP>?!` | `Quoi?!` | `lint` : séquence expressive |
| `!important` | `!important` | `!important` | `preserve` : code/CSS |

### 7.3 Guillemets

| Entrée | Sortie | Mode |
|---|---|---|
| `«texte»` | `«<NBSP>texte<NBSP>»` | `fix` |
| `«<SP>texte<SP>»` | `«<NBSP>texte<NBSP>»` | `fix` |
| `«<NBSP>texte<NBSP>»` | identique | `preserve` / idempotence |
| `Il dit "bonjour".` | `Il dit «<NBSP>bonjour<NBSP>».` | `fix` si paire certaine |
| `Il mesure 5".` | identique | `preserve` : symbole ambigu |
| `«<NBSP>Il dit “oui”.<NBSP>»` | identique | `preserve` : citation imbriquée |
| `«texte»` sur support contraint | `«texte»` | `preserve` dans le seul preset contraint |

### 7.4 Ellipse

| Entrée | Sortie | Mode |
|---|---|---|
| `Alors...` | `Alors…` | `fix` |
| `Alors<SP>...` | `Alors…` | `fix` |
| `Alors... peut-être` | `Alors…<SP>peut-être` | `fix` |
| `Alors…peut-être` | `Alors…<SP>peut-être` | `fix` |
| `version 1.2.3` | identique | `preserve` |
| `../dossier` | identique | `preserve` : chemin |
| `....` | identique | `lint` : intention ambiguë |

### 7.5 Pourcentages, unités et monnaies

| Entrée | Sortie `fr-CA/oqlf` | Mode |
|---|---|---|
| `25%` | `25<NBSP>%` | `fix` |
| `25<SP>%` | `25<NBSP>%` | `fix` |
| `%PATH%` | identique | `preserve` : identifiant |
| `12 km` | `12<NBSP>km` | `fix` si `km` reconnu |
| `12kg` | `12<NBSP>kg` | `fix` si `kg` reconnu |
| `12 kilogrammes` | identique | `preserve` : nom commun |
| `20 °C` | `20<NBSP>°C` | `fix` comme symbole composé |
| `20°` | `20°` | `preserve` : angle, règle distincte |
| `25 $` | `25<NBSP>$` | `fix` |
| `$25` | `25<NBSP>$` | `lint` puis `fix` seulement si devise/contexte certains |
| `25 CAD` | `25<NBSP>CAD` | `fix` si code monétaire reconnu |
| `prix$variable` | identique | `preserve` : identifiant/code |

### 7.6 Nombres

| Entrée | Sortie candidate | Mode |
|---|---|---|
| `12345` | `12<NBSP>345` | `fix` si prose numérique certaine |
| `12 345` | `12<NBSP>345` | `fix` |
| `1234` | identique | `preserve` : groupement facultatif |
| `12345,6789` | `12<NBSP>345,678<NBSP>9` | `lint` avant politique sur fractions longues |
| `3.14` | identique | `lint` : ne pas changer sans contexte local |
| `v1.2345` | identique | `preserve` : version/identifiant |
| `192.168.0.1` | identique | `preserve` : adresse IP |

### 7.7 Tirets et traits d’union

| Entrée | Sortie | Mode |
|---|---|---|
| `arc-en-ciel` | identique | `preserve` |
| `arc - en - ciel` | identique | `lint` : interprétation nécessaire |
| `Le texte – une incise – reprend.` | espaces insécables au contact de l’incise selon la représentation retenue | `fix` après spécification exacte |
| `Le texte - une incise - reprend.` | identique | `manual-review` |
| `pages 10-12` | identique | `lint` : plage possible |
| `--option` | identique | `preserve` : code/CLI |

## 8. Points à fermer avant implémentation

1. Acquérir et dépouiller le *Lexique* avec localisateurs de pages pour créer un profil français nommé et défendable.
2. Décider si le profil OQLF « soigné » choisit toujours `<NNBSP>` devant `;?!`, ou expose deux presets également officiels.
3. Relever la formulation exacte de l’insécabilité autour des tirets d’incise et encoder des exemples sans ambiguïté.
4. Définir une liste versionnée des unités SI, hors SI admises et codes monétaires.
5. Séparer les diagnostics numériques des corrections : un point décimal peut être une donnée importée légitime.
6. Déterminer si les groupements fractionnaires longs appartiennent à la v1.
7. Concevoir le format machine des vecteurs seulement après validation de ces décisions ; le présent Markdown reste la source documentaire humaine.

## 9. Registre des sources de ce lot

Toutes les pages Web ont été consultées le 29 août 2026.

| ID | Source et localisateur |
|---|---|
| `SRC-OQLF-SPACING` | OQLF, « Espacement avant et après les signes de ponctuation et les symboles », tableau complet : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/22039/la-typographie/espacement/espacement-avant-et-apres-les-signes-de-ponctuation-et-les-symboles) |
| `SRC-OQLF-SPACE-TYPES` | OQLF, « Types d’espacement », rubriques sur l’espace insécable et l’espace fine insécable : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/24565/la-typographie/espacement/types-despacement) |
| `SRC-OQLF-NBSP-CONTEXTS` | OQLF, « Contextes exigeant une espace insécable » : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/24566/la-typographie/espacement/contextes-exigeant-une-espace-insecable) |
| `SRC-OQLF-QUOTES` | OQLF, « Généralités sur les guillemets », sections sur les guillemets français et les citations imbriquées : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/23363/la-ponctuation/guillemets/generalites-sur-les-guillemets) |
| `SRC-OQLF-COLON` | OQLF, « Emplois courants du deux-points » : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/23325/la-ponctuation/deux-points/emplois-courants-du-deux-points) |
| `SRC-OQLF-ELLIPSIS` | OQLF, « Généralités sur les points de suspension » : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/23395/la-ponctuation/points-de-suspension/generalites-sur-les-points-de-suspension) |
| `SRC-OQLF-WEB` | OQLF, « Typographie sur le Web » : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/25025/banque-de-depannage-linguistique/la-redaction-et-la-communication/redaction-pour-le-web/typographie-sur-le-web) |
| `SRC-OQLF-SOCIAL` | OQLF, « Typographie et ponctuation dans les réseaux sociaux », contraintes d’espacement : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/25377/la-redaction-et-la-communication/redaction-dans-les-reseaux-sociaux/typographie-et-ponctuation) |
| `SRC-OQLF-DASH` | OQLF, « Le tiret dans la mise en valeur d’un passage » : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/23378/la-ponctuation/tiret/le-tiret-dans-la-mise-en-valeur-dun-passage) |
| `SRC-OQLF-HYPHEN` | OQLF, « Généralités sur le trait d’union » : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/23361/la-ponctuation/trait-dunion/generalites-sur-le-trait-dunion) |
| `SRC-OQLF-NUMBERS` | OQLF, « Espacements dans les nombres » : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/25447/la-typographie/nombres/espacements-dans-les-nombres) |
| `SRC-OQLF-DECIMALS` | OQLF, « Emploi du signe décimal et indication de la division dans les unités de mesure » : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/21191/la-typographie/nombres/emploi-du-signe-decimal-et-indication-de-la-division-dans-les-unites-de-mesure) |
| `SRC-OQLF-UNITS` | OQLF, « Écriture des symboles d’unités de mesure » : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/21401/les-abreviations-et-les-symboles/les-symboles/ecriture-des-symboles-dunites-de-mesure) |
| `SRC-OQLF-PERCENT` | OQLF, fiche « Symbole pour cent » : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/fiche-gdt/fiche/8874968/symbole-pour-cent) |
| `SRC-OQLF-CURRENCY` | OQLF, « Écriture des symboles d’unités monétaires » : [Vitrine linguistique](https://vitrinelinguistique.oqlf.gouv.qc.ca/21400/les-abreviations-et-les-symboles/les-symboles/ecriture-des-symboles-dunites-monetaires) |
| `SRC-CANADA-EURO` | Gouvernement du Canada, Clés de la rédaction, « euro » : [Nos langues](https://our-languages.canada.ca/fr/cles-de-la-redaction/euro) |
| `SRC-CANADA-DOLLAR` | Ministère de la Justice du Canada, recommandation sur le symbole du dollar : [Justice Canada](https://justice.canada.ca/fra/pr-rp/sjc-csj/redact-legis/juril/no66.html) |
| `SRC-BIPM-SI` | BIPM, *Le Système international d’unités — résumé*, règle d’espace entre nombre et unité : [PDF](https://www.bipm.org/documents/20126/41483022/SI-Brochure-9-concise-FR.pdf/84feb619-c5be-f8e4-ee12-ce82a1584702) |
| `SRC-FR-GOV-QUOTES` | cartes.gouv.fr, « Bonnes pratiques rédactionnelles », rubrique sur les guillemets et espaces insécables : [Guide](https://cartes.gouv.fr/aide/fr/guides-producteur/creer-des-pages-de-documentation/bonnes-pratiques-redactionnelles/) |
| `SRC-EU-STYLE` | Union européenne, *Code de rédaction interinstitutionnel*, chapitres 10.1.4, 10.1.7, 10.1.8 et 10.1.9 à dépouiller : [Code](https://style-guide.europa.eu/fr/) |
| `SRC-IN-LEXIQUE` | *Lexique des règles typographiques en usage à l’Imprimerie nationale* : source nécessaire, non encore consultée intégralement |

## 10. Décision recommandée

La première implémentation ne devrait pas s’intituler `fr-FR` par défaut. Elle devrait commencer par les primitives communes et par un preset expérimental `fr-CA/oqlf`, le mieux étayé. Le profil français ne deviendra implémentable qu’une fois nommé d’après une autorité ou consolidé par plusieurs sources. Cette discipline évite que la première marche éditoriale codée se transforme accidentellement en « français universel ».
