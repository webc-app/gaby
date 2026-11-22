// Homophones : une phrase à trou, choisir le bon mot parmi ceux qui se prononcent pareil. Contenu : contenu/homophones.md
import C from 'virtual:contenu';
import { tirerFiche, sansPoint } from './outils.js';

const H = C.homophones;
const phrases = H.groupes.flatMap((g) => g.phrases.map((p) => ({ ...p, niveau: g.niveau, groupe: g })));

export default {
  id: 'homophones',
  nom: H.titre,
  description: sansPoint(H.description),
  couleur: '#ff9ec7',
  niveaux: H.niveaux,
  generer(niveau, etat, precedente) {
    const { phrase, bonne, groupe } = tirerFiche(phrases, niveau, H.niveaux, etat, (x) => `o:${x.phrase}`, precedente, 4);
    const [avant, apres] = phrase.split('___');
    const astuce = groupe.mots.find((m) => m.mot === bonne)?.astuce;
    return {
      cle: `o:${phrase}`,
      texte: phrase,
      phrase: { avant, mot: '___', apres, trou: true },
      consigne: 'Quel mot complète la phrase ?',
      reponse: bonne,
      choix: groupe.mots.map((m) => m.mot),
      explication: astuce ? `« ${bonne} » : ${astuce}` : `C’était « ${bonne} »`,
    };
  },
};
