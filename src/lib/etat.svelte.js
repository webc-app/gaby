// État de l'app : la progression du joueur (anonyme : un pseudo, un avatar), enregistrée dans le navigateur
// et synchronisée avec le serveur grâce à son code personnel.

const CLE_ETAT = 'gaby-etat';
const CLE_CODE = 'gaby-code';
const CLE_A_ENVOYER = 'gaby-a-envoyer';
const CLE_ACCUEIL = 'gaby-accueil'; // l'écran de bienvenue a été passé sur CET appareil

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

function chargerLocal() {
  try { return completer(JSON.parse(lire(CLE_ETAT))); } catch { return etatInitial(); }
}

export const app = $state({
  etat: chargerLocal(),
  code: lire(CLE_CODE),
  accueilVu: lire(CLE_ACCUEIL) === '1',
  synchro: 'attente', // 'ok' | 'envoi' | 'hors-ligne' | 'attente'
});

let aEnvoyer = lire(CLE_A_ENVOYER) === '1';
let minuterie = null;

/** À appeler après chaque modification de app.etat. */
export function sauver() {
  ecrire(CLE_ETAT, JSON.stringify(app.etat));
  aEnvoyer = true;
  ecrire(CLE_A_ENVOYER, '1');
  clearTimeout(minuterie);
  minuterie = setTimeout(envoyer, 3000);
}

function adopter(etatServeur) {
  app.etat = completer(etatServeur);
  ecrire(CLE_ETAT, JSON.stringify(app.etat));
  aEnvoyer = false;
  ecrire(CLE_A_ENVOYER, null);
}

const progres = (e) => e?.stats?.reponses ?? 0;

/** L'écran de bienvenue est passé une fois par appareil, et de nouveau après une remise à zéro. */
export function accueilFait() {
  app.accueilVu = true;
  ecrire(CLE_ACCUEIL, '1');
}
export function oublierAccueil() {
  app.accueilVu = false;
  ecrire(CLE_ACCUEIL, null);
}

/** Oublie tout sur cet appareil (code compris) : on repart de l'écran d'entrée. */
export function oublierAppareil() {
  for (const cle of [CLE_ETAT, CLE_CODE, CLE_A_ENVOYER, CLE_ACCUEIL, 'gaby-epoque', 'gaby-photo']) ecrire(cle, null);
  aEnvoyer = false;
  app.etat = etatInitial();
  app.accueilVu = false;
  app.code = null;
}

/** Le profil n'existe plus sur le serveur (supprimé depuis un autre appareil, ou remis à zéro). */
function profilDisparu() {
  oublierAppareil();
}

async function appel(methode, corps, code = app.code, parametres = '') {
  const reponse = await fetch(`./api.php${parametres}`, {
    method: methode,
    headers: { 'X-Gaby-Code': code ?? '', 'Content-Type': 'application/json' },
    body: corps ? JSON.stringify(corps) : undefined,
    cache: 'no-store',
  });
  const donnees = await reponse.json().catch(() => ({}));
  return { statut: reponse.status, donnees };
}

export async function envoyer(forcer = false) {
  if (!app.code || (!aEnvoyer && !forcer)) return;
  app.synchro = 'envoi';
  try {
    const { statut, donnees } = await appel('POST', {
      etat: $state.snapshot(app.etat),
      revBase: app.etat.rev,
      forcer,
    });
    if (statut === 200) {
      app.etat.rev = donnees.rev;
      ecrire(CLE_ETAT, JSON.stringify(app.etat));
      aEnvoyer = false;
      ecrire(CLE_A_ENVOYER, null);
      app.synchro = 'ok';
    } else if (statut === 401) {
      profilDisparu();
    } else if (statut === 409) {
      // Un autre appareil a enregistré entre-temps : on garde la version la plus avancée.
      if (progres(app.etat) > progres(donnees.etat)) {
        app.etat.rev = donnees.etat.rev;
        await envoyer(true);
      } else {
        adopter(donnees.etat);
        app.synchro = 'ok';
      }
    } else {
      app.synchro = 'hors-ligne';
    }
  } catch {
    app.synchro = 'hors-ligne';
  }
}

/** Récupère la version du serveur si elle est plus récente. */
export async function tirer() {
  if (!app.code) return;
  try {
    const { statut, donnees } = await appel('GET');
    if (statut === 401) { profilDisparu(); return; }
    if (statut !== 200) { app.synchro = 'hors-ligne'; return; }
    const serveur = donnees.etat;
    if (!serveur) { await envoyer(true); return; }
    if (serveur.rev > app.etat.rev) {
      if (aEnvoyer && progres(app.etat) > progres(serveur)) {
        app.etat.rev = serveur.rev;
        await envoyer(true);
      } else {
        adopter(serveur);
      }
    } else if (aEnvoyer) {
      await envoyer();
    }
    app.synchro = 'ok';
  } catch {
    app.synchro = 'hors-ligne';
  }
}

/** Connexion d'un appareil avec le code personnel du joueur. Renvoie 'ok', 'code', 'serveur' ou 'reseau'. */
export async function connecter(saisie) {
  const code = saisie.trim().toUpperCase();
  try {
    const { statut, donnees } = await appel('GET', undefined, code);
    if (statut !== 200) return statut === 401 ? 'code' : 'serveur';
    // Un nouvel appareil prend simplement la progression du serveur (ou un état neuf avec le profil).
    const etat = donnees.etat ?? etatInitial();
    if (donnees.profil) etat.profil = { ...etat.profil, ...donnees.profil };
    adopter(etat);
    ecrire(CLE_CODE, code);
    app.code = code; // en dernier : le jeu s'affiche avec la bonne progression
    if (!donnees.etat) await envoyer(true);
    app.synchro = 'ok';
    return 'ok';
  } catch {
    return 'reseau';
  }
}

/** Créer un profil (10 joueurs au plus, pseudo pas déjà pris). Renvoie { resultat, code } (code personnel à noter). */
export async function creerProfil(nomJoueur, avatar) {
  try {
    const { statut, donnees } = await appel('POST', { pseudo: nomJoueur, avatar }, '', '?action=creer');
    if (statut !== 200) return { resultat: { 403: 'complet', 409: 'pris', 400: 'pseudo' }[statut] ?? 'serveur' };
    const resultat = await connecter(donnees.code);
    return { resultat, code: donnees.code };
  } catch {
    return { resultat: 'reseau' };
  }
}

/** Le pseudo est-il libre (pas celui d'un autre joueur) ? true, false, ou null sans connexion. */
export async function pseudoLibre(pseudo) {
  try {
    const { statut, donnees } = await appel('POST', { pseudo }, app.code, '?action=pseudo');
    return statut === 200 ? donnees.libre === true : null;
  } catch {
    return null;
  }
}

/** Supprimer le profil sur le serveur (fichier et copies de secours), puis oublier cet appareil. */
export async function supprimerProfil(action = 'supprimer') {
  try {
    const { statut } = await appel('POST', {}, app.code, `?action=${action}`);
    if (statut !== 200 && statut !== 401) return false;
  } catch {
    return false;
  }
  oublierAppareil();
  return true;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => tirer());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tirer();
  });
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
