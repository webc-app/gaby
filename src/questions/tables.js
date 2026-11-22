// Tables de multiplication : une question à la fois, selon les réglages du niveau. Réglages : contenu/tables.md
// Ce fichier fabrique aussi les questions de calcul mental (atelier Calcul mental).
import C from 'virtual:contenu';
import { reglageDu, sansPoint } from './outils.js';
import { poids, tirer1, choixAvec, hasard, melanger } from '../lib/progression.js';

const T = C.tables;

export const cleFait = (a, b) => `x:${Math.min(a, b)}x${Math.max(a, b)}`;

/**
 * Une question de table. reglage : { tables: [6, 7], proches: true (leurres très proches), envers: 0.3 (part de « 6 × ? = 42 ») }.
 * `clavier` : réponse tapée au lieu de choisie.
 */
export function questionTable(n, etat, precedente, clavier = false) {
  const faits = [];
  for (const a of n.tables) for (let b = 2; b <= 10; b++) faits.push([a, b]);
  let [a, b] = tirer1(faits, ([x, y]) => poids(etat, cleFait(x, y)), ([x, y]) => cleFait(x, y), precedente);
  if (Math.random() < 0.5) [a, b] = [b, a];
  const produit = a * b;
  const envers = n.envers && Math.random() < n.envers;

  const q = envers
    ? { texte: `${a} × ? = ${produit}`, reponse: b }
    : { texte: `${a} × ${b}`, reponse: produit };

  const candidats = envers
    ? [b + 1, b - 1, b + 2, b - 2, a]
    : n.proches
      ? [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, produit + 1, produit - 1]
      : [a * (b + 1), (a + 1) * b, produit + 10, produit - 10, hasard(2, 100)];

  return {
    cle: cleFait(a, b),
    texte: q.texte,
    reponse: String(q.reponse),
    ...(clavier ? {} : { choix: choixAvec(q.reponse, candidats) }),
  };
}

/**
 * Calcul mental, une question à la fois.
 * types : 'add20' et 'sous20' (petites additions et soustractions), 'complement10', 'dizaines' (34 + 20, 60 − 30),
 * 'add100' et 'sous100' (deux chiffres, avec retenue), 'suite' (3 + 6 + 7 + 4 : des paires qui font 10),
 * 'neuf11' (ajouter ou retirer 9 ou 11), 'x10' (× 10, × 100, ÷ 10), 'double' (doubles et moitiés), 'x1000',
 * 'complement100', 'complement100dizaines', 'complement1000', 'fractions' (moitié, tiers, quart d'un nombre),
 * 'decimaux' (2,5 + 1,8) et 'x10decimaux' (3,5 × 10, 42 ÷ 10).
 */
const virgule = (x) => String(x).replace('.', ',');
export function questionCalcul(type, etat, precedente, clavier = false) {
  let texte, reponse, candidats, dixiemes = false;
  const n = hasard(2, 99);
  const autour = (r) => [r + 1, r - 1, r + 10, r - 10, r + 2];
  if (type === 'add20') {
    const a = hasard(2, 11), b = hasard(2, 9);
    texte = `${a} + ${b}`; reponse = a + b; candidats = [reponse + 1, reponse - 1, reponse + 2, reponse - 2];
  } else if (type === 'sous20') {
    const b = hasard(2, 9), a = b + hasard(1, 11);
    texte = `${a} − ${b}`; reponse = a - b; candidats = [reponse + 1, reponse - 1, reponse + 2, a + b];
  } else if (type === 'complement10') {
    const d = hasard(1, 9);
    texte = `${d} + ? = 10`; reponse = 10 - d; candidats = [reponse + 1, reponse - 1, d, reponse + 2];
  } else if (type === 'dizaines') {
    if (Math.random() < 0.5) { const a = hasard(11, 69), d = hasard(1, Math.floor((99 - a) / 10)) * 10; texte = `${a} + ${d}`; reponse = a + d; }
    else { const a = hasard(21, 99), d = hasard(1, Math.floor((a - 1) / 10)) * 10; texte = `${a} − ${d}`; reponse = a - d; }
    candidats = [reponse + 10, reponse - 10, reponse + 1, reponse + 20];
  } else if (type === 'add100') {
    // avec retenue : les unités dépassent 10
    const ua = hasard(2, 9), ub = hasard(11 - ua, 9), da = hasard(1, 6), db = hasard(1, 8 - da);
    const a = da * 10 + ua, b = db * 10 + ub;
    texte = `${a} + ${b}`; reponse = a + b; candidats = autour(reponse);
  } else if (type === 'sous100') {
    // avec retenue : les unités du second sont plus grandes
    const ua = hasard(0, 8), ub = hasard(ua + 1, 9), db = hasard(1, 6), da = hasard(db + 1, 9);
    const a = da * 10 + ua, b = db * 10 + ub;
    texte = `${a} − ${b}`; reponse = a - b; candidats = autour(reponse);
  } else if (type === 'suite') {
    // trois ou quatre petits nombres, avec une paire qui fait 10 : on apprend à regrouper
    const p = hasard(1, 9);
    const termes = melanger([p, 10 - p, hasard(2, 9), ...(Math.random() < 0.6 ? [hasard(2, 9)] : [])]);
    texte = termes.join(' + '); reponse = termes.reduce((s, x) => s + x, 0); candidats = [reponse + 1, reponse - 1, reponse + 2, reponse - 2, reponse + 10];
  } else if (type === 'neuf11') {
    const k = Math.random() < 0.5 ? 9 : 11, a = hasard(15, 88);
    if (Math.random() < 0.5) { texte = `${a} + ${k}`; reponse = a + k; } else { texte = `${a} − ${k}`; reponse = a - k; }
    candidats = [reponse + 1, reponse - 1, reponse + 2, reponse - 2, reponse + 10];
  } else if (type === 'x10') {
    const quoi = hasard(0, 2);
    if (quoi === 0) { texte = `${n} × 10`; reponse = n * 10; candidats = [n * 100, n + 10, n * 10 + 10, n * 10 - 10]; }
    else if (quoi === 1) { texte = `${n} × 100`; reponse = n * 100; candidats = [n * 10, n * 1000, n + 100, n * 100 + 100]; }
    else { const m = n * 10; texte = `${m} ÷ 10`; reponse = n; candidats = [m, n * 100, n + 1, n - 1]; }
  } else if (type === 'x1000') {
    const k = hasard(2, 40);
    texte = `${k} × 1000`; reponse = k * 1000; candidats = [k * 100, k * 10000, k * 1000 + 100, k + 1000];
  } else if (type === 'double') {
    if (Math.random() < 0.5) { const d = hasard(11, 60); texte = `Double de ${d}`; reponse = d * 2; candidats = [d * 2 + 10, d * 2 - 10, d * 2 + 1, Math.round(d / 2)]; }
    else { const m = hasard(10, 60) * 2; texte = `Moitié de ${m}`; reponse = m / 2; candidats = [m / 2 + 10, m / 2 - 10, m / 2 + 1, m * 2]; }
  } else if (type === 'fractions') {
    // la moitié, le tiers, le quart, les trois quarts d'un nombre qui tombe juste
    const [nom, haut, bas] = [['Moitié', 1, 2], ['Tiers', 1, 3], ['Quart', 1, 4], ['Trois quarts', 3, 4]][hasard(0, 3)];
    const part = hasard(2, 12), total = part * bas;
    texte = `${nom} de ${total}`; reponse = part * haut; candidats = [part, total - part, reponse + 1, reponse - 1, part * 2, reponse + bas];
  } else if (type === 'decimaux' || type === 'x10decimaux') {
    // on compte en dixièmes (25 pour 2,5), et on écrit la virgule à la fin
    dixiemes = true;
    const v = (x) => virgule(x / 10);
    if (type === 'decimaux') {
      const a = hasard(11, 89), b = hasard(2, 49);
      if (Math.random() < 0.5) { texte = `${v(a)} + ${v(b)}`; reponse = a + b; } else { texte = `${v(a + b)} − ${v(b)}`; reponse = a; }
      candidats = [reponse + 1, reponse - 1, reponse + 10, reponse - 10, reponse + 9];
    } else {
      const a = hasard(11, 99);
      const quoi = hasard(0, 2);
      if (quoi === 0) { texte = `${v(a)} × 10`; reponse = a * 10; candidats = [a, a * 100, a * 10 + 100, a + 100]; }
      else if (quoi === 1) { texte = `${v(a)} × 100`; reponse = a * 100; candidats = [a * 10, a * 1000, a, a * 100 + 1000]; }
      else { texte = `${a} ÷ 10`; reponse = a; candidats = [a * 10, a * 100, a + 10, a + 1]; }
    }
  } else if (type === 'complement100dizaines') {
    const d = hasard(1, 9) * 10; texte = `${d} + ? = 100`; reponse = 100 - d; candidats = [reponse + 10, reponse - 10, 110 - d, d];
  } else if (type === 'complement100') {
    const d = hasard(11, 89); texte = `${d} + ? = 100`; reponse = 100 - d; candidats = [reponse + 10, reponse - 10, reponse + 1, 110 - d];
  } else {
    const d = hasard(5, 95) * 10; texte = `${d} + ? = 1000`; reponse = 1000 - d; candidats = [reponse + 100, reponse - 100, reponse + 10, 1100 - d];
  }
  // Évite de reposer exactement la même question
  if (`m:${texte}` === precedente) return questionCalcul(type, etat, precedente, clavier);
  const ecrit = (x) => (dixiemes ? virgule(Number(x) / 10) : String(x));
  return { cle: `m:${texte}`, texte, reponse: ecrit(reponse), ...(clavier ? {} : { choix: choixAvec(reponse, candidats).map(ecrit) }) };
}

export default {
  id: 'tables',
  nom: T.titre,
  description: sansPoint(T.description),
  couleur: '#ff7a3d',
  niveaux: T.niveaux,
  generer(niveau, etat, precedente) {
    return questionTable(reglageDu(T.reglages, niveau), etat, precedente);
  },
};
