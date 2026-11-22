// Capitales : choisir la capitale d'un pays parmi quatre ; à partir du niveau 5, parfois le pays d'une capitale.
// Les mauvaises réponses viennent d'abord des pays du même niveau (la même région du monde). Contenu : contenu/capitales.md
import C from 'virtual:contenu';
import { melanger } from '../lib/progression.js';
import { tirerFiche, auMax, sansPoint } from './outils.js';

const K = C.capitales;

/** La bonne réponse et 3 autres (capitales ou pays), prises d'abord dans le même niveau, puis dans les niveaux déjà vus */
function choixDe(fiche, champ, niveau) {
  const vus = K.pays.filter((x) => x !== fiche && x.niveau <= Math.min(niveau, K.niveaux));
  const proches = melanger(vus.filter((x) => x.niveau === fiche.niveau));
  const autres = melanger(vus.filter((x) => x.niveau !== fiche.niveau));
  const leurres = [...new Set([...proches, ...autres].map((x) => x[champ]))].filter((x) => x !== fiche[champ]).slice(0, 3);
  return melanger([fiche[champ], ...leurres]);
}

export default {
  id: 'capitales',
  nom: K.titre,
  description: sansPoint(K.description),
  couleur: '#5be37d',
  temps: 10, // temps de base en mode chrono (ensuite calé sur ses propres réponses)
  niveaux: K.niveaux,
  generer(niveau, etat, precedente) {
    const envers = niveau >= 5 && Math.random() < (auMax(niveau, K.niveaux) ? 0.5 : 0.35);
    const cleDe = (x) => `c:${envers ? x.capitale : x.pays}`;
    const fiche = tirerFiche(K.pays, niveau, K.niveaux, etat, cleDe, precedente);
    const { drapeau, pays, capitale } = fiche;
    return envers
      ? { cle: `c:${capitale}`, grand: capitale, texte: 'C’est la capitale de quel pays ?', reponse: pays, choix: choixDe(fiche, 'pays', niveau) }
      : { cle: `c:${pays}`, grand: pays, petitDrapeau: drapeau && C.svgDrapeaux[drapeau], texte: 'Quelle est sa capitale ?', reponse: capitale, choix: choixDe(fiche, 'capitale', niveau) };
  },
};
