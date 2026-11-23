# Contribuer à Gaby

Merci de vouloir améliorer Gaby ! Le plus utile, c'est de signaler ce qui ne va pas dans une question : une erreur,
une réponse discutable, un exercice trop facile ou trop difficile pour son niveau.

## Signaler une erreur dans une question

Ouvrez un ticket avec le modèle « Erreur dans une question » : l'atelier, le niveau, la question telle qu'elle
s'affiche, et ce qui ne va pas. Pour un fait (une date, un nombre, une distance), indiquez si possible une source.

## Proposer une modification du contenu

Toutes les questions sont dans [`contenu/`](contenu/), en fichiers texte, sans toucher au code.
Le format est expliqué dans [`contenu/LISEZMOI.md`](contenu/LISEZMOI.md).

Les règles qui comptent le plus (détaillées dans le LISEZMOI, section « Le ton ») :

- **Seulement des faits vérifiables** : une seule bonne réponse, que personne ne peut discuter.
- **Une seule lecture possible**, avec le moins de mots possible : « il en trouve 3 autres », pas « il en trouve 3 ».
- **Gaby est neutre** : pas d'éducation civique, de religion, de politique, de savoir-vivre ni de jugement de valeur.
- **Des mauvaises réponses qui trompent vraiment** : Rio de Janeiro pour la capitale du Brésil, plutôt qu'une capitale
  au hasard.
- Pour des enfants de 7 à 11 ans : des phrases courtes, des mots qu'ils connaissent.

Avant de proposer la modification :

```sh
npm install
npm test        # doit dire « aucun problème » et « toutes les questions sont jouables »
```

Après un changement dans `contenu/dictee.md` ou `contenu/anglais.md`, `npm run voix` enregistre les sons qui manquent
(sur un Mac). Si vous ne pouvez pas le lancer, dites-le dans la proposition : les sons seront ajoutés ensuite.

## Le code

C'est une app [Svelte 5](https://svelte.dev) construite avec [Vite](https://vite.dev), sans serveur ni dépendance
externe à l'exécution. Le [README](README.md) explique où est quoi. Quelques principes :

- rien ne quitte l'appareil de l'enfant : pas de compte, pas de statistiques, aucun appel à un autre site ;
- pas d'animation qui retient l'enfant à l'écran : l'exercice d'abord ;
- tout le texte est en français ;
- tester aussi dans Safari (iPhone et iPad), pas seulement dans Chrome.

Les pistes d'amélioration en cours sont dans [TODO.md](TODO.md).

## Licences

En proposant une modification, vous acceptez qu'elle soit publiée sous la licence du dépôt : MIT pour le code,
CC BY 4.0 pour le contenu de `contenu/`.
