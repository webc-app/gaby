// Lecture des fichiers de contenu (dossier contenu/, format décrit dans contenu/LISEZMOI.md).
// Aucune dépendance : ce module sert à l'app (au moment du build) et au script de vérification.
//
// Un fichier, c'est :
//   # Titre                         → le nom de l'atelier
//   une phrase                      → sa description
//   ## Niveau 2 · Verbes            → le niveau des fiches qui suivent (le texte après « · » est libre)
//   ### Animaux                     → un groupe (sert par exemple à choisir des mauvaises réponses voisines)
//   Clé : valeur                    → une ligne de fiche ; une ligne vide termine la fiche
//   - un élément                    → une fiche d'une seule ligne (listes de mots)
//   > note                          → ignorée (commentaire pour soi)

/** Clé de champ normalisée : « Mauvaise réponse » → « mauvaise reponse » */
export const cleChamp = (texte) => texte.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');

const RE_NIVEAU = /^niveau\s+(\d+)\b\s*[·:\-–—]?\s*(.*)$/i;

/**
 * Lit un fichier de fiches. Renvoie { titre, description, niveaux: { 1: 'Verbes' }, fiches, erreurs }.
 * Chaque fiche : { niveau, groupe, champs: { cle: [valeurs] }, element?, ligne }.
 */
export function lireFiches(texte, fichier = '', { libre = false } = {}) {
  const erreurs = [];
  const fiches = [];
  const niveaux = {};
  let titre = '';
  const description = [];
  const pile = []; // titres en cours, par profondeur (## = 2, ### = 3, …)
  let fiche = null;

  const contexte = () => {
    let niveau = null;
    const groupes = [];
    for (const t of pile) {
      if (!t) continue;
      const m = t.match(RE_NIVEAU);
      if (m) niveau = Number(m[1]);
      else groupes.push(t);
    }
    return { niveau, groupe: groupes.join(' / ') || null };
  };
  const fermer = () => { if (fiche) { fiches.push(fiche); fiche = null; } };

  texte.split(/\r?\n/).forEach((brute, i) => {
    const ligne = i + 1;
    const l = brute.trim();
    if (!l) { fermer(); return; }
    if (l.startsWith('>')) return; // note

    const titreMd = l.match(/^(#{1,6})\s+(.*)$/);
    if (titreMd) {
      fermer();
      const profondeur = titreMd[1].length;
      const t = titreMd[2].trim();
      if (profondeur === 1) { titre = t; return; }
      pile.length = profondeur; // oublie les titres plus profonds
      pile[profondeur] = t;
      const m = t.match(RE_NIVEAU);
      if (m) niveaux[Number(m[1])] = m[2] || niveaux[Number(m[1])] || '';
      return;
    }

    const { niveau, groupe } = contexte();
    if (l.startsWith('- ')) {
      fermer();
      fiches.push({ niveau, groupe, champs: {}, element: l.slice(2).trim(), ligne });
      return;
    }
    const champ = l.match(/^([^:：]{1,40}?)\s*:\s*(.*)$/);
    if (champ && (libre || fiche || niveau !== null || pile.some(Boolean))) {
      fiche ??= { niveau, groupe, champs: {}, ligne };
      const cle = cleChamp(champ[1]);
      (fiche.champs[cle] ??= []).push(champ[2].trim());
      return;
    }
    if (!pile.some(Boolean) && !fiche) { description.push(l); return; } // texte sous le titre
    erreurs.push({ fichier, ligne, message: `ligne non comprise : « ${l.slice(0, 60)} » (attendu « Clé : valeur » ou « - élément »)` });
  });
  fermer();
  return { titre, description: description.join(' '), niveaux, fiches, erreurs };
}

/**
 * Lit une histoire (contenu/lecture/*.md) : titre, « Niveau : 2 », « Auteur : … » et « Poésie : oui » (facultatifs),
 * paragraphes, puis « ## Questions » et les fiches. Dans une poésie, chaque ligne du fichier est un vers (gardé à la ligne).
 */
export function lireHistoire(texte, fichier = '') {
  const erreurs = [];
  const lignes = texte.split(/\r?\n/);
  const debutQuestions = lignes.findIndex((l) => /^##\s+questions\b/i.test(l.trim()));
  const corps = debutQuestions === -1 ? lignes : lignes.slice(0, debutQuestions);
  let titre = '';
  let niveau = null;
  let auteur = '';
  let poesie = false;
  const paragraphes = [];
  let courant = [];
  const finParagraphe = () => { if (courant.length) { paragraphes.push(courant); courant = []; } };
  corps.forEach((brute, i) => {
    const l = brute.trim();
    if (!l) { finParagraphe(); return; }
    if (l.startsWith('>')) return;
    const t = l.match(/^#\s+(.*)$/);
    if (t) { titre = t[1].trim(); return; }
    const n = l.match(/^niveau\s*:\s*(\d+)$/i);
    if (n) { niveau = Number(n[1]); return; }
    const a = !paragraphes.length && !courant.length && l.match(/^auteur\s*:\s*(.+)$/i);
    if (a) { auteur = a[1].trim(); return; }
    const po = !paragraphes.length && !courant.length && l.match(/^po[ée]sie\s*:\s*(oui|non)$/i);
    if (po) { poesie = po[1].toLowerCase() === 'oui'; return; }
    if (l.startsWith('#')) { erreurs.push({ fichier, ligne: i + 1, message: 'titre inattendu dans le texte (seuls « # Titre » et « ## Questions » sont permis)' }); return; }
    courant.push(l);
  });
  finParagraphe();
  let questions = [];
  if (debutQuestions !== -1) {
    const lu = lireFiches(lignes.slice(debutQuestions + 1).join('\n'), fichier, { libre: true });
    // les numéros de ligne repartent du début du fichier
    questions = lu.fiches.map((f) => ({ ...f, ligne: f.ligne + debutQuestions + 1 }));
    erreurs.push(...lu.erreurs.map((e) => ({ ...e, ligne: e.ligne + debutQuestions + 1 })));
  }
  return { titre, niveau, auteur, poesie, paragraphes: paragraphes.map((lignes) => lignes.join(poesie ? '\n' : ' ')), questions, erreurs };
}

/** « 2, 5, 10 » → [2, 5, 10] ; « 7 à 11 » → [7, 8, 9, 10, 11] ; « 0 à 55 de 5 en 5 » → [0, 5, …, 55] */
export function lireNombres(texte) {
  const resultat = [];
  for (const morceau of String(texte).split(',')) {
    const m = morceau.trim().match(/^(\d+)\s*(?:à|a|-)\s*(\d+)(?:\s*de\s*(\d+)\s*en\s*\d+)?$/i);
    if (m) {
      const [de, a, pas] = [Number(m[1]), Number(m[2]), Number(m[3] ?? 1)];
      for (let x = de; x <= a; x += pas) resultat.push(x);
    } else if (/^\d+$/.test(morceau.trim())) {
      resultat.push(Number(morceau.trim()));
    } else if (morceau.trim()) {
      return null;
    }
  }
  return resultat;
}
