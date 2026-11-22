// Divisions : on part du sens (partager, faire des paquets) avant de calculer. Réglages : contenu/divisions.md
import C from 'virtual:contenu';
import { reglageDu, sansPoint } from './outils.js';
import { poids, tirer1, choixAvec, hasard, melanger } from '../lib/progression.js';

const D = C.divisions;

const cle = (total, diviseur) => `d:${total}/${diviseur}`;

function faits(diviseurs, quotientMax = 10, quotientMin = 1) {
  const liste = [];
  for (const d of diviseurs) for (let q = quotientMin; q <= quotientMax; q++) liste.push([d * q, d, q]);
  return liste;
}

function choisir(liste, etat, precedente) {
  return tirer1(liste, ([t, d]) => poids(etat, cle(t, d)), ([t, d]) => cle(t, d), precedente);
}

// Les cinq sortes d'exercices (réglages de chaque niveau : contenu/divisions.md)
const EXERCICES = {
  // Partager, avec le dessin
  partager(r, etat, prec) {
    const [t, d, q] = choisir(faits(r.diviseurs, r.max, 2), etat, prec);
    const { objet, receveur, noms } = D.objets[hasard(0, D.objets.length - 1)];
    return {
      cle: cle(t, d), dessin: [objet.repeat(t), receveur.repeat(d)],
      texte: `${t} ${objet} pour ${d} ${noms}. Combien chacun ?`, reponse: q, candidats: [q + 1, q - 1, d, q + 2, t],
    };
  },
  // Faire des paquets, avec le dessin
  paquets(r, etat, prec) {
    const [t, d, q] = choisir(faits(r.diviseurs, r.max, 2), etat, prec);
    const { objet } = D.objets[hasard(0, D.objets.length - 1)];
    return {
      cle: cle(t, d), dessin: [objet.repeat(t)],
      texte: `${t} ${objet} en paquets de ${d}. Combien de paquets ?`, reponse: q, candidats: [q + 1, q - 1, d, q + 2],
    };
  },
  // La famille de nombres : la multiplication est donnée
  famille(r, etat, prec) {
    const [t, d, q] = choisir(faits(r.diviseurs, r.max), etat, prec);
    return { cle: cle(t, d), indice: `${d} × ${q} = ${t}`, texte: `${t} ÷ ${d}`, reponse: q, candidats: [q + 1, q - 1, d, t - d] };
  },
  calcul: (r, etat, prec) => calcul(faits(r.diviseurs, r.max), etat, prec),
  // La division avec un reste : « 17 ÷ 5 » → « 3 reste 2 »
  reste(r, etat, prec) {
    const liste = [];
    for (const d of r.diviseurs.filter((x) => x > 1)) for (let q = 1; q <= r.max; q++) for (let k = 1; k < d; k++) liste.push([d * q + k, d, q]);
    const [t, d, q] = choisir(liste, etat, prec);
    const k = t - d * q;
    const ecrit = (a, b) => `${a} reste ${b}`;
    // les pièges : un reste trop grand (2 reste 7), le quotient d'à côté, le reste d'à côté, les deux inversés
    const faux = melanger([...new Set([ecrit(q - 1, k + d), ecrit(q + 1, k), ecrit(q, k + 1 < d ? k + 1 : k - 1), ecrit(k, q), ecrit(q + 1, k + 1)])]
      .filter((x) => x !== ecrit(q, k) && !x.startsWith('0 ') && !x.endsWith(' 0')));
    for (let n = 2; faux.length < 3; n++) for (const x of [ecrit(q + n, k), ecrit(q, k + n)]) if (!faux.includes(x)) faux.push(x); // petits nombres : on complète
    return {
      cle: cle(t, d), texte: `${t} ÷ ${d}`, reponse: ecrit(q, k), choix: melanger([ecrit(q, k), ...faux.slice(0, 3)]),
      aide: `${d} × ? = ${t - k}`, explication: `${t} ÷ ${d} = ${q}, reste ${k}, car ${d} × ${q} = ${d * q} et ${d * q} + ${k} = ${t}`,
    };
  },
};

function calcul(liste, etat, prec) {
  const [t, d, q] = choisir(liste, etat, prec);
  return { cle: cle(t, d), texte: `${t} ÷ ${d}`, reponse: q, candidats: [q + 1, q - 1, q + 2, d] };
}


export default {
  id: 'divisions',
  nom: D.titre,
  description: sansPoint(D.description),
  couleur: '#3dc5ff',
  niveaux: D.niveaux,
  generer(niveau, etat, precedente) {
    const fiches = reglageDu(D.reglages, niveau);
    const r = fiches[Math.floor(Math.random() * fiches.length)];
    const { candidats, reponse, ...q } = EXERCICES[r.exercice](r, etat, precedente);
    if (q.choix) return { ...q, reponse, aideVisible: false }; // la division avec reste a déjà ses choix et son explication
    const [t, d] = q.cle.slice(2).split('/').map(Number);
    return {
      ...q,
      reponse: String(reponse),
      choix: choixAvec(reponse, candidats),
      // La multiplication correspondante, sans donner la réponse : affichée d'office aux niveaux 1 et 2,
      // puis à la demande avec le bouton 💡.
      aide: q.indice ? null : `${d} × ? = ${t}`,
      aideVisible: niveau <= 2,
      explication: `${t} ÷ ${d} = ${reponse}, car ${d} × ${reponse} = ${t}`,
    };
  },
};
