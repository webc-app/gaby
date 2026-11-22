// Dictée : l'app lit un mot ou un petit groupe de mots, l'enfant l'écrit sans faute. Contenu : contenu/dictee.md
import C from 'virtual:contenu';
import { tirerFiche, sansPoint } from './outils.js';
import { sonDe } from '../lib/voix.js';

const D = C.dictee;

export default {
  id: 'dictee',
  nom: D.titre,
  description: sansPoint(D.description),
  couleur: '#b06bff',
  clavier: 'text',
  ecoute: true,
  temps: 20, // temps de base en mode chrono (ensuite calé sur ses propres réponses)
  niveaux: D.niveaux,
  generer(niveau, etat, precedente) {
    const { texte } = tirerFiche(D.mots, niveau, D.niveaux, etat, (m) => `e:${m.texte}`, precedente, 4);
    // le son (enregistré par npm run voix) est dit deux fois, même si les bruitages sont coupés
    return { cle: `e:${texte}`, texte, reponse: texte, son: sonDe('dictee', texte), sonToujours: true, sonFois: 2 };
  },
};
