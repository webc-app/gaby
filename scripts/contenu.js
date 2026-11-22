// Charge le dossier contenu/ (Node seulement) et le vérifie. Utilisé par vite.config.js et par « npm run contenu ».
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { verifierContenu } from '../src/contenu/verifier.js';

export const DOSSIER_CONTENU = new URL('../contenu/', import.meta.url).pathname;
export const DOSSIER_IMAGES = join(DOSSIER_CONTENU, 'images');
export const DOSSIER_DRAPEAUX = new URL('../src/drapeaux/', import.meta.url).pathname;
const DOSSIER_PANNEAUX = new URL('../src/panneaux/', import.meta.url).pathname;

function fichiersMd(dossier) {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiersMd(chemin);
    return nom.endsWith('.md') ? [chemin] : [];
  });
}

export function chargerContenu() {
  const fichiers = {};
  for (const chemin of fichiersMd(DOSSIER_CONTENU)) fichiers[relative(DOSSIER_CONTENU, chemin)] = readFileSync(chemin, 'utf8');
  // Les images (contenu/images/) : leur nom et leur poids, pour la vérification
  const images = {};
  if (existsSync(DOSSIER_IMAGES)) {
    for (const nom of readdirSync(DOSSIER_IMAGES)) {
      const chemin = join(DOSSIER_IMAGES, nom);
      if (statSync(chemin).isFile() && !nom.startsWith('.')) images[nom] = statSync(chemin).size;
    }
  }
  // Les drapeaux (src/drapeaux/fr.svg…) : leur code
  const drapeaux = existsSync(DOSSIER_DRAPEAUX) ? readdirSync(DOSSIER_DRAPEAUX).filter((n) => n.endsWith('.svg')).map((n) => n.slice(0, -4)) : [];
  const panneaux = existsSync(DOSSIER_PANNEAUX) ? readdirSync(DOSSIER_PANNEAUX).filter((n) => n.endsWith('.svg')).map((n) => n.slice(0, -4)) : [];
  return verifierContenu(fichiers, images, drapeaux, panneaux);
}

export const texteErreurs = (erreurs) => erreurs.map((e) => `  contenu/${e.fichier} ligne ${e.ligne} : ${e.message}`).join('\n');
