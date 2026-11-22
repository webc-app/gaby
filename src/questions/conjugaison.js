// Les temps : conjuguer un verbe courant (pour l'instant à l'imparfait). Contenu : contenu/conjugaison.md
// Une personne et un verbe (« Nous ___ (chanter) »), ou une phrase à trou.
// Les choix vérifient surtout l'orthographe : la bonne forme, une forme qui se prononce pareil (faisais / faisait),
// et des fautes (fesais, faisai) : celles du verbe (« Pièges » de sa fiche) et des terminaisons fausses.
import C from 'virtual:contenu';
import { melanger } from '../lib/progression.js';
import { tirerFiche, sansPoint } from './outils.js';

const K = C.conjugaison;
const fiches = [...K.verbes.map((v) => ({ ...v, sorte: 'verbe' })), ...K.phrases.map((p) => ({ ...p, sorte: 'phrase' }))];
const verbe = (inf) => K.verbes.find((v) => v.verbe === inf);
const auHasard = (liste) => liste[Math.floor(Math.random() * liste.length)];

/** Le pronom affiché : « J’ » devant une voyelle ou un h, « Il » ou « Elle », « Ils » ou « Elles » */
function pronom(p, forme) {
  if (p === 'je') return /^[aeiouyhéèêâîôû]/i.test(forme) ? 'J’' : 'Je ';
  if (p === 'il') return `${auHasard(['Il', 'Elle'])} `;
  if (p === 'ils') return `${auHasard(['Ils', 'Elles'])} `;
  return `${p[0].toUpperCase()}${p.slice(1)} `;
}
// Les terminaisons de l'imparfait, celles qui se prononcent pareil, et des terminaisons fausses qui sonnent presque pareil
const FINS = { je: 'ais', tu: 'ais', il: 'ait', nous: 'ions', vous: 'iez', ils: 'aient' };
const MEME_SON = { je: ['il', 'ils'], tu: ['il', 'ils'], il: ['je', 'ils'], ils: ['il', 'je'], nous: ['vous'], vous: ['nous'] };
const FAUSSES_FINS = { je: ['ai', 'é', 'és'], tu: ['ai', 'é', 'és'], il: ['ai', 'é', 'ais'], nous: ['ons', 'iont', 'illons'], vous: ['ez', 'iés', 'ier'], ils: ['aint', 'aits', 'ais'] };
const sans = (forme, fin) => (forme.endsWith(fin) ? forme.slice(0, -fin.length) : forme);

/**
 * La bonne forme et 3 autres, toutes différentes : d'abord une faute propre au verbe (fesais), puis une vraie forme
 * qui se prononce pareil (faisait), puis au hasard une autre faute ou une autre forme.
 */
function choixDe(v, p, bonne) {
  const vraies = new Set(Object.values(v.formes));
  const fautes = (liste) => melanger([...new Set(liste)].filter((x) => !vraies.has(x)));
  const pieges = fautes((v.pieges ?? []).map((x) => sans(x, 'ais') + FINS[p]));
  const fins = fautes(FAUSSES_FINS[p].map((fin) => sans(bonne, FINS[p]) + fin));
  const pareil = melanger([...new Set(MEME_SON[p].map((x) => v.formes[x]))].filter((x) => x !== bonne));
  const autres = melanger([...vraies].filter((x) => x !== bonne && !pareil.includes(x)));
  const choisis = [pieges[0], pareil[0]].filter(Boolean);
  const reste = [...melanger([pieges[1], fins[0], pareil[1]].filter(Boolean)), ...fins.slice(1), ...autres];
  for (const x of reste) if (choisis.length < 3 && !choisis.includes(x)) choisis.push(x);
  return melanger([bonne, ...choisis]);
}

export default {
  id: 'conjugaison',
  nom: K.titre,
  description: sansPoint(K.description),
  couleur: '#7ee8c4',
  niveaux: K.niveaux,
  generer(niveau, etat, precedente) {
    const cleDe = (f) => (f.sorte === 'phrase' ? `t:${f.phrase}` : `t:${f.verbe}`);
    const f = tirerFiche(fiches, niveau, K.niveaux, etat, cleDe, precedente);
    if (f.sorte === 'phrase') {
      const v = verbe(f.verbe);
      const [avant, apres] = f.phrase.split('___');
      const p = Object.keys(v.formes).find((x) => v.formes[x] === f.bonne);
      return {
        cle: cleDe(f), texte: f.phrase, reponse: f.bonne, choix: choixDe(v, p, f.bonne),
        phrase: { avant, mot: '___', apres: `${apres} (${f.verbe})`, trou: true },
        consigne: 'Conjugue à l’imparfait',
        explication: `« ${f.bonne} » : le verbe ${f.verbe} à l’imparfait`,
      };
    }
    const p = auHasard(f.personnes);
    const bonne = f.formes[p];
    const debut = pronom(p, bonne);
    return {
      cle: `${cleDe(f)}:${p}`, texte: `${debut}${bonne}`, reponse: bonne, choix: choixDe(f, p, bonne),
      phrase: { avant: debut, mot: '___', apres: ` (${f.verbe})`, trou: true },
      consigne: 'Conjugue à l’imparfait',
      explication: `${debut}${bonne} : le verbe ${f.verbe} à l’imparfait`,
    };
  },
};
