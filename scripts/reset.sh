#!/bin/sh
# ATTENTION : efface la progression de TOUS les joueurs, en local ou sur le serveur (adresse dans .env).
#   sh scripts/reset.sh local
#   sh scripts/reset.sh test
# Les profils ne sont pas détruits : ils sont déplacés dans gaby-data/secours/avant-reset-<date>/.
# Chaque appareil revient à l'écran d'entrée à sa prochaine connexion.
set -e
cd "$(dirname "$0")/.."

RESET='$d = "secours/avant-reset-" . date("Y-m-d-His"); @mkdir($d, 0700, true);
if (is_dir("joueurs")) rename("joueurs", "$d/joueurs");
echo "Tous les profils ont été mis de côté dans $d\n";'

case "$1" in
  local) cd .data && php -r "$RESET" ;;
  test)  [ -f .env ] && . ./.env
         : "${DEPLOY_SSH:?Il manque DEPLOY_SSH dans .env (voir .env.exemple)}"
         : "${DEPLOY_DONNEES:?Il manque DEPLOY_DONNEES dans .env (voir .env.exemple)}"
         ssh "$DEPLOY_SSH" "cd $DEPLOY_DONNEES && php -r '$(echo "$RESET" | sed "s/'/'\\\\''/g")'" ;;
  *) echo "Usage : sh scripts/reset.sh local|test" ; exit 1 ;;
esac
