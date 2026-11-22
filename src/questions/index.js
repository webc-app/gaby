import tables from './tables.js';
import divisions from './divisions.js';
import synonymes from './synonymes.js';
import homophones from './homophones.js';
import heure from './heure.js';
import culture from './culture.js';
import dictee from './dictee.js';
import capitales from './capitales.js';
import drapeaux from './drapeaux.js';
import calcul from './calcul.js';
import lecture from './lecture.js';
import anglais from './anglais.js';
import conjugaison from './conjugaison.js';
import echecs from './echecs.js';
import route from './route.js';

// Les ateliers à toucher : maths, français et anglais.
export const jeux = [tables, divisions, synonymes, homophones, conjugaison, heure, anglais];
// Les autres ateliers (même règle que tous : bonne réponse = gain, et le mode chrono possible partout).
export const defis = [dictee, capitales, drapeaux, calcul, culture, echecs, route];
// Aléatoire : tous les ateliers courts mélangés (ni la lecture, ni la dictée)
export const aleatoires = [...jeux, capitales, drapeaux, calcul, culture, echecs, route];
// La lecture : à part, elle rapporte quand toutes les questions sont justes.
export { lecture };
export const matieres = [...jeux, ...defis, lecture];

// Aléatoire n'est pas un atelier à part : il pioche dans « aleatoires ». Il a quand même son nom, son niveau et sa ligne.
export const ALEATOIRE = { id: 'aleatoire', nom: 'Aléatoire', description: 'Un peu de tout, mélangé', couleur: '#ffffff' };

// Le tiroir des ateliers, rangés par matière comme à l'école
export const rubriques = [
  { titre: 'Maths', ateliers: [tables, divisions, calcul, heure] },
  { titre: 'Français', ateliers: [dictee, conjugaison, synonymes, homophones] },
  { titre: 'Anglais', ateliers: [anglais] },
  { titre: 'Découvertes', ateliers: [capitales, drapeaux, culture, route, echecs, lecture] },
];

export const trouverMatiere = (id) => matieres.find((m) => m.id === id) ?? matieres[0];

/** Comparaison d'une réponse tapée : majuscules et espaces en trop ignorés, accents exigés. */
export function normaliser(texte) {
  return String(texte).trim().replace(/[’`]/g, '\'').replace(/\s+/g, ' ').replace(/[.!]+$/, '').toLowerCase();
}
