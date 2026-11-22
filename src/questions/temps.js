// Les temps : conjuguer un verbe courant, à un temps donné. Un atelier par temps (présent, futur, imparfait, passé composé),
// tous fabriqués ici. Contenu : contenu/present.md, futur.md, conjugaison.md (l'imparfait), passe-compose.md
// Une personne et un verbe (« Nous ___ (chanter) »), ou une phrase à trou.
// Les choix vérifient surtout l'orthographe : la bonne forme, une forme qui se prononce pareil (faisais / faisait),
// et des fautes (fesais, faisai) : celles du verbe (« Pièges » de sa fiche) et celles du temps (src/lib/temps.js).
import C from 'virtual:contenu';
import { melanger } from '../lib/progression.js';
import { TEMPS, FICHIERS } from '../lib/temps.js';
import { tirerFiche, sansPoint } from './outils.js';

const auHasard = (liste) => liste[Math.floor(Math.random() * liste.length)];

/** Le pronom affiché : « J’ » devant une voyelle ou un h, « Il » ou « Elle », « Ils » ou « Elles » */
function pronom(p, forme, fixe) {
  if (p === 'je') return /^[aeiouyhéèêâîôû]/i.test(forme) ? 'J’' : 'Je ';
  if (p === 'il') return `${fixe ? 'Il' : auHasard(['Il', 'Elle'])} `;
  if (p === 'ils') return `${fixe ? 'Ils' : auHasard(['Ils', 'Elles'])} `;
  return `${p[0].toUpperCase()}${p.slice(1)} `;
}

/** Les fautes propres au verbe (« Pièges » de sa fiche), mises à la bonne personne */
function piegesDe(T, v, p, bonne) {
  if (T.pieges === 'participe') return (v.pieges ?? []).map((x) => `${bonne.split(' ')[0]} ${x}`);
  if (T.pieges === 'decline') return (v.pieges ?? []).map((x) => x.slice(0, -T.finJe.length) + T.fins[p]);
  return [];
}

/**
 * La bonne forme et 3 autres, toutes différentes : d'abord une faute propre au verbe (fesais), puis une vraie forme
 * qui se prononce pareil (faisait), puis au hasard une autre faute ou une autre forme.
 */
function choixDe(T, v, p, bonne) {
  const vraies = new Set(Object.values(v.formes));
  const fautes = (liste) => melanger([...new Set(liste)].filter((x) => x && !vraies.has(x)));
  const pieges = fautes(piegesDe(T, v, p, bonne));
  const fins = fautes(T.fautes(bonne, p));
  const pareil = melanger([...new Set((T.memeSon[p] ?? []).map((x) => v.formes[x]))].filter((x) => x !== bonne));
  const autres = melanger([...vraies].filter((x) => x !== bonne && !pareil.includes(x)));
  const choisis = [pieges[0], pareil[0]].filter(Boolean);
  const reste = [...melanger([pieges[1], fins[0], pareil[1]].filter(Boolean)), ...fins.slice(1), ...autres];
  for (const x of reste) if (choisis.length < 3 && !choisis.includes(x)) choisis.push(x);
  return melanger([bonne, ...choisis]);
}

export function atelierTemps(id, { couleur }) {
  const K = C[id];
  const T = TEMPS[FICHIERS[id]];
  const fiches = [...K.verbes.map((v) => ({ ...v, sorte: 'verbe' })), ...K.phrases.map((p) => ({ ...p, sorte: 'phrase' }))];
  const verbe = (inf) => K.verbes.find((v) => v.verbe === inf);
  const consigne = `Conjugue ${T.nom}`;
  return {
    id,
    nom: K.titre,
    description: sansPoint(K.description),
    couleur,
    niveaux: K.niveaux,
    generer(niveau, etat, precedente) {
      const cleDe = (f) => (f.sorte === 'phrase' ? `${T.prefixe}:${f.phrase}` : `${T.prefixe}:${f.verbe}`);
      const f = tirerFiche(fiches, niveau, K.niveaux, etat, cleDe, precedente);
      if (f.sorte === 'phrase') {
        const v = verbe(f.verbe);
        const [avant, apres] = f.phrase.split('___');
        const p = Object.keys(v.formes).find((x) => v.formes[x] === f.bonne);
        return {
          cle: cleDe(f), texte: f.phrase, reponse: f.bonne, choix: choixDe(T, v, p, f.bonne),
          phrase: { avant, mot: '___', apres: `${apres} (${f.verbe})`, trou: true },
          consigne,
          explication: `« ${f.bonne} » : le verbe ${f.verbe} ${T.nom}`,
        };
      }
      const p = auHasard(f.personnes);
      const bonne = f.formes[p];
      const debut = pronom(p, bonne, T.pronomFixe);
      return {
        cle: `${cleDe(f)}:${p}`, texte: `${debut}${bonne}`, reponse: bonne, choix: choixDe(T, f, p, bonne),
        phrase: { avant: debut, mot: '___', apres: ` (${f.verbe})`, trou: true },
        consigne,
        explication: `${debut}${bonne} : le verbe ${f.verbe} ${T.nom}`,
      };
    },
  };
}
