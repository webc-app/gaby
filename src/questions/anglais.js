// Anglais : vocabulaire en images et petits dialogues de classe. Contenu : contenu/anglais.md
// Chaque mot et chaque phrase anglaise a son fichier son, enregistré à l'avance (npm run voix).
import C from 'virtual:contenu';
import { melanger } from '../lib/progression.js';
import { sonActif } from '../lib/sons.js';
import { tirerFiche, sansPoint } from './outils.js';
import { sonDe } from '../lib/voix.js';

const fichierSon = (texte) => sonDe('anglais', texte);

const A = C.anglais;
const fiches = [...A.mots.map((m) => ({ ...m, mot: true })), ...A.dialogues];
const groupe = (nom) => A.mots.filter((m) => m.groupe === nom);
// Une image peut être un fichier (« img:lion.jpg ») : dans les textes, on dit alors le mot français
const nomImage = (m) => (m.image.startsWith('img:') ? m.francais ?? m.anglais : m.image);
const estDessin = (x) => x.startsWith('img:') || !/^[0-9a-zàâçéèêëîïôûùüœ' -]+$/i.test(x); // un emoji (pas un nombre ni un mot)
const estNombre = (x) => /^[0-9]+$/.test(x);

export default {
  id: 'anglais',
  nom: A.titre,
  description: sansPoint(A.description),
  couleur: '#7d8bff',
  niveaux: A.niveaux,
  generer(niveau, etat, precedente) {
    const cleDe = (x) => (x.mot ? `en:${x.anglais}:${x.image}` : `en:${x.bonne}:${x.question}`);
    const f = tirerFiche(fiches, niveau, A.niveaux, etat, cleDe, precedente);
    const cle = cleDe(f);

    // Dialogue : on entend la question, on choisit la bonne réponse (ou, parfois, son sens en français)
    if (!f.mot) {
      const explication = `${f.question} = ${f.sens}`;
      if (Math.random() < 0.25) {
        const autres = A.dialogues.filter((d) => d.sens !== f.sens && d.niveau <= Math.max(niveau, f.niveau)).map((d) => d.sens);
        return { cle, consigne: f.question, son: fichierSon(f.question), reponse: f.sens, choix: melanger([f.sens, ...melanger(autres).slice(0, 3)]), explication };
      }
      return { cle, consigne: f.question, son: fichierSon(f.question), sonApres: fichierSon(f.bonne), reponse: f.bonne, choix: melanger([f.bonne, ...f.mauvaises]), explication };
    }

    const leurres = melanger(groupe(f.groupe).filter((m) => m.anglais !== f.anglais)).slice(0, 3);
    const son = fichierSon(f.anglais);
    // J'écoute → je touche le dessin (seulement si le son est allumé)
    if (sonActif() && Math.random() < 0.4) {
      return { cle, ecoute: true, son, reponse: f.image, choix: melanger([f.image, ...leurres.map((x) => x.image)]), explication: `${nomImage(f)} = ${f.anglais}${f.francais && !f.image.startsWith('img:') ? ` (${f.francais})` : ''}` };
    }
    // Je vois → je choisis le mot anglais
    return {
      cle, traduire: true, grand: f.image, dessin: estDessin(f.image) || estNombre(f.image),
      texte: f.question ?? (estDessin(f.image) || estNombre(f.image) ? 'En anglais ?' : 'Comment on dit en anglais ?'),
      sonApres: son, reponse: f.anglais, choix: melanger([f.anglais, ...leurres.map((x) => x.anglais)]), explication: `${nomImage(f)} = ${f.anglais}`,
    };
  },
};
