// Synonymes : une phrase, un mot surligné, 4 mots au choix, un seul a le même sens. Contenu : contenu/synonymes.md
import C from 'virtual:contenu';
import { melanger } from '../lib/progression.js';
import { tirerFiche, sansPoint } from './outils.js';

const S = C.synonymes;

export default {
  id: 'synonymes',
  nom: S.titre,
  description: sansPoint(S.description),
  couleur: '#b06bff',
  niveaux: S.niveaux,
  generer(niveau, etat, precedente) {
    const f = tirerFiche(S.items, niveau, S.niveaux, etat, (x) => `s:${x.phrase}`, precedente);
    const [avant, mot, apres] = f.phrase.split('*');
    return {
      cle: `s:${f.phrase}`,
      texte: mot,
      phrase: { avant, mot, apres },
      consigne: 'Quel mot a le même sens ?',
      reponse: f.bonne,
      choix: melanger([f.bonne, ...f.mauvaises]),
      explication: f.explication ?? `« ${mot} » veut dire « ${f.bonne} »`,
    };
  },
};
