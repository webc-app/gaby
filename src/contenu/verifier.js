// Vérifie le contenu (fiches lues par lire.js) et le transforme en données prêtes pour les ateliers.
// Chaque erreur dit le fichier, la ligne et quoi corriger. Aucune dépendance.
import { lireFiches, lireHistoire, lireNombres } from './lire.js';
import { nomFichier } from '../lib/voix.js';
import { TEMPS, FICHIERS, PERSONNES } from '../lib/temps.js';

// Les images que l'app sait dessiner (composants/Visuel.svelte)
export const IMAGES = {
  piece: ['pion', 'tour', 'fou', 'cavalier', 'dame', 'roi'],
  planete: ['soleil', 'mercure', 'venus', 'terre', 'lune', 'mars', 'jupiter', 'saturne', 'uranus', 'neptune'],
  // les panneaux : les fichiers de src/panneaux/ (passés à verifierContenu), plus les feux, dessinés par l'app
  panneau: ['feu-rouge', 'feu-vert'],
};
const TYPES_IMAGE = { 'pièce': 'piece', piece: 'piece', 'planète': 'planete', planete: 'planete', panneau: 'panneau' };
export const EXERCICES_CALCUL = {
  'tables de 2 a 5': 'tables2a5', tables: 'tables', 'complements a 100 en dizaines': 'complement100dizaines',
  'complements a 100': 'complement100', '× 10': 'x10', 'x 10': 'x10', '× 1000': 'x1000', 'x 1000': 'x1000',
  'complements a 1000': 'complement1000', 'doubles et moities': 'double',
  'petites additions': 'add20', 'petites soustractions': 'sous20', 'complements a 10': 'complement10', 'avec des dizaines': 'dizaines',
  'additions a retenue': 'add100', 'soustractions a retenue': 'sous100', suites: 'suite', 'ajouter 9 ou 11': 'neuf11',
  fractions: 'fractions', decimaux: 'decimaux', '× 10 avec des decimaux': 'x10decimaux', 'x 10 avec des decimaux': 'x10decimaux',
};
const EXERCICES_DIVISION = ['partager', 'paquets', 'famille', 'calcul', 'reste'];
const MAX_NIVEAUX = 9;
// Les fichiers image (contenu/images/) : formats acceptés et poids maximal, pour que l'app reste rapide
export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'svg', 'webp'];
export const IMAGE_POIDS_MAX = 300 * 1024;
const LONGUEUR = { reponse: 45, question: 140 };

const sansAccent = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

/**
 * Lit et vérifie tous les fichiers. `fichiers` : { 'synonymes.md': texte, 'lecture/dragon.md': texte, … }.
 * `images` : les fichiers de contenu/images/ et leur poids en octets, { 'lion.jpg': 48213 }.
 * `drapeaux` : les codes des fichiers de src/drapeaux/, [ 'fr', 'gb-sct', … ] ; `panneaux` : les noms de ceux de src/panneaux/.
 * Renvoie { contenu, erreurs, imagesUtilisees, drapeauxUtilises } ; le contenu n'est utilisable que s'il n'y a aucune erreur.
 */
export function verifierContenu(fichiers, images = {}, drapeaux = [], panneaux = []) {
  const erreurs = [];
  const contenu = {};
  const imagesUtilisees = new Set();
  const drapeauxUtilises = new Set();
  // « Image : fichier lion.jpg » → 'lion.jpg' (après vérification), sinon null
  const outils = {
    images: { ...IMAGES, panneau: [...panneaux, ...IMAGES.panneau] }, // les images que l'app sait afficher
    fichierImage(valeur, f, err) {
      const m = String(valeur).match(/^fichier\s+(.+)$/i);
      if (!m) return null;
      const nom = m[1].trim();
      const ext = nom.split('.').pop().toLowerCase();
      if (!IMAGE_FORMATS.includes(ext)) { err(f.ligne, `image « ${nom} » : formats acceptés ${IMAGE_FORMATS.join(', ')}`); return null; }
      if (!(nom in images)) { err(f.ligne, `image « ${nom} » introuvable : le fichier doit être dans contenu/images/`); return null; }
      if (images[nom] > IMAGE_POIDS_MAX) { err(f.ligne, `image « ${nom} » trop lourde (${Math.round(images[nom] / 1024)} Ko, ${IMAGE_POIDS_MAX / 1024} Ko au plus) : la réduire`); return null; }
      imagesUtilisees.add(nom);
      return nom;
    },
    // « Drapeau : 🇫🇷 » (ou « fr ») → 'fr', le nom du fichier src/drapeaux/fr.svg (après vérification), sinon null
    drapeau(valeur, f, err) {
      const code = codeDrapeau(valeur);
      if (!code) { err(f.ligne, `drapeau « ${valeur} » : mettre l’emoji du drapeau (🇫🇷) ou le code du pays (fr)`); return null; }
      if (!drapeaux.includes(code)) { err(f.ligne, `drapeau « ${valeur} » introuvable : il n’y a pas de fichier src/drapeaux/${code}.svg`); return null; }
      drapeauxUtilises.add(code);
      return code;
    },
  };
  for (const [nom, texte] of Object.entries(fichiers)) {
    if (nom.startsWith('lecture/') || nom === 'LISEZMOI.md') continue;
    const id = nom.replace(/\.md$/, '');
    const lu = lireFiches(texte, nom);
    erreurs.push(...lu.erreurs);
    const atelier = ATELIERS[id];
    if (!atelier) { erreurs.push({ fichier: nom, ligne: 1, message: `atelier inconnu « ${id} » (fichiers attendus : ${Object.keys(ATELIERS).join(', ')})` }); continue; }
    const err = (ligne, message) => erreurs.push({ fichier: nom, ligne, message });
    const niveaux = verifierNiveaux(lu, err, atelier.horsNiveau);
    contenu[id] = { titre: lu.titre, description: lu.description, niveaux: niveaux.nombre, titresNiveaux: niveaux.titres, ...atelier(lu.fiches, err, outils) };
  }
  // Les histoires
  const textes = [];
  for (const [nom, texte] of Object.entries(fichiers)) {
    if (!nom.startsWith('lecture/')) continue;
    const h = lireHistoire(texte, nom);
    erreurs.push(...h.erreurs);
    const err = (ligne, message) => erreurs.push({ fichier: nom, ligne, message });
    if (!h.titre) err(1, 'il manque le titre (« # Titre » sur la première ligne)');
    if (!h.niveau) err(1, 'il manque le niveau (« Niveau : 2 » sous le titre)');
    if (!h.paragraphes.length) err(1, 'le texte de l’histoire est vide');
    if (h.questions.length !== 3) err(1, `il faut 3 questions (il y en a ${h.questions.length}), sous « ## Questions »`);
    const questions = h.questions.map((f) => {
      const c = champs(f, err, { question: 1, bonne: 1, mauvaise: 3 });
      return c && { q: c.question, reponse: c.bonne, faux: c.mauvaise };
    }).filter(Boolean);
    if (textes.some((t) => t.titre === h.titre)) err(1, `une autre histoire a déjà le titre « ${h.titre} »`);
    textes.push({ titre: h.titre, niveau: h.niveau, auteur: h.auteur, poesie: h.poesie, paragraphes: h.paragraphes, questions });
  }
  contenu.lecture = { textes: textes.sort((a, b) => a.niveau - b.niveau || a.titre.localeCompare(b.titre)) };
  return { contenu, erreurs, imagesUtilisees: [...imagesUtilisees], drapeauxUtilises: [...drapeauxUtilises] };
}

/** L'emoji d'un drapeau en code de pays : 🇫🇷 → 'fr', 🏴󠁧󠁢󠁳󠁣󠁴󠁿 (Écosse) → 'gb-sct' ; un code déjà écrit (fr, gb-sct) est gardé */
export function codeDrapeau(valeur) {
  const t = String(valeur).trim();
  if (/^[a-z]{2}(-[a-z]{2,3})?$/i.test(t)) return t.toLowerCase();
  const points = [...t].map((c) => c.codePointAt(0));
  if (points.length === 2 && points.every((p) => p >= 0x1f1e6 && p <= 0x1f1ff)) return points.map((p) => String.fromCharCode(p - 0x1f1e6 + 97)).join('');
  if (points[0] === 0x1f3f4 && points.at(-1) === 0xe007f) {
    const lettres = points.slice(1, -1).map((p) => String.fromCharCode(p - 0xe0000)).join('');
    if (/^[a-z]{5,6}$/.test(lettres)) return `${lettres.slice(0, 2)}-${lettres.slice(2)}`;
  }
  return null;
}

// ---------- Contrôles communs

function verifierNiveaux(lu, err, horsNiveau = () => false) {
  const fiches = lu.fiches.filter((f) => !horsNiveau(f));
  const presents = [...new Set(fiches.map((f) => f.niveau))];
  for (const f of fiches) if (f.niveau === null) err(f.ligne, 'cette fiche n’est sous aucun « ## Niveau N »');
  const nums = presents.filter((n) => n !== null).sort((a, b) => a - b);
  const nombre = nums.length ? nums[nums.length - 1] : 0;
  if (!nombre) err(1, 'aucun niveau (« ## Niveau 1 · … »)');
  if (nombre > MAX_NIVEAUX) err(1, `${nombre} niveaux : ${MAX_NIVEAUX} au plus`);
  for (let n = 1; n <= nombre; n++) if (!nums.includes(n)) err(1, `le niveau ${n} n’a aucune fiche (les niveaux doivent se suivre : 1, 2, 3…)`);
  return { nombre, titres: Object.fromEntries(Object.entries(lu.niveaux).filter(([, t]) => t)) };
}

/**
 * Vérifie les champs d'une fiche. modele : { champ: nombre } avec un nombre exact, '?' (0 ou 1), '0-3', etc.
 * Renvoie les valeurs (une chaîne, ou une liste pour les champs répétables), ou null en cas d'erreur.
 */
function champs(f, err, modele) {
  let ok = true;
  const valeurs = {};
  for (const cle of Object.keys(f.champs)) {
    if (!(cle in modele)) { err(f.ligne, `champ inconnu « ${cle} » (permis ici : ${Object.keys(modele).join(', ')})`); ok = false; }
  }
  for (const [cle, attendu] of Object.entries(modele)) {
    const v = (f.champs[cle] ?? []).filter((x) => x !== '');
    const [min, max] = attendu === '?' ? [0, 1] : String(attendu).includes('-') ? String(attendu).split('-').map(Number) : [attendu, attendu];
    if (v.length < min || v.length > max) {
      const voulu = min === max ? `${min}` : `entre ${min} et ${max}`;
      err(f.ligne, `« ${cle} » : ${voulu} attendu${min > 1 ? 's' : ''}, ${v.length} trouvé${v.length > 1 ? 's' : ''}`);
      ok = false;
    }
    valeurs[cle] = max > 1 ? v : v[0];
  }
  return ok ? valeurs : null;
}

/** Bonne réponse et mauvaises : pas de doublon, pas trop longues. */
function verifierChoix(f, err, bonne, mauvaises) {
  const tous = [bonne, ...mauvaises].map(sansAccent);
  if (mauvaises.some((m) => sansAccent(m) === sansAccent(bonne))) err(f.ligne, `une mauvaise réponse est identique à la bonne (« ${bonne} »)`);
  else if (new Set(tous).size !== tous.length) err(f.ligne, 'deux mauvaises réponses sont identiques');
  for (const x of [bonne, ...mauvaises]) if (x.length > LONGUEUR.reponse) err(f.ligne, `réponse trop longue pour un téléphone (${x.length} caractères, ${LONGUEUR.reponse} au plus) : « ${x} »`);
}
const doublons = (liste, cleDe, err, quoi) => {
  const vus = new Map();
  for (const x of liste) {
    const k = cleDe(x);
    if (vus.has(k)) err(x.ligne, `${quoi} en double (déjà ligne ${vus.get(k)}) : « ${k} »`);
    else vus.set(k, x.ligne);
  }
};

// ---------- Chaque atelier : les fiches attendues et les données produites

const ATELIERS = {
  dictee(fiches, err) {
    const mots = [];
    for (const f of fiches) {
      if (!f.element) { err(f.ligne, 'en dictée, un mot par ligne commençant par « - »'); continue; }
      mots.push({ niveau: f.niveau, texte: f.element, ligne: f.ligne });
    }
    doublons(mots, (m) => m.texte, err, 'mot');
    // chaque mot a son fichier son : deux mots qui ne diffèrent que par les accents se confondraient
    doublons(mots, (m) => nomFichier(m.texte), err, 'mot (même son qu’un autre, aux accents près)');
    return { mots: mots.map(({ ligne, ...m }) => m) };
  },

  synonymes(fiches, err) {
    const items = [];
    for (const f of fiches) {
      const c = champs(f, err, { phrase: 1, bonne: 1, mauvaise: 3, explication: '?' });
      if (!c) continue;
      if ((c.phrase.match(/\*/g) ?? []).length !== 2) { err(f.ligne, 'le mot à remplacer doit être entre deux étoiles : *mot*'); continue; }
      verifierChoix(f, err, c.bonne, c.mauvaise);
      items.push({ niveau: f.niveau, phrase: c.phrase, bonne: c.bonne, mauvaises: c.mauvaise, explication: c.explication ?? null, ligne: f.ligne });
    }
    doublons(items, (x) => x.phrase, err, 'phrase');
    return { items: items.map(({ ligne, ...x }) => x) };
  },

  homophones(fiches, err) {
    const groupes = new Map();
    for (const f of fiches) {
      if (!f.groupe) { err(f.ligne, 'chaque fiche doit être dans un groupe « ### a ou à »'); continue; }
      const g = groupes.get(f.groupe) ?? { niveau: f.niveau, nom: f.groupe, mots: [], phrases: [], ligne: f.ligne };
      groupes.set(f.groupe, g);
      if ('mot' in f.champs) {
        const c = champs(f, err, { mot: 1, astuce: 1 });
        if (c) g.mots.push({ mot: c.mot, astuce: c.astuce });
      } else {
        const c = champs(f, err, { phrase: 1, bonne: 1 });
        if (!c) continue;
        if (!c.phrase.includes('___')) err(f.ligne, 'la phrase doit contenir le trou « ___ »');
        g.phrases.push({ phrase: c.phrase, bonne: c.bonne, ligne: f.ligne });
      }
    }
    for (const g of groupes.values()) {
      if (g.mots.length < 2) err(g.ligne, `le groupe « ${g.nom} » doit commencer par au moins 2 fiches « Mot / Astuce »`);
      for (const p of g.phrases) if (!g.mots.some((m) => m.mot === p.bonne)) err(p.ligne, `« ${p.bonne} » n’est pas un des mots du groupe (${g.mots.map((m) => m.mot).join(', ')})`);
      doublons(g.phrases, (x) => x.phrase, err, 'phrase');
    }
    return { groupes: [...groupes.values()].map(({ ligne, phrases, ...g }) => ({ ...g, phrases: phrases.map(({ ligne: _, ...p }) => p) })) };
  },

  capitales(fiches, err, outils) {
    const pays = [];
    for (const f of fiches) {
      const c = champs(f, err, { pays: 1, drapeau: '?', capitale: 1, piege: '0-3' });
      if (c) pays.push({ niveau: f.niveau, pays: c.pays, drapeau: (c.drapeau && outils.drapeau(c.drapeau, f, err)) || null, capitale: c.capitale, pieges: c.piege, ligne: f.ligne });
    }
    doublons(pays, (x) => x.pays, err, 'pays');
    // « Piège » : une grande ville du pays qui n'est pas sa capitale (Rio de Janeiro) ; jamais la capitale d'un pays du fichier
    const capitales = new Set(pays.map((x) => sansAccent(x.capitale)));
    for (const x of pays) for (const v of x.pieges) if (capitales.has(sansAccent(v))) err(x.ligne, `« Piège : ${v} » est une capitale du fichier : mettre une autre grande ville du pays`);
    return { pays: pays.map(({ ligne, ...x }) => x) };
  },

  drapeaux(fiches, err, outils) {
    const pays = [];
    for (const f of fiches) {
      const c = champs(f, err, { pays: 1, drapeau: 1, ressemble: '0-3' });
      if (!c) continue;
      const drapeau = outils.drapeau(c.drapeau, f, err);
      if (drapeau) pays.push({ niveau: f.niveau, pays: c.pays, drapeau, ressemble: c.ressemble, ligne: f.ligne });
    }
    doublons(pays, (x) => x.pays, err, 'pays');
    doublons(pays, (x) => x.drapeau, err, 'drapeau');
    // « Ressemble » : un autre pays du fichier (il sert de piège dans les deux sens : son nom ou son drapeau)
    for (const x of pays) {
      for (const r of x.ressemble) {
        if (r === x.pays) err(x.ligne, `« Ressemble : ${r} » : c’est le même pays`);
        else if (!pays.some((y) => y.pays === r)) err(x.ligne, `« Ressemble : ${r} » : ce pays n’est pas dans le fichier (il faut aussi son drapeau)`);
      }
    }
    if (pays.length < 4) err(1, 'il faut au moins 4 pays');
    return { pays: pays.map(({ ligne, ...x }) => x) };
  },

  culture(fiches, err, outils) {
    const items = [];
    for (const f of fiches) {
      const c = champs(f, err, { question: '?', image: '?', drapeau: '?', bonne: 1, mauvaise: '0-3', explication: '?' });
      if (!c) continue;
      if (!c.question && !c.drapeau) { err(f.ligne, 'il manque « Question » (elle n’est facultative que pour un drapeau)'); continue; }
      let image = null;
      const fichier = c.image && outils.fichierImage(c.image, f, err);
      if (fichier) image = { type: 'fichier', id: fichier };
      else if (c.image && /^fichier\s/i.test(c.image)) { /* erreur déjà signalée */ } else if (c.image) {
        const [type, ...reste] = c.image.split(/\s+/);
        const t = TYPES_IMAGE[sansAccent(type)] ?? TYPES_IMAGE[type.toLowerCase()];
        const id = reste.join('-').toLowerCase();
        if (!t) err(f.ligne, `image « ${c.image} » : commence par pièce, planète ou panneau`);
        else if (!outils.images[t].includes(id)) err(f.ligne, `image inconnue « ${c.image} » (${t} possibles : ${outils.images[t].join(', ')})`);
        else image = { type: t, id };
      }
      if (c.mauvaise.length) verifierChoix(f, err, c.bonne, c.mauvaise);
      items.push({
        niveau: f.niveau, theme: f.groupe ?? 'Divers', question: c.question ?? 'De quel pays est ce drapeau ?',
        image, drapeau: (c.drapeau && outils.drapeau(c.drapeau, f, err)) || null, bonne: c.bonne, mauvaises: c.mauvaise, explication: c.explication ?? null, ligne: f.ligne,
      });
    }
    // Sans mauvaises réponses : il faut au moins 3 autres réponses possibles pour la même question dans le thème
    for (const x of items) {
      if (x.mauvaises.length >= 3) continue;
      const autres = new Set(items.filter((y) => y.theme === x.theme && y.question === x.question && y.bonne !== x.bonne).map((y) => y.bonne));
      if (autres.size + x.mauvaises.length < 3) err(x.ligne, `pas assez de mauvaises réponses : ajoute des « Mauvaise : … » (il en faut 3)`);
    }
    doublons(items, (x) => `${x.question} → ${x.bonne}${x.image ? ` (${x.image.id})` : ''}${x.drapeau ?? ''}`, err, 'question');
    return { items: items.map(({ ligne, ...x }) => x) };
  },

  anglais(fiches, err, outils) {
    const mots = [];
    const dialogues = [];
    for (const f of fiches) {
      if ('anglais' in f.champs) {
        const c = champs(f, err, { image: 1, anglais: 1, francais: '?', question: '?' });
        if (!c) continue;
        // Un fichier image devient « img:lion.jpg » ; sinon l'image est un emoji, un nombre ou un mot
        const fichier = outils.fichierImage(c.image, f, err);
        const image = fichier ? `img:${fichier}` : c.image;
        // « Question » (facultative) : ce qu'il faut nommer, quand le dessin peut tromper (« Quelle est cette couleur, en anglais ? »)
        mots.push({ niveau: f.niveau, groupe: f.groupe ?? 'Mots', image, anglais: c.anglais, francais: c.francais ?? null, question: c.question ?? null, ligne: f.ligne });
      } else {
        const c = champs(f, err, { question: 1, bonne: 1, mauvaise: 3, sens: 1 });
        if (!c) continue;
        verifierChoix(f, err, c.bonne, c.mauvaise);
        dialogues.push({ niveau: f.niveau, question: c.question, bonne: c.bonne, mauvaises: c.mauvaise, sens: c.sens, ligne: f.ligne });
      }
    }
    const groupes = Object.groupBy?.(mots, (m) => m.groupe) ?? mots.reduce((a, m) => ((a[m.groupe] ??= []).push(m), a), {});
    for (const [nom, liste] of Object.entries(groupes)) {
      if (liste.length < 4) err(liste[0].ligne, `le groupe « ${nom} » a ${liste.length} mots : il en faut au moins 4 (les mauvaises réponses viennent du même groupe)`);
      doublons(liste, (m) => m.anglais, err, 'mot anglais');
      doublons(liste, (m) => m.image, err, 'image');
    }
    doublons(dialogues, (d) => d.question, err, 'question');
    return { mots: mots.map(({ ligne, ...m }) => m), dialogues: dialogues.map(({ ligne, ...d }) => d) };
  },

  // ---------- Ateliers calculés : une fiche de réglages par niveau

  tables(fiches, err) {
    const niveaux = [];
    for (const f of fiches) {
      const c = champs(f, err, { tables: 1, 'reponses proches': '?', "a l'envers": '?', 'a l’envers': '?' });
      if (!c) continue;
      const tables = lireNombres(c.tables);
      if (!tables?.length || tables.some((t) => t < 1 || t > 12)) { err(f.ligne, 'Tables : des nombres de 1 à 12, par exemple « 2, 5, 10 » ou « 2 à 9 »'); continue; }
      const envers = c["a l'envers"] ?? c['a l’envers'];
      const pct = envers ? Number(envers.replace(/[^\d]/g, '')) : 0;
      if (envers && !(pct >= 0 && pct <= 100)) err(f.ligne, 'À l’envers : un pourcentage, par exemple « 30 % »');
      if (niveaux[f.niveau]) err(f.ligne, `le niveau ${f.niveau} a déjà sa fiche`);
      niveaux[f.niveau] = { tables, proches: /^o/i.test(c['reponses proches'] ?? ''), envers: pct / 100 };
    }
    return { reglages: niveaux.slice(1) };
  },

  divisions(fiches, err) {
    const niveaux = [];
    const objets = [];
    for (const f of fiches) {
      if ('objet' in f.champs) {
        const c = champs(f, err, { objet: 1, pour: 1, nom: 1 });
        if (c) objets.push({ objet: c.objet, receveur: c.pour, noms: c.nom });
        continue;
      }
      const c = champs(f, err, { exercice: 1, diviseurs: 1, 'resultat max': '?' });
      if (!c) continue;
      const exercice = sansAccent(c.exercice);
      if (!EXERCICES_DIVISION.includes(exercice)) { err(f.ligne, `Exercice : ${EXERCICES_DIVISION.join(', ')}`); continue; }
      const diviseurs = lireNombres(c.diviseurs);
      if (!diviseurs?.length) { err(f.ligne, 'Diviseurs : des nombres, par exemple « 2, 3 » ou « 2 à 9 »'); continue; }
      const max = c['resultat max'] ? Number(c['resultat max']) : 10;
      if (!(max >= 2 && max <= 20)) err(f.ligne, 'Résultat max : un nombre entre 2 et 20');
      (niveaux[f.niveau] ??= []).push({ exercice, diviseurs, max });
    }
    if (objets.length < 3) err(1, `il faut au moins 3 fiches « Objet / Pour / Nom » (pour les dessins de partage), il y en a ${objets.length}`);
    return { reglages: niveaux.slice(1), objets };
  },

  heure(fiches, err) {
    const niveaux = [];
    for (const f of fiches) {
      const c = champs(f, err, { heures: 1, minutes: 1 });
      if (!c) continue;
      const heures = lireNombres(c.heures);
      const minutes = lireNombres(c.minutes);
      if (!heures?.length || heures.some((h) => h > 23)) { err(f.ligne, 'Heures : de 0 à 23, par exemple « 7 à 11 »'); continue; }
      if (!minutes?.length || minutes.some((m) => m > 59)) { err(f.ligne, 'Minutes : de 0 à 59, par exemple « 0, 30 », « 0 à 55 de 5 en 5 » ou « 0 à 59 »'); continue; }
      if (heures.some((h) => h < 6)) { err(f.ligne, 'Heures : de 6 à 23 (l’app ne sait pas dire « la nuit »)'); continue; }
      if (niveaux[f.niveau]) err(f.ligne, `le niveau ${f.niveau} a déjà sa fiche`);
      niveaux[f.niveau] = { heures, minutes };
    }
    return { reglages: niveaux.slice(1) };
  },

  calcul(fiches, err) {
    const niveaux = [];
    for (const f of fiches) {
      const c = champs(f, err, { exercices: 1 });
      if (!c) continue;
      const types = c.exercices.split(',').map((x) => [x.trim(), EXERCICES_CALCUL[sansAccent(x)]]);
      const inconnus = types.filter(([, t]) => !t).map(([x]) => x);
      if (inconnus.length) { err(f.ligne, `exercice inconnu : ${inconnus.join(', ')} (possibles : ${Object.keys(EXERCICES_CALCUL).filter((k) => !k.startsWith('x ')).join(', ')})`); continue; }
      if (niveaux[f.niveau]) err(f.ligne, `le niveau ${f.niveau} a déjà sa fiche`);
      niveaux[f.niveau] = types.map(([, t]) => t);
    }
    return { reglages: niveaux.slice(1) };
  },
};

// Les temps (présent, futur, imparfait, passé composé) : des verbes avec leurs six formes, et des phrases à trou
// qui les utilisent. Ce que chaque temps a de particulier est dans src/lib/temps.js.
const verifierTemps = (T) => (fiches, err) => {
  const verbes = [];
  const phrases = [];
  for (const f of fiches) {
    if ('phrase' in f.champs) {
      const c = champs(f, err, { phrase: 1, verbe: 1, bonne: 1 });
      if (!c) continue;
      if (!c.phrase.includes('___')) err(f.ligne, 'la phrase doit contenir le trou « ___ »');
      phrases.push({ niveau: f.niveau, phrase: c.phrase, verbe: c.verbe, bonne: c.bonne, ligne: f.ligne });
      continue;
    }
    const c = champs(f, err, { verbe: 1, personnes: '?', pieges: '?', ...Object.fromEntries(PERSONNES.map((p) => [p, 1])) });
    if (!c) continue;
    const pieges = c.pieges ? c.pieges.split(',').map((x) => x.trim()).filter(Boolean) : [];
    if (pieges.length && !T.pieges) err(f.ligne, `pas de « Pièges » ${T.nom} : l’app fabrique seule les fautes`);
    for (const x of pieges) {
      // des fautes d'orthographe écrites à la personne « je » (fesais), que l'app décline aux autres personnes
      if (T.pieges === 'decline' && !x.endsWith(T.finJe)) err(f.ligne, `le piège « ${x} » doit être écrit à la personne « je » et finir par -${T.finJe}`);
      // au passé composé : un participe faux (prit), sans l'auxiliaire
      if (T.pieges === 'participe' && x.includes(' ')) err(f.ligne, `le piège « ${x} » : seulement le participe, sans l’auxiliaire`);
      if (PERSONNES.some((p) => c[p] === x || c[p].endsWith(` ${x}`))) err(f.ligne, `le piège « ${x} » est une vraie forme du verbe`);
    }
    if (T.finJe && !c.je.endsWith(T.finJe)) err(f.ligne, `« Je : ${c.je} » devrait finir par -${T.finJe}`);
    if (T.deuxMots) for (const p of PERSONNES) if (c[p].split(' ').length !== 2) err(f.ligne, `« ${c[p]} » : deux mots attendus, l’auxiliaire et le participe (ai joué)`);
    const personnes = c.personnes ? c.personnes.split(',').map((x) => x.trim().toLowerCase()) : PERSONNES;
    const inconnues = personnes.filter((x) => !PERSONNES.includes(x));
    if (inconnues.length) err(f.ligne, `Personnes : ${inconnues.join(', ')} inconnu (possibles : ${PERSONNES.join(', ')})`);
    for (const p of PERSONNES) if (c[p].length > LONGUEUR.reponse) err(f.ligne, `forme trop longue : « ${c[p]} »`);
    verbes.push({ niveau: f.niveau, verbe: c.verbe, formes: Object.fromEntries(PERSONNES.map((p) => [p, c[p]])), personnes, pieges, ligne: f.ligne });
  }
  doublons(verbes, (v) => v.verbe, err, 'verbe');
  for (const p of phrases) {
    const v = verbes.find((x) => x.verbe === p.verbe);
    if (!v) err(p.ligne, `le verbe « ${p.verbe} » n’a pas de fiche (Verbe + ses six formes) dans le fichier`);
    else if (!Object.values(v.formes).includes(p.bonne)) err(p.ligne, `« ${p.bonne} » n’est pas une des formes de « ${p.verbe} »`);
  }
  doublons(phrases, (x) => x.phrase, err, 'phrase');
  return { verbes: verbes.map(({ ligne, ...v }) => v), phrases: phrases.map(({ ligne, ...x }) => x) };
};
for (const [id, temps] of Object.entries(FICHIERS)) ATELIERS[id] = verifierTemps(TEMPS[temps]);

// Les Échecs et le Code de la route sont des ateliers à part, avec les mêmes fiches que la Culture
ATELIERS.echecs = ATELIERS.culture;
ATELIERS.route = ATELIERS.culture;
// Grammaire, Vocabulaire, Nombres, Mesures et Problèmes : encore les mêmes fiches
for (const id of ['grammaire', 'vocabulaire', 'nombres', 'mesures', 'problemes']) ATELIERS[id] = ATELIERS.culture;

// Les objets des divisions sont rangés à part (## Objets), hors des niveaux
ATELIERS.divisions.horsNiveau = (f) => 'objet' in f.champs;
