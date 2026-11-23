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
# En ligne seulement : toute autre adresse (par exemple sans « www ») renvoie vers DEPLOY_ADRESSE.
# Ajouté ici et non dans public/.htaccess, pour que l'adresse reste hors de git et que le local ne soit pas touché.
if [ -n "$DEPLOY_ADRESSE" ]; then
  HOTE=$(printf '%s' "$DEPLOY_ADRESSE" | sed -E 's#^[a-z]+://##; s#/.*$##')
  { printf '%s\n' \
      "# Une seule adresse : $HOTE (ajouté par scripts/deploy.sh)" \
      '<IfModule mod_rewrite.c>' \
      '  RewriteEngine On' \
      "  RewriteCond %{HTTP_HOST} !^$(printf '%s' "$HOTE" | sed 's/\./\\./g')\$ [NC]" \
      "  RewriteRule ^ https://$HOTE%{REQUEST_URI} [R=301,L]" \
      '</IfModule>' ''
    cat dist/.htaccess; } > dist/.htaccess.tmp && mv dist/.htaccess.tmp dist/.htaccess
fi
# --delete retire en ligne ce qui n'existe plus dans dist/, sauf les fichiers propres à l'hébergeur
rsync -az --delete --filter='P .user.ini' --filter='P .infomaniak-*' dist/ "$DEPLOY_SSH:$DEPLOY_DOSSIER/"
echo "En ligne${DEPLOY_ADRESSE:+ : $DEPLOY_ADRESSE}"
