// Progression continue : un niveau par matière, qui monte avec les bonnes réponses,
// et la tirelire qui se remplit à chaque bonne réponse.
import { moisCourant, jourCle } from './etat.svelte.js';

export const POINTS_NIVEAU = 10; // bonnes réponses (nettes) pour monter d'un niveau
export const ERREURS_DESCENTE = 3; // erreurs d'affilée pour redescendre

export function infoMatiere(etat, id) {
  const m = (etat.matieres[id] ??= {});
  m.niveau ??= 1;
  m.max ??= 1;
  m.barre ??= 0;
  m.ratesSuite ??= 0;
  // Démarrage rapide : actif seulement pour un atelier tout neuf (s'arrête à la première erreur)
  m.demarrage ??= m.niveau === 1 && m.max === 1 && m.barre === 0;
  m.serieDemarrage ??= 0;
  return m;
}

export const SAUT_DEMARRAGE = 7; // bonnes réponses d'affilée pour sauter un niveau au démarrage (3 faisait monter trop vite)
export const NIVEAUX_ALEATOIRE = 5; // Aléatoire a ses propres niveaux, comme un atelier

/**
 * Le niveau max d'un atelier : un cran au-dessus de son dernier niveau écrit (tout y est mélangé).
 * On ne monte pas plus haut, et ce niveau ne rapporte pas de bonus.
 */
export const niveauMax = (matiere) => (matiere?.id === 'aleatoire' ? NIVEAUX_ALEATOIRE : matiere?.niveaux ?? NIVEAUX_ALEATOIRE) + 1;

export function crediter(etat, centimes, motif) {
  const t = etat.tirelire;
  if (t.mois !== moisCourant()) { t.mois = moisCourant(); t.gagneMois = 0; }
  let montant = centimes;
  if (montant > 0) t.gagneMois += montant; // pas de plafond : juste pour le suivi du mois
  else montant = -Math.min(-montant, t.solde);
  if (montant === 0) return 0;
  t.solde += montant;
  // Les petits gains d'une même série sont regroupés en une seule ligne du journal.
  const dernier = t.journal[0];
  if (dernier && dernier.motif === motif && Date.now() - dernier.t < 30 * 60 * 1000 && Math.sign(dernier.montant) === Math.sign(montant)) {
    dernier.montant += montant;
    dernier.t = Date.now();
    return montant;
  }
  t.journal.unshift({ t: Date.now(), montant, motif });
  t.journal.length = Math.min(t.journal.length, 200);
  return montant;
}

/**
 * Mode chrono : le temps pour répondre se cale sur ses propres réponses dans cet atelier
 * (un peu plus que sa moyenne récente), pour qu'il progresse contre lui-même sans que ce soit impossible.
 * Sans historique, on part du temps de base de l'atelier.
 */
export function tempsChrono(etat, matiere) {
  const moyenne = etat.matieres[matiere.id]?.tempsMoyen;
  const base = matiere.temps ?? 10;
  return Math.round(Math.min(45, Math.max(6, (moyenne ?? base) * 1.6)));
}

/**
 * Enregistre une réponse et ce qu'elle rapporte. Une seule règle pour tous les ateliers :
 * bonne réponse = gain (le double en mode chrono), erreur ou temps écoulé = rien. Jamais de perte.
 * Deuxième chance (rattrapage) : juste au second essai = la moitié du gain, et le niveau ne bouge pas (ni point, ni erreur) ;
 * la question reste comptée comme ratée, pour revenir plus souvent.
 * Chaque nouveau niveau rapporte un bonus. Renvoie { gain, montee?: { niveau, nouveau, bonus }, descente?: { niveau } }.
 */
export function enregistrerReponse(etat, matiere, { cle, juste, temps }, { aleatoire = false, chrono = false, rattrapage = false } = {}) {
  const r = etat.reglages;

  if (rattrapage && juste) {
    etat.stats.reponses++;
    noterFait(etat, cle, false);
    ((etat.jours[jourCle()] ??= {})[matiere.id] ??= { ok: 0, ko: 0 }).ko++;
    return { gain: r.gainReponse ? crediter(etat, Math.round(r.gainReponse / 2), `${matiere.nom} · 2e essai`) : 0 };
  }

  etat.stats.reponses++;
  if (juste) etat.stats.bonnes++;
  noterFait(etat, cle, juste);
  const jour = ((etat.jours[jourCle()] ??= {})[matiere.id] ??= { ok: 0, ko: 0 });
  if (juste) jour.ok++; else jour.ko++;

  // Sa vitesse habituelle dans cet atelier (bonnes réponses seulement), pour régler le chrono
  const m = infoMatiere(etat, matiere.id);
  if (juste && temps > 0) m.tempsMoyen = Math.round(((m.tempsMoyen ?? temps) * 0.8 + Math.min(temps, 60) * 0.2) * 10) / 10;

  // L'argent
  const gain = juste && r.gainReponse ? crediter(etat, r.gainReponse * (chrono ? 2 : 1), chrono ? `${matiere.nom} · chrono` : matiere.nom) : 0;

  // Le niveau. En Aléatoire : l'atelier progresse en silence (la difficulté monte, sans bonus),
  // et c'est la barre propre à l'Aléatoire qui donne la fête et le bonus.
  if (aleatoire) {
    avancer(etat, infoMatiere(etat, matiere.id), juste, null, { max: niveauMax(matiere) });
    return { gain, ...avancer(etat, infoMatiere(etat, 'aleatoire'), juste, 'Aléatoire', { saut: false, max: niveauMax({ id: 'aleatoire' }) }) };
  }
  return { gain, ...avancer(etat, infoMatiere(etat, matiere.id), juste, matiere.nom, { max: niveauMax(matiere) }) };
}

/**
 * Fait avancer ou reculer une barre de niveau. nom = null : en silence (pas de bonus).
 * max : le niveau max de l'atelier ; une fois atteint, la barre se remplit et repart, sans nouveau niveau.
 */
function avancer(etat, m, juste, nom, { saut = true, max = 99 } = {}) {
  const r = etat.reglages;
  if (m.niveau > max) m.niveau = max; // ancien profil : niveaux d'avant la refonte

  // Démarrage rapide : au début d'un atelier, 7 bonnes réponses d'affilée (SAUT_DEMARRAGE) font sauter un niveau
  // (sans bonus, comme les flèches), jusqu'à la première erreur. Le vrai niveau est trouvé en une minute.
  if (saut && m.demarrage) {
    if (!juste || m.niveau >= max) {
      m.demarrage = false;
    } else if (++m.serieDemarrage >= SAUT_DEMARRAGE) {
      m.serieDemarrage = 0;
      m.niveau++;
      m.max = Math.max(m.max, m.niveau);
      m.barre = 0;
      m.ratesSuite = 0;
      return { saut: { niveau: m.niveau } };
    }
  }

  if (juste) {
    m.ratesSuite = 0;
    m.barre++;
    if (m.barre < POINTS_NIVEAU) return {};
    if (m.niveau >= max) { m.barre = 0; return { serie: true }; } // niveau max : la barre repart, sans bonus
    m.niveau++;
    m.barre = 0;
    const nouveau = m.niveau > m.max;
    if (nouveau) m.max = m.niveau;
    // Bonus de niveau : seulement la première fois (redescendre puis remonter ne rapporte rien).
    const bonus = nom && nouveau && r.gainNiveau ? crediter(etat, r.gainNiveau, `${nom} · niveau ${m.niveau}`) : 0;
    return { montee: { niveau: m.niveau, nouveau, bonus } };
  }
  m.barre = Math.max(0, m.barre - 1);
  m.ratesSuite++;
  if (m.ratesSuite >= ERREURS_DESCENTE && m.niveau > 1) {
    m.niveau--;
    m.barre = Math.floor(POINTS_NIVEAU / 2);
    m.ratesSuite = 0;
    return { descente: { niveau: m.niveau } };
  }
  return {};
}

/** Encaisser : l'enfant sort de l'argent de sa tirelire (tout, ou le montant choisi), validé par un parent. */
export function encaisser(etat, voulu = etat.tirelire.solde) {
  const montant = Math.min(etat.tirelire.solde, Math.max(0, Math.round(voulu)));
  if (montant <= 0) return 0;
  etat.encaissements.unshift({ t: Date.now(), montant });
  etat.tirelire.journal.unshift({ t: Date.now(), montant: -montant, motif: 'Encaissé' });
  etat.tirelire.solde -= montant;
  return montant;
}

/**
 * Choisir son niveau (au départ ou en touchant « Niveau »). Sans gain ni perte :
 * les niveaux sautés comptent comme déjà atteints, le bonus ne vient qu'en montant en jouant.
 */
export function fixerNiveau(etat, matiereId, niveau, max = 99) {
  const m = infoMatiere(etat, matiereId);
  m.niveau = Math.max(1, Math.min(max, niveau));
  m.demarrage = false; // choisi à la main : plus de démarrage rapide
  m.max = Math.max(m.max ?? 1, m.niveau);
  m.barre = 0;
  m.ratesSuite = 0;
}

export function noterFait(etat, cle, juste) {
  const f = (etat.faits[cle] ??= { ok: 0, ko: 0 });
  if (juste) f.ok++; else f.ko++;
}

/** Poids d'un fait : plus il a été raté (et pas encore rattrapé), plus il revient. */
export function poids(etat, cle) {
  const f = etat.faits[cle];
  if (!f) return 2;
  return 1 + Math.max(0, f.ko * 3 - f.ok);
}

/** Tire un élément au hasard pondéré, en évitant la clé `eviter`. */
export function tirer1(elements, poidsDe, cleDe, eviter) {
  const liste = elements.length > 1 ? elements.filter((e) => cleDe(e) !== eviter) : elements;
  const somme = liste.reduce((s, e) => s + poidsDe(e), 0);
  let r = Math.random() * somme;
  for (const e of liste) if ((r -= poidsDe(e)) <= 0) return e;
  return liste[liste.length - 1];
}

export function melanger(liste) {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

export const hasard = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

/** 4 choix : la bonne réponse et 3 leurres distincts et positifs. */
export function choixAvec(juste, candidats) {
  const leurres = melanger([...new Set(candidats)].filter((n) => n > 0 && n !== juste));
  let ecart = 1;
  while (leurres.length < 3) {
    for (const n of [juste + ecart, juste - ecart]) if (n > 0 && !leurres.includes(n) && leurres.length < 3) leurres.push(n);
    ecart++;
  }
  return melanger([juste, ...leurres.slice(0, 3)]).map(String);
}

export function pointsFaibles(etat, n = 10) {
  return Object.entries(etat.faits)
    .map(([cle, f]) => ({ cle, ...f, poids: f.ko * 3 - f.ok }))
    .filter((f) => f.poids > 0)
    .sort((a, b) => b.poids - a.poids)
    .slice(0, n);
}
