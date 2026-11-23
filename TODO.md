# Pistes d'amélioration

Ce qui reste à améliorer, du plus important au moins important. Une idée ou un problème qui n'est pas ici :
ouvrez un ticket (voir [CONTRIBUTING.md](CONTRIBUTING.md)).

## Les voix

Les mots de la dictée et de l'anglais sont dits par une synthèse vocale libre ([Piper](https://github.com/OHF-Voice/piper1-gpl)).
Le résultat est correct dans l'ensemble, mais certains mots sont difficiles à comprendre : en dictée, un enfant ne
peut pas écrire un mot qu'il n'a pas bien entendu.

- **Réécouter tous les mots un par un** et noter ceux qui se comprennent mal (exemple : « lama »).
- Pour chacun : essayer une autre voix, une autre vitesse, ou l'écrire autrement pour la synthèse sans changer le mot
  affiché. Sinon, retirer le mot de la dictée.
- Comparer d'autres voix libres, françaises et anglaises, sur une même liste de mots difficiles.
- Prévoir un moyen simple de signaler un mot mal prononcé depuis l'app ou par un ticket.

## Le niveau des exercices

Chaque atelier a 5 niveaux, du CE1 au CM2. Certains exercices sont sans doute mal placés : trop faciles ou trop
difficiles pour leur niveau, ou plus difficiles que ceux du niveau suivant.

- Relire chaque atelier niveau par niveau et le comparer aux programmes officiels de l'Éducation nationale
  (cycles 2 et 3).
- Regarder sur quelles questions les enfants se trompent le plus (la progression est déjà enregistrée sur l'appareil,
  par question) pour repérer celles qui sont mal placées.
- Équilibrer le nombre de questions par niveau : certains en ont beaucoup moins que d'autres (les temps de
  conjugaison n'ont que 3 verbes au niveau 3, les capitales et les drapeaux 8 à 10 pays aux niveaux 1 à 3).

## Le contenu

- **Sourcer les chiffres de Culture** (tailles, distances, durées) : noter la source de chacun dans la fiche, en
  commentaire. Une partie seulement a été vérifiée.
- **Mauvaises réponses** : chercher partout le piège qu'un enfant ferait vraiment, comme les grandes villes qui ne
  sont pas des capitales (champ « Piège » des capitales).
- **Conjugaison** : quelques mauvaises réponses fabriquées sont peu crédibles (« a mangait ») ; ajouter des « Pièges »
  propres aux verbes. Le passé simple n'existe pas encore.
- **Lecture** : 29 textes. En ajouter, surtout aux niveaux 1 et 4 ; uniquement des classiques du domaine public.
- **Anglais** : plus de dialogues aux niveaux 4 et 5.

## L'app

- **Clavier de la dictée** : l'essayer sur de vrais iPhone, iPad et téléphones Android (il a été testé dans un
  simulateur).
- **Accessibilité** : vérifier la lecture d'écran (VoiceOver), les contrastes et la taille des boutons.
- **Captures d'écran** du README : les refaire quand l'app change.
