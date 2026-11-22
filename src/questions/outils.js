// Outils communs aux ateliers : le niveau, le « niveau max » et le tirage d'une fiche.
// Un atelier a N niveaux (son fichier dans contenu/) ; au-delà, c'est le niveau max : tout est mélangé.
import { poids, tirer1 } from '../lib/progression.js';

/** Au niveau max (au-delà du dernier niveau écrit) ? */
export const auMax = (niveau, nombre) => niveau > nombre;

/**
 * Tire une fiche parmi celles du niveau en cours et des niveaux d'avant (un peu de révision).
 * Le niveau en cours compte `poidsActuel` fois plus ; au niveau max, tout est à égalité.
 * Les fiches ratées reviennent plus souvent (poids des faits).
 */
export function tirerFiche(fiches, niveau, nombre, etat, cleDe, precedente, poidsActuel = 3) {
  const max = auMax(niveau, nombre);
  const dispo = fiches.filter((f) => f.niveau <= Math.min(niveau, nombre));
  return tirer1(dispo, (f) => poids(etat, cleDe(f)) * (!max && f.niveau === niveau ? poidsActuel : 1), cleDe, precedente);
}

/** Ateliers calculés : les réglages du niveau ; au niveau max, ceux d'un niveau au hasard. */
export const reglageDu = (reglages, niveau) =>
  niveau > reglages.length ? reglages[Math.floor(Math.random() * reglages.length)] : reglages[niveau - 1];

/** « Trouver le mot qui a le même sens. » → « Trouver le mot qui a le même sens » (pour le tiroir) */
export const sansPoint = (texte) => (texte ?? '').replace(/\.\s*$/, '');
