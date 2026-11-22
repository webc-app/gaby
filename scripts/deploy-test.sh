#!/bin/sh
# Construit l'app et l'envoie sur le serveur.
# L'adresse du serveur est dans le fichier .env (jamais dans git), voir .env.exemple.
# La progression des joueurs est dans gaby-data/, à côté du dossier web : elle n'est jamais touchée.
set -e
cd "$(dirname "$0")/.."
[ -f .env ] && . ./.env
: "${DEPLOY_SSH:?Il manque DEPLOY_SSH dans .env (voir .env.exemple)}"
: "${DEPLOY_DOSSIER:?Il manque DEPLOY_DOSSIER dans .env (voir .env.exemple)}"
npm run build
rsync -az --delete dist/ "$DEPLOY_SSH:$DEPLOY_DOSSIER/"
echo "En ligne${DEPLOY_ADRESSE:+ : $DEPLOY_ADRESSE}"
