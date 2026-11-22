# Gaby

App de révision ludique du CE1 au CM2 (Vite + Svelte 5, site statique sans serveur). Tout en français.

## Le contenu

Toutes les questions, les mots, les histoires et les réglages des niveaux sont dans `contenu/`, en fichiers texte
(« fiches »). Le format et les règles sont dans `contenu/LISEZMOI.md` : le lire avant toute modification du contenu.

- Corriger ou enrichir le contenu = modifier `contenu/`, jamais le code.
- Toujours finir par `npm run contenu` : la vérification doit dire « aucun problème ».
- Après un changement dans `contenu/dictee.md` ou `contenu/anglais.md` : `npm run voix` (enregistre les sons qui manquent ; voix réglées dans `src/lib/voix.js`).
- Les voix (`public/dictee/`, `public/anglais/`, `src/lib/voix.js`, `scripts/voix.mjs`) ne se changent que sur demande.

## Le code

- `src/contenu/` : lecture et vérification des fiches (sans dépendance), transformées en module `virtual:contenu` par `vite.config.js`.
- `src/drapeaux/` : les drapeaux du monde en SVG (`fr.svg`, nettoyés : viewBox, sans dimensions). Dans les fiches on écrit l’emoji (`Drapeau : 🇫🇷`),
  la vérification le traduit en code (`fr`) ; seuls les drapeaux utilisés partent dans l’app (`C.svgDrapeaux.fr`).
- `src/questions/` : un fichier par atelier, qui ne fait que fabriquer des questions à partir du contenu.
- `src/lib/progression.js` : niveaux (5 par atelier, puis « niveau max 🏆 »), tirelire (bonne réponse = gain, jamais de perte, mode chrono = gain doublé).
  Deuxième chance (2026-11-21) : à la première erreur on réessaie ; juste au second essai = demi-gain, niveau inchangé. Pas en chrono, ni à deux choix, ni en lecture.
- Pas d’animation, pas de cadeau à gagner ni d’objectif (retirés le 2026-11-21) : le seul retour est la tirelire en chiffres, en haut de `Jeu.svelte`.
  La toucher ouvre `Tirelire.svelte` : derniers mouvements, et « Encaisser » (tout ou partie, validé par le code parent).
  Dans `Parent.svelte`, les parents ajoutent ou retirent de l’argent, avec une raison. Le mot à l’écran est toujours « tirelire ».
- Les ateliers : `Tiroir.svelte`. Tablette en paysage : la liste est toujours affichée à gauche de l’exercice (`fixe`) ;
  ailleurs (portrait, téléphone), elle s’ouvre en tiroir par le bouton en haut à droite.
- Les sons enregistrés sont appelés avec `?v=<empreinte>` (calculée dans `vite.config.js`) : un son réenregistré change toujours d’adresse,
  sinon les appareils rejouent l’ancien gardé en mémoire. Changer le nom `CACHE` de `public/sw.js` vide la mémoire hors ligne de tous les appareils.

## Les joueurs

- Pas de compte ni de serveur (depuis le 2026-11-22) : tout est dans le navigateur (`src/lib/etat.svelte.js`), rien ne quitte l’appareil.
  Plusieurs joueurs par appareil (écran « Qui joue ? » : `Entree.svelte`), réglages des parents communs à l’appareil.
  La copie de sauvegarde (fichier JSON, dans les réglages des parents) sert à changer d’appareil ou à se protéger d’un effacement.
  Réglages en deux parties : « Pour toi » (sans code) et « Pour les parents 🔒 » (code parent, avec « Code oublié ? » : un calcul d’adulte, et une alerte pour les parents).
- Mentions légales et confidentialité : `Mentions.svelte`, en bas des réglages, remplies par `.env` (l’e-mail de contact est codé dans le site, révélé à la demande).
- La version avec comptes et synchronisation (api.php) est gardée dans la branche git `comptes`.
- Aucun appel à un autre site : polices dans `public/polices/`, avatars dans `public/avatars/`.

## Vérifier et mettre en ligne

- `npm test` : vérification du contenu, puis des centaines de questions fabriquées dans chaque atelier à chaque niveau.
- Tester dans le moteur de Safari (Playwright WebKit), pas seulement Chromium : c’est celui de l’iPhone et de l’iPad (Chromium de test ne décode pas l’AAC).
- `npm run dev` pour travailler, `npm run deploy` pour mettre en ligne (adresse du serveur dans `.env`, modèle dans `.env.exemple`).
- Dépôt public : https://github.com/webc-app/gaby (branches `master` et `comptes`). Committer et pousser seulement sur demande.
- Rien de personnel dans le dépôt : adresse du serveur, éditeur, contact et hébergeur des mentions légales sont dans `.env` (hors git).
