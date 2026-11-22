// État de l'app : la progression de chaque joueur (anonyme : un pseudo, un avatar), enregistrée seulement
// dans ce navigateur. Pas de compte, pas de serveur : rien ne quitte l'appareil, sauf la copie de sauvegarde
// que les parents enregistrent eux-mêmes. Plusieurs enfants peuvent jouer sur le même appareil, chacun son joueur.
// (La version avec comptes et synchronisation par serveur est gardée dans la branche git « comptes ».)

const CLE_JOUEURS = 'gaby-joueurs'; // la liste : [{ id, pseudo, avatar }]
const CLE_ACTIF = 'gaby-joueur'; // le joueur en cours sur cet appareil
const CLE_REGLAGES = 'gaby-reglages'; // réglages des parents (code, montants) : les mêmes pour tous les joueurs de l'appareil
const CLE_SAUVEGARDE = 'gaby-sauvegarde'; // date de la dernière copie de sauvegarde
const cleEtat = (id) => `gaby-etat-${id}`;
const ANCIENNE_CLE = 'gaby-etat'; // avant le 2026-11-22 : un seul joueur, synchronisé avec le serveur

/** Le pseudo du joueur (aucun nom réel) */
export const pseudo = () => app.etat.profil?.pseudo || 'toi';

export function moisCourant() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function etatInitial() {
  return {
    version: 1,
    rev: 0,
    tirelire: { solde: 0, mois: moisCourant(), gagneMois: 0, journal: [] },
    reglages: {
      pinHash: null,
      // Une seule règle : bonne réponse = gain, erreur = rien. Jamais de perte. Tous les montants sont en centimes.
      gainReponse: 3, // par bonne réponse (le double en mode chrono)
      gainNiveau: 50, // nouveau niveau atteint (pour la première fois)
      gainLecture: 50, // lecture validée : toutes les questions justes (le double si lue dans le temps en mode chrono)
    },
    profil: { pseudo: '', avatar: 'voxel-01' }, // anonyme : aucun nom réel, aucune photo
    univers: 'espace', // 'espace' | 'prehistoire' | 'course'
    lectures: {}, // lectures validées : { titre: { valide: true, t, chrono } }
    encaissements: [], // { t, montant } : ce que l'enfant a sorti de sa tirelire, validé par un parent
    matieres: {},
    faits: {},
    jours: {}, // { '2026-11-15': { tables: { ok, ko } } }
    stats: { reponses: 0, bonnes: 0 },
  };
}

// Complète un état ancien ou venu du serveur avec les champs manquants.
function completer(etat) {
  const base = etatInitial();
  if (!etat || typeof etat !== 'object') return base;
  const { animation, objectif, ...reste } = etat; // les anciennes animations et le cadeau à gagner n'existent plus
  return {
    ...base,
    ...reste,
    tirelire: { ...base.tirelire, ...etat.tirelire },
    reglages: { ...base.reglages, ...etat.reglages },
    profil: { ...base.profil, ...etat.profil },
    lectures: { ...base.lectures, ...etat.lectures },
    stats: { ...base.stats, ...etat.stats },
  };
}

function lire(cle) {
  try { return localStorage.getItem(cle); } catch { return null; }
}
function ecrire(cle, valeur) {
  try {
    if (valeur === null) localStorage.removeItem(cle);
    else localStorage.setItem(cle, valeur);
  } catch { /* stockage indisponible : on continue en mémoire */ }
}

const lireJson = (cle) => { try { return JSON.parse(lire(cle)); } catch { return null; } };

// Ancienne version (un seul joueur) : sa progression devient le premier joueur, rien n'est perdu.
function migrer() {
  if (lire(CLE_JOUEURS) || !lire(ANCIENNE_CLE)) return;
  const etat = completer(lireJson(ANCIENNE_CLE));
  const id = nouvelId();
  ecrire(CLE_REGLAGES, JSON.stringify(etat.reglages));
  ecrireEtat(id, etat);
  ecrire(CLE_JOUEURS, JSON.stringify([{ id, pseudo: etat.profil.pseudo, avatar: etat.profil.avatar }]));
  ecrire(CLE_ACTIF, id);
  for (const cle of [ANCIENNE_CLE, 'gaby-code', 'gaby-a-envoyer', 'gaby-accueil', 'gaby-epoque', 'gaby-photo']) ecrire(cle, null);
}

const nouvelId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const reglagesCommuns = () => lireJson(CLE_REGLAGES);
function ecrireEtat(id, etat) {
  const { reglages, ...reste } = etat; // les réglages sont communs à l'appareil
  ecrire(cleEtat(id), JSON.stringify(reste));
}
function chargerEtat(id) {
  const etat = completer(lireJson(cleEtat(id)));
  etat.reglages = { ...etat.reglages, ...reglagesCommuns() };
  return etat;
}

migrer();
const joueursEnregistres = () => (Array.isArray(lireJson(CLE_JOUEURS)) ? lireJson(CLE_JOUEURS) : []);
const depart = (() => {
  const liste = joueursEnregistres();
  // Un seul joueur : on joue tout de suite. Plusieurs : l'app demande « Qui joue ? » à chaque ouverture.
  return liste.length === 1 ? liste[0].id : null;
})();

export const app = $state({
  joueurs: joueursEnregistres(),
  joueur: depart, // id du joueur en cours, ou null : écran « Qui joue ? » (ou création du premier joueur)
  etat: depart ? chargerEtat(depart) : etatInitial(),
  sauvegarde: Number(lire(CLE_SAUVEGARDE)) || null,
});

/** À appeler après chaque modification de app.etat. */
export function sauver() {
  if (!app.joueur) return;
  ecrireEtat(app.joueur, $state.snapshot(app.etat));
  ecrire(CLE_REGLAGES, JSON.stringify($state.snapshot(app.etat.reglages)));
  const { pseudo, avatar } = app.etat.profil;
  app.joueurs = app.joueurs.map((j) => (j.id === app.joueur ? { id: j.id, pseudo, avatar } : j));
  ecrire(CLE_JOUEURS, JSON.stringify(app.joueurs));
}

export function choisirJoueur(id) {
  app.etat = chargerEtat(id);
  app.joueur = id;
  ecrire(CLE_ACTIF, id);
}

/** Retour à l'écran « Qui joue ? » */
export function changerJoueur() {
  app.joueur = null;
  ecrire(CLE_ACTIF, null);
}

export function creerJoueur(pseudo, avatar) {
  const id = nouvelId();
  const etat = etatInitial();
  etat.profil = { pseudo: pseudo.trim().slice(0, 20), avatar };
  ecrireEtat(id, etat);
  app.joueurs = [...app.joueurs, { id, pseudo: etat.profil.pseudo, avatar }];
  ecrire(CLE_JOUEURS, JSON.stringify(app.joueurs));
  choisirJoueur(id);
}

/** Le pseudo est-il déjà celui d'un autre joueur de cet appareil ? (sans compter majuscules, accents, espaces) */
const clePseudo = (p) => p.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
export const pseudoPris = (pseudo, sauf = null) =>
  app.joueurs.some((j) => j.id !== sauf && clePseudo(j.pseudo) === clePseudo(pseudo));

/** Supprimer le joueur en cours et toute sa progression (sur cet appareil). */
export function supprimerJoueur() {
  const id = app.joueur;
  ecrire(cleEtat(id), null);
  app.joueurs = app.joueurs.filter((j) => j.id !== id);
  ecrire(CLE_JOUEURS, JSON.stringify(app.joueurs));
  if (app.joueurs.length === 1) choisirJoueur(app.joueurs[0].id);
  else changerJoueur();
}

/** Mode dev : tout effacer sur cet appareil (tous les joueurs et les réglages). */
export function toutEffacer() {
  for (const j of app.joueurs) ecrire(cleEtat(j.id), null);
  for (const cle of [CLE_JOUEURS, CLE_ACTIF, CLE_REGLAGES, CLE_SAUVEGARDE]) ecrire(cle, null);
  app.joueurs = [];
  app.joueur = null;
  app.etat = etatInitial();
}

// --- Copie de sauvegarde : un fichier avec tous les joueurs et les réglages, que les parents gardent
// (pour changer d'appareil, ou si le navigateur efface ses données).

export function copieDeSauvegarde() {
  sauver();
  return {
    app: 'gaby',
    version: 1,
    date: new Date().toISOString(),
    reglages: reglagesCommuns() ?? app.etat.reglages,
    joueurs: app.joueurs.map((j) => ({ id: j.id, etat: lireJson(cleEtat(j.id)) })),
  };
}
export function sauvegardeFaite() {
  app.sauvegarde = Date.now();
  ecrire(CLE_SAUVEGARDE, String(app.sauvegarde));
}

/** Recharge une copie de sauvegarde. Un joueur déjà présent (même id) est remplacé par sa copie. Renvoie le nombre de joueurs repris, ou null. */
export function restaurer(texte) {
  let copie;
  try { copie = JSON.parse(texte); } catch { return null; }
  if (copie?.app !== 'gaby' || !Array.isArray(copie.joueurs)) return null;
  let n = 0;
  for (const { id, etat } of copie.joueurs) {
    if (typeof id !== 'string' || !/^[a-z0-9]{4,20}$/.test(id) || !etat) continue;
    const propre = completer(etat);
    ecrireEtat(id, propre);
    const fiche = { id, pseudo: propre.profil.pseudo, avatar: propre.profil.avatar };
    app.joueurs = app.joueurs.some((j) => j.id === id) ? app.joueurs.map((j) => (j.id === id ? fiche : j)) : [...app.joueurs, fiche];
    n++;
  }
  if (!n) return null;
  // Le code parent de la copie n'est repris que si cet appareil n'en a pas encore.
  if (copie.reglages && !reglagesCommuns()?.pinHash) ecrire(CLE_REGLAGES, JSON.stringify(copie.reglages));
  ecrire(CLE_JOUEURS, JSON.stringify(app.joueurs));
  if (app.joueur) choisirJoueur(app.joueur);
  else if (app.joueurs.length === 1) choisirJoueur(app.joueurs[0].id);
  return n;
}

// Petit hachage pour le code parent (suffisant face à un enfant de 9 ans, pas un vrai secret).
export function hacher(texte) {
  let h = 2166136261;
  for (const c of `gaby:${texte}`) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function euros(centimes) {
  return (centimes / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

export function jourCle(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Jours d'affilée avec au moins une réponse (aujourd'hui ou hier compris). */
export function serieJours(etat) {
  const d = new Date();
  if (!etat.jours[jourCle(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (etat.jours[jourCle(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
