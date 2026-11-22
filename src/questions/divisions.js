// Divisions : on part du sens (partager, faire des paquets) avant de calculer. Réglages : contenu/divisions.md
import C from 'virtual:contenu';
import { reglageDu, sansPoint } from './outils.js';
import { poids, tirer1, choixAvec, hasard } from '../lib/progression.js';

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

// Les quatre sortes d'exercices (réglages de chaque niveau : contenu/divisions.md)
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
