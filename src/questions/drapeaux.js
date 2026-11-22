// Drapeaux : le drapeau est affiché, on trouve le pays parmi quatre ; ou l'inverse, le pays est écrit
// et on trouve son drapeau parmi quatre. Les pièges : d'abord les drapeaux qui se ressemblent (« Ressemble »),
// puis les pays du même niveau, puis ceux des niveaux déjà vus. Contenu : contenu/drapeaux.md
import C from 'virtual:contenu';
import { melanger } from '../lib/progression.js';
import { tirerFiche, sansPoint } from './outils.js';

const K = C.drapeaux;
// Un drapeau dans les choix : « drap:fr » (Jeu.svelte l'affiche en image)
const choixDrapeau = (x) => `drap:${x.drapeau}`;

/** La fiche et 3 autres pays : ceux qui ressemblent, puis le même niveau, puis les niveaux déjà vus */
function leurres(fiche, niveau) {
  const vus = K.pays.filter((x) => x !== fiche && x.niveau <= Math.min(niveau, K.niveaux));
  const ressemblent = melanger(K.pays.filter((x) => fiche.ressemble.includes(x.pays)));
  const proches = melanger(vus.filter((x) => x.niveau === fiche.niveau));
  const autres = melanger(vus.filter((x) => x.niveau !== fiche.niveau));
  return [...new Set([...ressemblent, ...proches, ...autres])].slice(0, 3);
}

export default {
  id: 'drapeaux',
  nom: K.titre,
  description: sansPoint(K.description),
  couleur: '#ff9ec7',
  temps: 8, // temps de base en mode chrono (ensuite calé sur ses propres réponses)
  niveaux: K.niveaux,
  generer(niveau, etat, precedente) {
    const cleDe = (x) => `f:${x.pays}`;
    const fiche = tirerFiche(K.pays, niveau, K.niveaux, etat, cleDe, precedente);
    const faux = leurres(fiche, niveau);
    if (Math.random() < 0.5) {
      return {
        cle: cleDe(fiche), drapeau: C.svgDrapeaux[fiche.drapeau], consigne: 'De quel pays est ce drapeau ?',
        reponse: fiche.pays, choix: melanger([fiche, ...faux].map((x) => x.pays)), explication: `C’était : ${fiche.pays}`,
      };
    }
    return {
      cle: cleDe(fiche), grand: fiche.pays, texte: 'Quel est son drapeau ?',
      reponse: choixDrapeau(fiche), choix: melanger([fiche, ...faux].map(choixDrapeau)),
    };
  },
};
