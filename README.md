# Gaby

[![Vérification](https://github.com/webc-app/gaby/actions/workflows/verifier.yml/badge.svg)](https://github.com/webc-app/gaby/actions/workflows/verifier.yml)

App de révision ludique du CE1 au CM2 (7 à 11 ans). Tout est en français.

- **Maths** : tables, divisions, calcul mental, nombres, mesures et géométrie, problèmes, l'heure.
- **Français** : dictée (lue à voix haute), grammaire, vocabulaire, synonymes, homophones, et la conjugaison
  (présent, futur, imparfait, passé composé).
- **Anglais** : vocabulaire et petites phrases, lus par une voix anglaise.
- **Découvertes** : capitales, drapeaux, culture générale, code de la route, échecs, et des fables et contes à lire.

Chaque bonne réponse remplit une **tirelire** virtuelle. Une erreur ne coûte jamais rien. L'enfant encaisse quand il
veut, avec l'accord d'un parent : chaque famille fixe ses propres règles, et les parents peuvent ajouter ou retirer de
l'argent. Les familles qui préfèrent peuvent compter en points plutôt qu'en euros (réglage des parents).
Chaque atelier a 5 niveaux qui se règlent tout seuls, puis un niveau max où tout est mélangé.

## Sans compte, sans serveur

Gaby ne demande ni nom, ni e-mail, ni photo : un pseudo et un avatar dessiné suffisent. Tout reste dans le navigateur
de l'appareil, et rien n'est envoyé ailleurs. L'app ne contacte aucun autre site : pas de publicité, pas de
statistiques, pas de cookie.

- **Plusieurs enfants** peuvent jouer sur le même appareil : l'app demande « Qui joue ? » à l'ouverture.
- **La copie de sauvegarde**, dans les réglages des parents, met la progression dans un fichier : pour changer
  d'appareil, ou si le navigateur efface ses données.
- **Ajouter Gaby à l'écran d'accueil** (sur iPad : Partager › Sur l'écran d'accueil) : l'app s'ouvre en plein écran,
  fonctionne hors ligne, et Safari n'efface pas ses données.

## Travailler sur l'app

Il faut [Node.js](https://nodejs.org) 22 ou plus.

```sh
npm install
npm run dev       # l'app sur http://localhost:5173, rechargée à chaque modification
npm test          # vérifie le contenu, puis des centaines de questions dans chaque atelier, à chaque niveau
npm run build     # le site prêt à mettre en ligne, dans dist/
```

C'est une app [Svelte 5](https://svelte.dev) construite avec [Vite](https://vite.dev). Le résultat (`dist/`) est un
site statique : n'importe quel hébergement convient (GitHub Pages, Netlify, un hébergement mutualisé…).
Sur Apache, le fichier `.htaccess` fourni force le HTTPS et ajoute les en-têtes de sécurité.

### Le contenu

Toutes les questions, les mots, les histoires et les niveaux sont dans [`contenu/`](contenu/), en fichiers texte
faciles à lire et à modifier, sans toucher au code. Le format est expliqué dans
[`contenu/LISEZMOI.md`](contenu/LISEZMOI.md). Après une modification : `npm run contenu` vérifie tout et indique
chaque problème avec son fichier et sa ligne.

### Les voix

Les mots de la dictée et de l'anglais sont enregistrés à l'avance (dans `public/dictee/` et `public/anglais/`), pour
avoir la même voix partout, même hors ligne. Après un changement dans `contenu/dictee.md` ou `contenu/anglais.md` :

```sh
npm run voix      # enregistre les sons qui manquent (macOS, avec Python 3)
```

Le script installe [Piper](https://github.com/OHF-Voice/piper1-gpl) et ses voix dans `.voix/` au premier usage.
Les voix sont réglées dans `src/lib/voix.js`.

### Mettre en ligne

`npm run deploy` construit l'app et l'envoie par `rsync` sur un serveur. L'adresse du serveur se règle dans un
fichier `.env` (jamais dans git) : recopier `.env.exemple`.

Le même fichier remplit les **mentions légales** affichées en bas des réglages (éditeur, contact, hébergeur, lien vers
le code source) : chacun y met les siennes. L'adresse e-mail de contact n'apparaît jamais en clair dans le site.

### Où est quoi

```
contenu/            le contenu pédagogique (fiches texte)
src/questions/      un fichier par atelier, qui fabrique les questions à partir du contenu
src/lib/            progression et tirelire, mémoire de l'appareil, sons, voix
src/ecrans/         les écrans (jeu, qui joue ?, tirelire, réglages des parents)
src/composants/     les morceaux d'écran (liste des ateliers, horloge, icônes…)
public/             les fichiers servis tels quels (sons, avatars, polices, service worker)
scripts/            vérification du contenu, tests, enregistrement des voix, mise en ligne
```

## Licences

Code sous licence [MIT](LICENSE), contenu pédagogique sous licence
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fr). Les images, polices et voix viennent de sources
libres : voir [SOURCES.md](SOURCES.md).
