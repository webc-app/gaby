#!/bin/sh
# Construit l'app et l'envoie sur le serveur.
# L'adresse du serveur est dans le fichier .env (jamais dans git), voir .env.exemple.
# L'app est un site statique : la progression des joueurs reste sur leur appareil, rien n'est gardé sur le serveur.
set -e
cd "$(dirname "$0")/.."
[ -f .env ] && . ./.env
: "${DEPLOY_SSH:?Il manque DEPLOY_SSH dans .env (voir .env.exemple)}"
: "${DEPLOY_DOSSIER:?Il manque DEPLOY_DOSSIER dans .env (voir .env.exemple)}"
npm run build
# --delete retire en ligne ce qui n'existe plus dans dist/, sauf les fichiers propres à l'hébergeur
rsync -az --delete --filter='P .user.ini' --filter='P .infomaniak-*' dist/ "$DEPLOY_SSH:$DEPLOY_DOSSIER/"
echo "En ligne${DEPLOY_ADRESSE:+ : $DEPLOY_ADRESSE}"
