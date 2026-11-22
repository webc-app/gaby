# Le contenu de l’app

Tout ce que l’app demande à l’enfant est ici : un fichier par atelier, et une histoire par fichier dans `lecture/`.
Le code ne contient aucune question : modifier ces fichiers suffit.

Après chaque modification, lancer la vérification :

```
npm run contenu
```

Elle liste chaque problème avec le fichier et la ligne. Tant qu’il en reste un, l’app refuse de se construire :
un contenu cassé ne peut pas partir en ligne.

## Les niveaux

Chaque atelier a 5 niveaux, avec le même sens partout :

| Niveau | Sens |
|---|---|
| 1 | Découverte |
| 2 | Facile |
| 3 | Moyen |
| 4 | Difficile |
| 5 | Expert |

Après le niveau 5 vient le **niveau max 🏆** : toutes les fiches de l’atelier sont mélangées, sans bonus de niveau.
L’app pose surtout les fiches du niveau en cours, avec un peu de révision des niveaux d’avant.

On peut mettre plus ou moins de niveaux dans un atelier (9 au plus), mais ils doivent se suivre : 1, 2, 3…

## Le format des fichiers

```
# Synonymes                     ← le nom de l’atelier (affiché dans l’app)
Trouver le mot qui a le même sens.   ← sa description (affichée dans la liste des ateliers)

## Niveau 1 · Adjectifs courants     ← un niveau ; le texte après « · » est un repère pour nous

Phrase : Le chevalier était très *courageux*.
Bonne : brave
Mauvaise : peureux
Mauvaise : fatigué
Mauvaise : bavard
                                ← une ligne vide termine la fiche
Phrase : Ce gâteau est *délicieux*.
…
```

- Une **fiche** = quelques lignes « Nom : valeur », puis une ligne vide.
- **Bonne** : la bonne réponse. **Mauvaise** : une ligne par mauvaise réponse (3 en général).
- **Explication** (facultative) : affichée quand l’enfant se trompe.
- `### Un titre` crée un **groupe** (un thème, une famille de mots).
- Une ligne qui commence par `>` est une **note** pour nous : l’app l’ignore.
- Les majuscules et les accents des noms de champs n’ont pas d’importance (`Français` ou `francais`).

## Atelier par atelier

**dictee.md** : un mot (ou un petit groupe de mots) par ligne, précédé de `- `.
Éviter les mots qui se prononcent comme un autre (vert / verre) : l’enfant ne peut pas deviner lequel.

**synonymes.md** : `Phrase` (le mot à remplacer entre étoiles : `*courageux*`), `Bonne`, 3 `Mauvaise`, `Explication` facultative.

**homophones.md** : chaque groupe (`### a ou à`) commence par ses mots, un par fiche (`Mot`, `Astuce`),
puis les phrases (`Phrase` avec le trou `___`, `Bonne`). Les choix proposés sont les mots du groupe.

**capitales.md** : `Pays`, `Drapeau` (l’emoji, voir plus bas), `Capitale`. L’enfant choisit parmi quatre réponses ; les mauvaises viennent d’abord des pays du même niveau.
À partir du niveau 5, l’app demande aussi parfois le pays d’une capitale.

**drapeaux.md** : `Pays`, `Drapeau` (l’emoji, voir plus bas), 0 à 3 `Ressemble` (un autre pays du fichier dont le drapeau
ressemble : Roumanie et Tchad…). Moitié des questions : le drapeau est affiché, on trouve le pays parmi quatre ;
l’autre moitié : le pays est écrit, on trouve son drapeau parmi quatre. Les pièges : d’abord les « Ressemble »,
puis les pays du même niveau.

**culture.md** : rangé par thème (`## Échecs`), puis par niveau (`### Niveau 2`).
`Question`, `Bonne`, 0 à 3 `Mauvaise`, `Explication` facultative, et éventuellement :
- `Image : pièce cavalier` (pion, tour, fou, cavalier, dame, roi),
  `Image : planète saturne` (soleil, mercure, venus, terre, lune, mars, jupiter, saturne, uranus, neptune),
  `Image : panneau stop` : un des panneaux officiels de `src/panneaux/` (le nom du fichier, sans « .svg » ;
  la liste avec leur code officiel est dans `src/panneaux/SOURCE.md`), ou `feu-rouge`, `feu-vert` ;
- `Drapeau : 🇫🇷` : la question est alors « De quel pays est ce drapeau ? » (pas besoin de l’écrire).
  L’app n’affiche pas l’emoji mais le dessin du drapeau (`src/drapeaux/fr.svg`) : presque tous les pays du monde y sont,
  et on peut aussi écrire le code du pays (`Drapeau : fr`, `Drapeau : gb-sct` pour l’Écosse).

Sans `Mauvaise`, l’app prend les bonnes réponses des autres fiches du thème qui ont **la même question**
(toutes les « Quelle est cette pièce ? », tous les drapeaux du même niveau…). Il en faut au moins 3 en tout.
- `Image : fichier lion.jpg` : un fichier image à soi (voir « Les images » plus bas).

**echecs.md** et **route.md** (Code de la route) : les mêmes fiches que la culture (`Question`, `Image`, `Bonne`,
0 à 3 `Mauvaise`, `Explication`), rangées directement par niveau (`## Niveau 2`).

**conjugaison.md** (Les temps, pour l’instant l’imparfait) : deux sortes de fiches.
- Un verbe : `Verbe` (l’infinitif), puis ses six formes `Je`, `Tu`, `Il`, `Nous`, `Vous`, `Ils` (sans le pronom :
  `Je : jouais`). `Personnes : je, tu, il` limite les personnes demandées.
  Les choix vérifient surtout l’orthographe : la bonne forme, une forme qui se prononce pareil (faisait) et des fautes.
  `Pièges : fesais, ferais` (facultatif) : des fautes propres au verbe, écrites à la personne « je » (elles finissent par -ais) ;
  l’app les décline aux autres personnes et ajoute seule des terminaisons fausses (faisai, faisé…).
- Une phrase : `Phrase` (avec le trou `___`), `Verbe` (un verbe qui a sa fiche dans le fichier) et `Bonne`.

**anglais.md** : deux sortes de fiches.
- Un mot : `Image` (un emoji, un nombre, un mot français, ou `fichier lion.jpg`), `Anglais`, `Français` facultatif.
  `Question` facultative : ce qu’il faut nommer quand le dessin peut tromper (`Question : Quelle est cette couleur, en anglais ?`
  pour 🩷, qui est un cœur mais veut dire « rose ») ; sinon l’app demande « En anglais ? ».
  Les mots sont rangés en groupes (`### Animaux`) d’au moins 4 : les mauvaises réponses viennent du même groupe.
- Un dialogue (sous `### Dialogues`) : `Question` (en anglais), `Bonne`, 3 `Mauvaise`, `Sens` (la question en français).

Chaque texte anglais a un fichier son (voir « Les voix » plus bas).

**lecture/*.md** : une histoire par fichier.

```
# Le titre
Niveau : 2
Auteur : Jean de La Fontaine
Poésie : oui

Le texte, en paragraphes séparés par une ligne vide.

## Questions

Question : …
Bonne : …
Mauvaise : …
Mauvaise : …
Mauvaise : …
```

`Auteur` (facultatif) est affiché sous le titre : « Jean de La Fontaine », « D’après Charles Perrault », « Conte traditionnel ».
`Poésie : oui` (facultatif) : chaque ligne du fichier est un vers, gardé à la ligne ; une ligne vide sépare les strophes.
Les textes sont des classiques (fables en texte original, contes racontés en 120 à 180 mots), pas des histoires inventées.
La liste suit le niveau, puis le titre. Pas de chrono en lecture : seule la compréhension compte.

Exactement 3 questions. L’histoire ne rapporte que si les 3 réponses sont justes, une seule fois.

**Les ateliers calculés** (l’app fabrique les questions, on règle seulement chaque niveau) :
- **tables.md** : `Tables : 2, 5, 10` (ou `2 à 9`), `Réponses proches : oui` (des mauvaises réponses très proches),
  `À l’envers : 30 %` (part de questions « 6 × ? = 42 »).
- **divisions.md** : `Exercice` (partager, paquets, famille ou calcul), `Diviseurs : 2, 3`, `Résultat max : 5`.
  Plusieurs fiches dans un niveau : l’app alterne entre elles.
  Sous `## Objets`, les dessins des exercices « partager » et « paquets » : `Objet : 🍎`, `Pour : 🐴`, `Nom : chevaux`.
- **heure.md** : `Heures : 7 à 11` (de 0 à 23), `Minutes : 0, 30` ou `0 à 55 de 5 en 5`.
- **calcul.md** : `Exercices :` une liste parmi petites additions, petites soustractions (jusqu’à 20), compléments à 10,
  avec des dizaines (34 + 20, 60 − 30), doubles et moitiés, additions à retenue, soustractions à retenue (deux chiffres),
  compléments à 100 en dizaines, compléments à 100, suites (3 + 6 + 7 + 4), ajouter 9 ou 11, × 10, × 1000,
  compléments à 1000, tables de 2 à 5, tables. L’enfant choisit la réponse parmi quatre.

## Les voix

Tout ce que l’app dit à voix haute est enregistré à l’avance, une fois pour toutes : la même voix sur iPhone, iPad,
Android et ordinateur, même hors ligne. La dictée est dite par Piper, une voix neuronale gratuite qui tourne sur le Mac (voix « siwis ») ; l’anglais par la voix Samantha du Mac. L’app dit chaque mot de dictée deux fois.

Après avoir ajouté ou changé un mot de dictée ou de l’anglais :

```
npm run voix
```

Elle enregistre seulement les sons qui manquent (il faut un Mac). `npm run contenu` signale les sons manquants.
`npm run voix -- --essai` enregistre 7 mots dans un dossier à part, pour écouter une voix avant de tout refaire.
Pour changer de voix : `src/lib/voix.js`, puis `npm run voix -- --tout`.

## Les images

Trois sortes d’images, à mélanger librement :

| Dans la fiche | Ce que ça affiche |
|---|---|
| `Image : 🐶` (anglais) ou `Drapeau : 🇫🇷` | un emoji (sur Mac : Ctrl + Cmd + Espace pour les choisir) ; pour un drapeau, le code du pays (`fr`) marche aussi |
| `Image : panneau stop` (route) | un panneau de `src/panneaux/` (liste dans « culture.md » plus haut) |
| `Image : fichier lion.jpg` | un fichier à soi, déposé dans `contenu/images/` |

Pour un fichier à soi :
- formats : `.jpg`, `.png`, `.svg` ou `.webp` ;
- 300 Ko au plus (la vérification le contrôle) : une image carrée de 400 × 400 pixels suffit largement ;
- un nom simple, sans espace ni accent : `lion.jpg`, `tour-eiffel.png` ;
- pas de photo d’un enfant ni d’une personne réelle reconnaissable.

Les images sont copiées dans l’app au moment du build ; seules celles utilisées dans une fiche sont gardées.

## Le ton

- Pour des enfants du CE1 au CM2 : des phrases courtes, des mots qu’ils connaissent.
- Des mauvaises réponses plausibles, mais jamais un piège injuste ni deux réponses défendables.
- Des réponses courtes : 45 caractères au plus (la vérification le contrôle), idéalement bien moins.
- Pas de prénom réel, pas de marque, rien qui fasse peur aux plus jeunes.
- Le français avec ses accents, ses apostrophes typographiques (’) et les espaces avant « : ; ! ? ».
