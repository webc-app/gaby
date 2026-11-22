<script>
  // L'écran unique : la tirelire en haut (ce que l'enfant a gagné), l'exercice dessous, sans fin.
  // Une seule règle : chaque bonne réponse rapporte, une erreur ne coûte rien. Le mode chrono double les gains.
  import { onMount, onDestroy, tick } from 'svelte';
  import { app, sauver, euros, supprimerProfil } from '../lib/etat.svelte.js';
  import { srcAvatar } from '../lib/avatars.js';
  import { jeux, defis, aleatoires, lecture, trouverMatiere, normaliser, ALEATOIRE } from '../questions/index.js';
  import { infoMatiere, enregistrerReponse, fixerNiveau, crediter, melanger, tempsChrono, niveauMax, POINTS_NIVEAU } from '../lib/progression.js';
  import { niveauGagne, nomNiveau } from '../lib/phrases.js';
  import { sons, basculerSon, sonActif, jouerFichier, prechargerFichier } from '../lib/sons.js';
  import { estTelephone } from '../lib/appareil.js';
  import Horloge from '../composants/Horloge.svelte';
  import Visuel from '../composants/Visuel.svelte';
  import Icone from '../composants/Icone.svelte';
  import Tiroir from '../composants/Tiroir.svelte';
  import C from 'virtual:contenu';

  let { aller } = $props();

  const lire = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch { /* rien */ } };

  // Mode : 'aleatoire' (par défaut : tous les ateliers courts mélangés) ou l'id d'un exercice choisi.
  const auHasardJeu = () => aleatoires[Math.floor(Math.random() * aleatoires.length)].id;
  // Mode chrono (sur cet appareil) : marche avec tous les ateliers, chaque bonne réponse rapporte le double.
  let chrono = $state(lire('gaby-chrono') === 'on');
  let limite = $state(null); // secondes pour la question en cours (mode chrono)
  // L'atelier de la dernière fois (sur cet appareil), s'il existe toujours ; sinon Aléatoire
  const modeDepart = [...jeux, ...defis, lecture].some((m) => m.id === lire('gaby-mode')) ? lire('gaby-mode') : 'aleatoire';
  let mode = $state(modeDepart);
  let matiereId = $state(modeDepart === 'aleatoire' ? auHasardJeu() : modeDepart);
  const matiere = $derived(trouverMatiere(matiereId));
  // En Aléatoire, la barre et le niveau affichés sont ceux de l'Aléatoire (ils ne changent pas d'une question à l'autre)
  const info = $derived(app.etat.matieres[mode === 'aleatoire' ? 'aleatoire' : matiereId] ?? { niveau: 1, barre: 0 });
  // L'atelier en cours (Aléatoire ou un atelier choisi) et le tiroir qui les liste tous
  const atelierActif = $derived(mode === 'aleatoire' ? ALEATOIRE : trouverMatiere(mode));
  let tiroir = $state(false);
  // Le niveau max de ce qui est affiché (l'atelier choisi, ou Aléatoire)
  const maxActif = $derived(niveauMax(atelierActif));
  let q = $state(null);
  let phase = $state('question'); // 'question' | 'juste' | 'faux' | 'recopie'
  let choisi = $state(null);
  let rate = $state(null); // deuxième chance : la première réponse, fausse (le choix s'éteint, la question reste)
  let saisie = $state('');
  let combo = $state(0);
  let fete = $state(null);
  let pieces = $state([]); // « +0,10 € » / « −0,05 € » qui s'envolent de la tirelire
  let cagnottePulse = $state(false);
  let son = $state(sonActif());
  let indiceVu = $state(false);
  let niveauOuvert = $state(false); // flèches ‹ › pour changer de niveau
  let fermerNiveau = null;
  let champ = $state(null);
  let restant = $state(null); // secondes restantes (mode chrono)
  let debut = 0;
  let suite = null;
  let horloge = null;

  let largeur = $state(400);
  let hauteur = $state(800);
  // Téléphone (petit côté < 600 px) : en-tête resserré (pas d'avatar ni de nom d'atelier)
  const telephone = estTelephone();
  const paysage = $derived(!telephone && largeur > hauteur && largeur >= 700);
  // Téléphone en portrait : tout l'atelier tient dans l'écran, sans défiler. Les tailles suivent la hauteur disponible.
  const compact = $derived(telephone || (!paysage && largeur < 600));
  const borne = (min, v, max) => Math.round(Math.min(max, Math.max(min, v)));
  const tailleHorloge = $derived(paysage ? 200 : compact ? borne(88, hauteur * 0.23 - 30, 170) : 170);
  const tailleVisuel = $derived(compact ? borne(90, hauteur * 0.17, 130) : 150); // les cartes d'image : 150 px, plus petites sur un petit écran
  // À chaque euro entier atteint : un son magique.
  function feterPalier(avant, apres) {
    if (Math.floor(apres / 100) > Math.floor(avant / 100)) setTimeout(sons.magie, 250);
  }

  onMount(() => nouvelleQuestion());
  onDestroy(() => { clearInterval(horloge); clearTimeout(suite); });

  async function nouvelleQuestion() {
    clearTimeout(suite);
    clearInterval(horloge);
    if (mode === 'aleatoire') matiereId = auHasardJeu();
    if (matiere.lecture) { q = null; restant = null; limite = null; relire = false; etapeLecture = 'lire'; reponsesLecture = []; return; } // la lecture a son propre chrono
    infoMatiere(app.etat, matiere.id);
    // La difficulté vient toujours du niveau de l'atelier de la question (même en Aléatoire)
    q = matiere.generer(Math.min(app.etat.matieres[matiere.id]?.niveau ?? 1, niveauMax(matiere)), app.etat, q?.cle);
    if (import.meta.env.DEV) { window.__question = q; window.__app = app; } // pour les tests automatiques
    phase = 'question';
    choisi = null;
    rate = null;
    saisie = '';
    indiceVu = false;
    debut = performance.now();
    limite = chrono ? tempsChrono(app.etat, matiere) : null;
    restant = limite;
    if (chrono) horloge = setInterval(tictac, 100);
    if (q.sonApres) prechargerFichier(fichier(q.sonApres));
    if (q.son) setTimeout(() => jouerFichier(fichier(q.son), { toujours: q.sonToujours, fois: q.sonFois }), 250);
    if (matiere.clavier) { await tick(); champ?.focus({ preventScroll: true }); }
  }

  // Une image du contenu dans une question ou un choix : « img:lion.jpg » → l'adresse du fichier,
  // « drap:fr » → celle du drapeau (src/drapeaux/fr.svg)
  const imageDe = (t) => (typeof t !== 'string' ? null : t.startsWith('img:') ? C.images[t.slice(4)] : t.startsWith('drap:') ? C.svgDrapeaux[t.slice(5)] : null);

  // Les voix enregistrées à l'avance (public/anglais/, public/dictee/ : voir src/lib/voix.js)
  // ?v= : l'empreinte des sons, qui change à chaque réenregistrement (jamais d'ancienne voix gardée en mémoire)
  const fichier = (id) => `${import.meta.env.BASE_URL}${id}.m4a?v=${__VERSION_SONS__}`;

  function tictac() {
    if (phase !== 'question' || !limite) return;
    const r = Math.max(0, limite - (performance.now() - debut) / 1000);
    if (Math.ceil(r) < Math.ceil(restant) && r > 0 && r <= 3) sons.tic();
    restant = r;
    if (r === 0) repondre(null);
  }

  function basculerChrono() {
    sons.clic();
    chrono = !chrono;
    ecrire('gaby-chrono', chrono ? 'on' : 'off');
    combo = 0;
    nouvelleQuestion();
  }

  function changer(m) {
    const nouveau = m ? m.id : 'aleatoire';
    if (nouveau === mode) { if (m?.lecture && !listeHistoires) versListe(); return; }
    if (m?.lecture) listeHistoires = true;
    sons.clic();
    mode = nouveau;
    niveauOuvert = false;
    ecrire('gaby-mode', nouveau);
    if (m) matiereId = m.id;
    combo = 0;
    q = null;
    nouvelleQuestion();
  }

  // Changer de niveau soi-même : ne rapporte rien (les niveaux sautés ne donnent pas de bonus)
  function basculerNiveau() {
    sons.clic();
    niveauOuvert = !niveauOuvert;
    relancerFermeture();
  }
  function relancerFermeture() {
    clearTimeout(fermerNiveau);
    if (niveauOuvert) fermerNiveau = setTimeout(() => (niveauOuvert = false), 4000);
  }
  function changerNiveau(ecart) {
    sons.clic();
    fixerNiveau(app.etat, matiere.id, info.niveau + ecart, maxActif);
    sauver();
    combo = 0;
    relancerFermeture();
    nouvelleQuestion();
  }

  function montrerPiece(montant) {
    const id = Date.now() + Math.random();
    pieces = [...pieces, { id, texte: `${montant > 0 ? '+' : ''}${euros(montant)}`, perte: montant < 0 }];
    setTimeout(() => (pieces = pieces.filter((p) => p.id !== id)), 1200);
    cagnottePulse = false;
    requestAnimationFrame(() => (cagnottePulse = true));
    setTimeout(() => (cagnottePulse = false), 700);
  }

  function repondre(valeur) {
    if (phase !== 'question' || !q) return;
    const juste = valeur !== null && normaliser(valeur) === normaliser(q.reponse);
    // Deuxième chance : à la première erreur, rien n'est compté et on réessaie (au clavier, on corrige ce qu'on a écrit).
    // Pas en mode chrono, ni quand il n'y a que deux choix (le second essai serait donné).
    if (!juste && rate === null && !chrono && (matiere.clavier || q.choix?.length > 2)) {
      rate = String(valeur);
      combo = 0;
      sons.oups();
      if (matiere.clavier) {
        if (q.son) setTimeout(() => jouerFichier(fichier(q.son), { toujours: q.sonToujours }), 500);
        champ?.focus({ preventScroll: true });
      }
      return;
    }
    const rattrapage = rate !== null;
    clearInterval(horloge);
    const temps = Math.min((performance.now() - debut) / 1000, 60);
    const avant = app.etat.tirelire.solde;
    const ev = enregistrerReponse(app.etat, matiere, { cle: q.cle, juste, temps }, { aleatoire: mode === 'aleatoire', chrono, rattrapage });
    choisi = valeur === null ? null : String(valeur);
    let delai;

    if (juste) {
      if (!rattrapage) combo++; // une réponse rattrapée ne compte pas dans la série
      sons.bonne(Math.max(1, combo));
      if (!rattrapage && combo % 5 === 0) setTimeout(sons.combo, 120);
      phase = 'juste';
      delai = 650;
    } else {
      combo = 0;
      sons.oups();
      if (matiere.clavier) {
        phase = 'recopie';
        saisie = '';
        champ?.focus({ preventScroll: true });
      } else {
        phase = 'faux';
        delai = q.explication ? 3000 : 1500; // le temps de lire le « car… »
      }
    }

    // Nouveau niveau (ou retour en arrière) : la série repart de zéro, le bip aussi.
    if (ev.montee || ev.descente || ev.saut) combo = 0;

    if (ev.gain) {
      montrerPiece(ev.gain);
      if (ev.gain >= 5) setTimeout(sons.piece, 120);
      feterPalier(avant, app.etat.tirelire.solde);
    }

    const apres = app.etat.tirelire.solde;
    if (ev.saut) {
      // Démarrage rapide : on saute un niveau (sans bonus), juste un petit signe
      fete = { titre: `⚡ Niveau ${ev.saut.niveau}`, texte: 'Tu vas vite !' };
      setTimeout(sons.combo, 120);
      setTimeout(() => (fete = null), 1300);
      delai = Math.max(delai ?? 0, 1100);
    } else if (ev.montee) {
      fete = { titre: niveauGagne(ev.montee.niveau, ev.montee.nouveau, maxActif), texte: ev.montee.bonus ? `+${euros(ev.montee.bonus)} dans ta tirelire` : null };
      setTimeout(sons.victoire, 200);
      if (ev.montee.bonus) setTimeout(() => { montrerPiece(ev.montee.bonus); sons.piece(); feterPalier(apres - ev.montee.bonus, apres); }, 700);
      setTimeout(() => (fete = null), 2200);
      delai = Math.max(delai ?? 0, 1800);
    }

    // Anglais : on entend le bon mot (ou la bonne réponse du dialogue) une fois la réponse donnée
    if (q.sonApres) {
      setTimeout(() => jouerFichier(fichier(q.sonApres)), juste ? 250 : 400);
      if (delai !== undefined) delai = Math.max(delai, juste ? 1500 : 3000);
    }

    sauver();
    if (delai !== undefined) suite = setTimeout(nouvelleQuestion, delai);
  }

  function valider(e) {
    e.preventDefault();
    if (!saisie.trim()) return;
    if (phase === 'question') repondre(saisie);
    else if (phase === 'recopie') {
      if (normaliser(saisie) === normaliser(q.reponse)) {
        sons.clic();
        phase = 'juste';
        suite = setTimeout(nouvelleQuestion, 600);
      } else {
        sons.oups();
      }
    }
  }

  // Mode dev uniquement : tout effacer et repartir de zéro (serveur local + cet appareil).
  // Mode dev uniquement : supprime le profil (serveur de dev + cet appareil) et repart de l'écran d'entrée.
  async function remettreAZero() {
    await supprimerProfil('reset');
  }

  const etatBouton = (c) => {
    if (phase === 'question') return c === rate ? 'eteint' : '';
    if (c === q.reponse) return 'bon';
    return 'eteint';
  };
  // Lecture. On lit le texte, on touche « J'ai fini de lire », puis 3 questions remplacent le texte.
  // Elle ne rapporte que si les 3 réponses sont justes (une seule fois par texte) ; sinon on relit et on réessaie.
  // Une lecture validée reste lisible, sans questions ni gain. Pas de chrono ici : seule la compréhension compte.
  let etapeLecture = $state('lire'); // 'lire' | 'questions' | 'fin'
  let relire = $state(false); // pendant les questions : relire le texte par-dessus
  let reponsesLecture = $state([]); // les réponses de cet essai
  const motsDe = (texte) => texte.paragraphes.join(' ').split(/\s+/).filter((m) => /\p{L}|\d/u.test(m)).length;
  const lectureValidee = (texte) => !!app.etat.lectures[texte.titre]?.valide;
  // L'histoire ouverte (choisie dans la liste)
  let numTexte = $state(Math.max(0, lecture.textes.findIndex((t) => !app.etat.lectures[t.titre]?.valide)));
  const texteCourant = $derived(lecture.textes[numTexte] ?? lecture.textes[0]);
  // En arrivant dans la Lecture (ou en retouchant son bouton) : la liste des histoires. On en touche une pour la lire.
  let listeHistoires = $state(true);
  function ouvrirHistoire(i) {
    sons.clic();
    numTexte = i;
    listeHistoires = false;
    relire = false; etapeLecture = 'lire'; reponsesLecture = [];
    debutTexte();
  }
  // Un texte qu'on ouvre ou qu'on reprend commence toujours en haut : la règle sur la première ligne, le cadre tout en haut
  // (sinon la règle restait sur la ligne du texte précédent, donc à la fin d'un texte plus court)
  function debutTexte() {
    ligneRegle = 0;
    tick().then(() => articleLecture?.scrollTo({ top: 0 }));
  }
  function versListe() { sons.clic(); listeHistoires = true; }
  const qLecture = $derived(reponsesLecture.length);

  // Aides à la lecture (sur cet appareil, éteintes par défaut) : la règle surligne une ligne et assombrit le reste ;
  // les lignes en couleur teintent une ligne sur deux. Les lignes sont recalculées à chaque mise en page.
  let regle = $state(lire('gaby-regle') === 'on');
  let couleurs = $state(lire('gaby-couleurs') === 'on');
  let ligneRegle = $state(0);
  let articleLecture = $state(null);
  let lignesTexte = [];
  let bandeRegle = $state(null); // { top, h }
  const mots = (p) => fin(p).split(/\s+/).filter(Boolean);
  function basculerAide(quoi) {
    sons.clic();
    if (quoi === 'regle') { regle = !regle; ligneRegle = 0; ecrire('gaby-regle', regle ? 'on' : 'off'); }
    else { couleurs = !couleurs; ecrire('gaby-couleurs', couleurs ? 'on' : 'off'); }
  }
  function mesurerLignes() {
    const a = articleLecture;
    if (!a) return;
    const groupes = [];
    for (const s of a.querySelectorAll('.texte-lecture span')) {
      const t = s.offsetTop;
      let g = groupes.find((x) => Math.abs(x.top - t) < 4);
      if (!g) groupes.push((g = { top: t, bas: t + s.offsetHeight, spans: [] }));
      g.spans.push(s);
    }
    groupes.sort((x, y) => x.top - y.top);
    groupes.forEach((g, i) => g.spans.forEach((s) => s.classList.toggle('l2', couleurs && i % 2 === 1)));
    lignesTexte = groupes;
    placerRegle();
  }
  function placerRegle() {
    if (!regle || !lignesTexte.length) { bandeRegle = null; return; }
    ligneRegle = Math.min(ligneRegle, lignesTexte.length - 1);
    const g = lignesTexte[ligneRegle];
    bandeRegle = { top: g.top - 4, h: g.bas - g.top + 8 };
    // garder la ligne visible dans le cadre qui défile
    const a = articleLecture;
    if (a && (g.top < a.scrollTop + 40 || g.bas > a.scrollTop + a.clientHeight - 90)) a.scrollTo({ top: g.top - a.clientHeight / 3, behavior: 'smooth' });
  }
  function ligneSuivante() { sons.clic(); ligneRegle = (ligneRegle + 1) % Math.max(1, lignesTexte.length); placerRegle(); }
  function toucherTexte(e) {
    if (!regle || !articleLecture) return;
    const y = e.clientY - articleLecture.getBoundingClientRect().top + articleLecture.scrollTop;
    const i = lignesTexte.findIndex((g) => y >= g.top - 6 && y <= g.bas + 6);
    if (i >= 0) { ligneRegle = i; placerRegle(); }
  }
  $effect(() => {
    // dépendances : ce qui change la mise en page du texte
    void [regle, couleurs, relire, etapeLecture, articleLecture, numTexte];
    if (!articleLecture) return;
    tick().then(mesurerLignes);
    const ro = new ResizeObserver(() => mesurerLignes());
    ro.observe(articleLecture);
    return () => ro.disconnect();
  });

  function finirLecture() {
    sons.clic();
    reponsesLecture = [];
    relire = false;
    etapeLecture = 'questions';
  }
  function reessayerLecture() {
    sons.clic();
    reponsesLecture = [];
    relire = false;
    etapeLecture = 'lire';
    debutTexte();
  }
  let choixLecture = $state([]);
  let repondueLecture = $state(null); // la réponse touchée, montrée un instant (sans dévoiler la bonne)
  $effect(() => {
    const ql = texteCourant.questions?.[qLecture];
    choixLecture = ql ? melanger([ql.reponse, ...ql.faux]) : [];
  });
  function repondreLecture(texte, choix) {
    if (repondueLecture !== null) return;
    const ql = texte.questions[qLecture];
    repondueLecture = choix;
    if (choix === ql.reponse) sons.bonne(1); else sons.oups();
    setTimeout(() => {
      reponsesLecture = [...reponsesLecture, choix];
      repondueLecture = null;
      if (reponsesLecture.length >= texte.questions.length) terminerLecture(texte);
    }, 1100);
  }
  function terminerLecture(texte) {
    etapeLecture = 'fin';
    const toutJuste = texte.questions.every((ql, i) => reponsesLecture[i] === ql.reponse);
    if (!toutJuste || lectureValidee(texte)) return;
    app.etat.lectures[texte.titre] = { valide: true, t: Date.now() };
    const avant = app.etat.tirelire.solde;
    const montant = app.etat.reglages.gainLecture ?? 50;
    const gain = montant ? crediter(app.etat, montant, `Lecture · ${texte.titre}`) : 0;
    sauver();
    fete = { titre: '📖 Lecture validée !', texte: gain ? `+${euros(gain)} dans ta tirelire` : null };
    sons.victoire();
    if (gain) { montrerPiece(gain); setTimeout(sons.piece, 300); feterPalier(avant, app.etat.tirelire.solde); }
    setTimeout(() => (fete = null), 2600);
  }

  // En lecture, la page tient pile dans l'écran et le texte défile dans son cadre.
  $effect(() => {
    document.body.classList.toggle('ecran-tenu', compact);
    return () => document.body.classList.remove('ecran-tenu');
  });
  $effect(() => {
    document.body.classList.toggle('lecture-ouverte', !!matiere.lecture);
    return () => document.body.classList.remove('lecture-ouverte');
  });

  const avecEgal = (t) => (t.length > 14 || t.includes('?') ? t : `${t} = ?`);
  // Un énoncé court (« 7 × 8 », « 7 × ? = 56 ») : le « ? » devient la case à remplir, comme le mot à trouver des homophones.
  // Un énoncé long (« 12 billes pour 3 enfants. Combien chacun ? ») reste du texte.
  const caseATrouver = (t) => {
    const e = avecEgal(t);
    const i = e.indexOf('?');
    return t.length <= 14 && i >= 0 ? { avant: e.slice(0, i), apres: e.slice(i + 1) } : null;
  };
  // Typographie française : une espace insécable avant ! ? : ; pour qu'ils ne restent pas seuls en début de ligne
  const fin = (t) => t.replace(/ ([!?:;»])/g, '\u00A0$1').replace(/« /g, '«\u00A0');
</script>

<svelte:window bind:innerWidth={largeur} bind:innerHeight={hauteur} />

<div class="jeu" class:paysage>
  <header>
    <div class="outils">
      <button class="rond" onclick={() => aller('parent')} aria-label="Espace parent"><Icone nom="reglages" /></button>
      <button class="rond" onclick={() => (son = basculerSon())} aria-label="Son"><Icone nom={son ? 'son' : 'muet'} /></button>
      {#if import.meta.env.DEV}
        <button class="rond" onclick={remettreAZero} aria-label="Remise à zéro (dev)" title="Remise à zéro (dev)"><Icone nom="reset" /></button>
      {/if}
    </div>
    <div class="moi">
      {#if !telephone}<img class="photo" src={srcAvatar(app.etat.profil.avatar)} alt="" />{/if}
      <!-- La tirelire : ce que l'enfant a gagné. La toucher ouvre l'écran de la tirelire (encaisser). -->
      <button class="cagnotte" class:pulse={cagnottePulse} onclick={() => aller('tirelire')} aria-label="Ma tirelire">
        <Icone nom="piece" /><span class="gagne">{euros(app.etat.tirelire.solde)}</span>
        {#each pieces as p (p.id)}<span class="piece" class:perte={p.perte}>{p.texte}</span>{/each}
      </button>
      {#if !paysage}
      <!-- L'atelier en cours, en haut à droite : le toucher ouvre le tiroir de tous les ateliers (à droite) -->
      <button class="bouton-atelier" style="--c:{atelierActif.couleur}" onclick={() => { sons.clic(); tiroir = true; }}
        aria-haspopup="dialog" aria-label="Ateliers (en cours : {atelierActif.nom})">
        <span class="pastille-atelier"><Icone nom={atelierActif.id} taille={20} /></span>
        <!-- sur téléphone, pas la place pour le nom de l'atelier : le mot « Menu » dit où trouver les autres -->
        <span class="nom-atelier">{telephone ? 'Menu' : atelierActif.nom}</span>
        <svg class="fleche-atelier" viewBox="0 0 10 16" width="9" height="14" aria-hidden="true"><path d="M2 2 L8 8 L2 14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
      {/if}
    </div>
  </header>

  <!-- Tablette en paysage : tous les ateliers, toujours affichés à gauche (ailleurs : le tiroir, par le bouton du haut) -->
  {#if paysage}
    <aside class="ateliers"><Tiroir fixe actif={mode} onchoisir={(m) => changer(m.id === 'aleatoire' ? null : m)} /></aside>
  {/if}

  <section class="zone">

    {#if matiere.lecture}
      {@const texte = texteCourant}
      {@const validee = lectureValidee(texte)}
      {#if listeHistoires}
        <!-- La liste des histoires : le titre, le nombre de mots, et une coche quand l'histoire est lue et comprise -->
        <section class="carte-jeu lecture histoires" style="--c:{matiere.couleur}">
          <h2>Les histoires</h2>
          {#each lecture.textes as t, i (t.titre)}
            <button class="histoire" onclick={() => ouvrirHistoire(i)}>
              <span class="coche" class:faite={lectureValidee(t)} aria-hidden="true">
                {#if lectureValidee(t)}<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg>{/if}
              </span>
              <span class="titre-histoire">{t.titre}{#if t.auteur}<small>{t.auteur}</small>{/if}{#if lectureValidee(t)}<span class="invisible"> (lue et comprise)</span>{/if}</span>
              <span class="mots-histoire">{motsDe(t)} mots</span>
            </button>
          {/each}
        </section>
      {:else if validee || etapeLecture === 'lire' || relire || !texte.questions?.length}
        <!-- Le texte : pendant la lecture, quand on le relit, ou une fois la lecture validée -->
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
        <article class="carte-jeu lecture" style="--c:{matiere.couleur}"
          bind:this={articleLecture} onclick={toucherTexte}>
          {#if bandeRegle}<div class="regle-lecture" style="top:{bandeRegle.top}px; height:{bandeRegle.h}px" aria-hidden="true"></div>{/if}
          <div class="haut-lecture">
            <button class="lien-relire vers-liste" onclick={(e) => { e.stopPropagation(); versListe(); }} aria-label="Retour aux histoires">←<span class="mot"> Histoires</span></button>
            {#if relire}<button class="lien-relire" onclick={() => { sons.clic(); relire = false; }}>← Questions</button>{/if}
            {#if validee}
              <p class="badge-lecture">✓ Lecture validée</p>
            {/if}
            <span class="aides">
              <button class="aide-btn" class:actif={regle} onclick={(e) => { e.stopPropagation(); basculerAide('regle'); }} aria-pressed={regle} title="Règle de lecture"><Icone nom="regle" taille={20} /></button>
              <button class="aide-btn" class:actif={couleurs} onclick={(e) => { e.stopPropagation(); basculerAide('couleurs'); }} aria-pressed={couleurs} title="Une ligne sur deux en couleur"><Icone nom="lignes" taille={20} /></button>
            </span>
          </div>
          <h2>{texte.titre}</h2>
          {#if texte.auteur}<p class="auteur">{texte.auteur}</p>{/if}
          <div class="texte-lecture" class:couleurs class:poesie={texte.poesie}>
            {#each texte.paragraphes as p}<p>{#each p.split('\n') as vers, k}{#if k}<br />{/if}{#each mots(vers) as m}<span>{m}</span>{' '}{/each}{/each}</p>{/each}
          </div>
          {#if regle}
            <div class="suivante-zone"><button class="suivante" onclick={(e) => { e.stopPropagation(); ligneSuivante(); }}>Ligne suivante ↓</button></div>
          {/if}
          {#if !validee && etapeLecture === 'lire' && texte.questions?.length}
            <button class="bouton jaune fini-lire" onclick={finirLecture}>J’ai fini de lire ✓</button>
          {:else if relire}
            <button class="bouton jaune fini-lire" onclick={() => { sons.clic(); relire = false; }}>Retour aux questions</button>
          {/if}
        </article>
      {:else}
        <!-- Les questions remplacent le texte : toute la place pour répondre -->
        <section class="carte-jeu questions-lecture" style="--c:{matiere.couleur}">
          <div class="haut-lecture"><button class="lien-relire vers-liste" onclick={versListe} aria-label="Retour aux histoires">←<span class="mot"> Histoires</span></button></div>
          {#if etapeLecture === 'questions' && qLecture < texte.questions.length}
            {@const ql = texte.questions[qLecture]}
            <p class="titre-ql">As-tu bien compris ? {qLecture + 1}/{texte.questions.length}</p>
            <p class="q-lecture">{fin(ql.q)}</p>
            <div class="choix-lecture">
              {#each choixLecture as c (c)}
                <button class="choix-btn {repondueLecture === c ? (c === ql.reponse ? 'bon' : 'eteint') : repondueLecture !== null ? 'eteint' : ''}"
                  disabled={repondueLecture !== null} onclick={() => repondreLecture(texte, c)}>{c}</button>
              {/each}
            </div>
            <button class="lien-relire" onclick={() => { sons.clic(); relire = true; }}>📖 Relire le texte</button>
          {:else}
            {@const bonnes = texte.questions.filter((ql, i) => reponsesLecture[i] === ql.reponse).length}
            <p class="fin-lecture">{bonnes === texte.questions.length ? '🎉' : '💪'} {bonnes}/{texte.questions.length} bonnes réponses</p>
            {#if bonnes < texte.questions.length}
              <p class="consigne-lecture">Pour gagner, il faut toutes les réponses justes. Relis l’histoire et réessaie !</p>
              <button class="bouton jaune fini-lire" onclick={reessayerLecture}>📖 Relire et réessayer</button>
            {:else}
              <button class="bouton jaune fini-lire" onclick={versListe}>📚 Choisir une autre histoire</button>
            {/if}
          {/if}
        </section>
      {/if}
    {:else if q}
      <div class="carte-jeu" class:defi={chrono} style="--c:{matiere.couleur}">
        <div class="niveau">
          {#if mode === 'aleatoire'}
            <span class="niveau-fixe">{nomNiveau(info.niveau, maxActif)}</span>
          {:else}
            <span class="choix-niveau">
              {#if niveauOuvert}<button class="fleche" onclick={() => changerNiveau(-1)} disabled={info.niveau <= 1} aria-label="Niveau en dessous">‹</button>{/if}
              <button class="niveau-btn" class:ouvert={niveauOuvert} onclick={basculerNiveau} title="Changer de niveau">{nomNiveau(info.niveau, maxActif)}</button>
              {#if niveauOuvert}<button class="fleche" onclick={() => changerNiveau(1)} disabled={info.niveau >= maxActif} aria-label="Niveau au-dessus">›</button>{/if}
            </span>
          {/if}
          <div class="barre" aria-label="Progression vers le niveau suivant">
            {#each Array(POINTS_NIVEAU) as _, n}<span class:plein={n < info.barre}></span>{/each}
          </div>
          {#if combo >= 3}<span class="combo">🔥{combo}</span>{/if}
          <button class="bouton-chrono" class:actif={chrono} onclick={basculerChrono} aria-pressed={chrono}
            title={chrono ? 'Mode chrono : gains doublés. Touche pour l’arrêter' : 'Passer en mode chrono : gains doublés'}>
            <Icone nom="chrono" taille={18} />{#if chrono}<span>×2</span>{/if}
          </button>
        </div>

        {#if chrono && limite}
          <div class="minuteur" aria-label="Temps restant">
            <div style="width:{(restant / limite) * 100}%" class:moitie={restant <= limite / 2} class:urgent={restant <= 3}></div>
          </div>
        {/if}

        {#if q.dessin}
          <div class="dessin">{#each q.dessin as ligne}<div>{ligne}</div>{/each}</div>
        {/if}
        {#if q.indice}<p class="indice">💡 {q.indice}</p>{/if}
        {#if q.aide && phase === 'question'}
          {#if indiceVu || q.aideVisible}
            <p class="indice">💡 {q.aide}</p>
          {:else}
            <button class="demande-indice" onclick={() => { sons.clic(); indiceVu = true; }}>💡 Un indice ?</button>
          {/if}
        {/if}

        {#if matiere.ecoute}
          <!-- Dictée : le mot à écouter, surligné comme le mot des synonymes ; on écrit dans la case (le champ, plus bas) -->
          <div class="question"><button class="son-mot" onclick={() => jouerFichier(fichier(q.son), { toujours: true, fois: q.sonFois })}><Icone nom="ecouter" taille={28} /> Écoute</button></div>
          <p class="consigne">Écris le mot que tu entends</p>
        {:else if q.ecoute}
          <div class="question"><button class="son-mot" onclick={() => jouerFichier(fichier(q.son))}><Icone nom="ecouter" taille={28} /> Écoute</button> = <mark class="trou">{phase !== 'question' && !imageDe(q.reponse) ? q.reponse : '?'}</mark></div>
          <p class="consigne">Touche le bon dessin</p>
        {:else if q.visuel || q.drapeau}
          <div class="visuel">
            {#if q.drapeau}<Visuel type="drapeau" src={q.drapeau} taille={tailleVisuel} />{:else}<Visuel type={q.visuel.type} id={q.visuel.id} src={q.visuel.src} taille={tailleVisuel} />{/if}
          </div>
          <p class="consigne forte">{q.consigne}</p>
        {:else if q.consigne && !q.phrase && !q.horloge}
          <div class="question">{fin(q.consigne)}</div>
          {#if q.son}<button class="reecouter" onclick={() => jouerFichier(fichier(q.son))} aria-label="Réécouter"><Icone nom="ecouter" taille={26} /></button>{/if}
        {:else if q.horloge}
          <div class="horloge"><Horloge h={q.horloge.h} m={q.horloge.m} taille={tailleHorloge} /></div>
          <p class="consigne">{q.consigne}</p>
        {:else if q.phrase}
          <p class="phrase">{fin(q.phrase.avant)}<mark class:trou={q.phrase.trou}>{q.phrase.trou && phase !== 'question' ? q.reponse : q.phrase.mot}</mark>{fin(q.phrase.apres)}</p>
          <p class="consigne">{q.consigne}</p>
        {:else if q.traduire}
          <!-- Anglais : ce qu'il faut traduire, surligné, et la case de la réponse -->
          {@const trou = phase !== 'question' ? q.reponse : '?'}
          {#if imageDe(q.grand) || q.dessin}
            <!-- un dessin (photo, emoji, nombre) sur la carte d'image : jamais sur le surlignage jaune, qui fausserait les couleurs -->
            <div class="visuel">{#if imageDe(q.grand)}<Visuel type="fichier" src={imageDe(q.grand)} taille={tailleVisuel} />{:else}<Visuel type="emoji" id={q.grand} taille={tailleVisuel} />{/if}</div>
            <div class="question"><mark class="trou">{trou}</mark></div>
          {:else}
            <div class="question"><mark>{q.grand}</mark> = <mark class="trou">{trou}</mark></div>
          {/if}
          <p class="consigne">{q.texte}</p>
        {:else if q.grand}
          <div class="question" class:avec-drapeau={q.petitDrapeau}>{#if q.petitDrapeau}<img class="drapeau petit" src={q.petitDrapeau} alt="" />{/if}{#if imageDe(q.grand)}<Visuel type="fichier" src={imageDe(q.grand)} taille={tailleVisuel} />{:else}{q.grand}{/if}</div>
          <p class="consigne">{q.texte}</p>
        {:else}
          {@const cas = caseATrouver(q.texte)}
          {#if cas}
            <div class="question">{cas.avant}<mark class="trou">{phase !== 'question' ? q.reponse : '?'}</mark>{cas.apres}</div>
          {:else}
            <div class="question">{avecEgal(q.texte)}</div>
          {/if}
        {/if}

        {#if rate !== null && phase === 'question'}
          <p class="encore">Essaie encore !</p>
        {/if}
        {#if phase === 'recopie'}
          <p class="correction" class:cursive={matiere.id === 'dictee'}>{q.reponse}</p>
        {/if}
        {#if phase === 'faux' && q.explication}
          <p class="explication">{q.explication}</p>
        {/if}

        {#if matiere.clavier}
          <form onsubmit={valider}>
            <input
              bind:this={champ}
              bind:value={saisie}
              type="text"
              inputmode={matiere.clavier}
              pattern={matiere.clavier === 'numeric' ? '[0-9]*' : undefined}
              enterkeyhint="go"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              aria-label="Ta réponse"
              placeholder={phase === 'recopie' ? 'Recopie…' : '…'}
              class:bon={phase === 'juste'}
            />
            <button class="ok" disabled={!saisie.trim() || phase === 'juste'}>OK</button>
          </form>
        {:else}
          <div class="choix" class:emojis={q.ecoute && !/^[0-9a-zà-ÿœ -]+$/i.test(q.reponse)} class:longs={!q.ecoute && q.choix.some((c) => c.length > 16)}>
            {#each q.choix as c (c)}
              <button class="choix-btn {etatBouton(c)}" class:carte-choix={imageDe(c)} disabled={phase !== 'question' || c === rate} onclick={() => repondre(c)}>{#if imageDe(c)}<img class="image-choix" class:drapeau-choix={c.startsWith('drap:')} src={imageDe(c)} alt="" />{:else}{c}{/if}</button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </section>
</div>

{#if fete}
  <div class="fete" role="status">
    <strong>{fete.titre}</strong>
    {#if fete.texte}<span>{fete.texte}</span>{/if}
  </div>
  {#each Array(24) as _, n}
    <span class="confetti" style="left:{(n * 41) % 100}%; animation-delay:{(n % 6) * 0.1}s">{['🎉', '⭐', '🎁', '💰'][n % 4]}</span>
  {/each}
{/if}

<Tiroir bind:ouvert={tiroir} actif={mode} onchoisir={(m) => changer(m.id === 'aleatoire' ? null : m)} />


<style>
  .jeu { display: flex; flex-direction: column; gap: 0.7rem; flex: 1; }
  /* Tablette en paysage : la liste des ateliers à gauche, la carte d'exercice à droite */
  .jeu.paysage { display: grid; grid-template-columns: 19.5rem minmax(0, 1fr); grid-template-rows: auto 1fr; column-gap: 2rem; }
  .paysage header { grid-column: 1 / -1; }
  .paysage .ateliers { padding-top: 1.5rem; min-height: 0; }
  /* la carte prend toute la colonne : son bord droit est aligné avec la tirelire, en haut */
  .paysage .zone { width: 100%; }

  header { display: flex; justify-content: space-between; align-items: center; }
  .outils { display: flex; gap: 0.4rem; }
  .rond { appearance: none; border: 0; background: rgba(255, 255, 255, 0.1); color: var(--texte); border-radius: 50%; width: 2.5rem; height: 2.5rem; display: grid; place-items: center; cursor: pointer; }
  .moi { display: flex; align-items: center; gap: 0.5rem; }
  .photo { width: 2.8rem; height: 2.8rem; border-radius: 50%; object-fit: cover; background: var(--fond-2); overflow: hidden; border: 3px solid var(--jaune); flex: none; }
  .cagnotte {
    position: relative; appearance: none; border: 0; cursor: pointer; background: var(--jaune); color: #3a2a00;
    font-weight: 700; font-size: 1.2rem; padding: 0.45rem 1rem; border-radius: 999px; box-shadow: 0 4px 0 rgba(0, 0, 0, 0.35);
  }
  .cagnotte.pulse { animation: pulse 0.3s ease 2 alternate; }
  @keyframes pulse { to { scale: 1.12; } }
  .piece {
    position: absolute; right: 0.6rem; top: 100%; pointer-events: none; white-space: nowrap;
    color: var(--jaune); font-weight: 700; font-size: 1.15rem; text-shadow: 0 2px 0 rgba(0, 0, 0, 0.45);
    animation: envole 1.1s ease-out forwards;
  }
  .piece.perte { color: var(--rouge); }
  @keyframes envole { from { translate: 0 1.6rem; opacity: 0; } 25% { opacity: 1; } to { translate: 0 -0.4rem; opacity: 0; } }

  header { position: relative; z-index: 3; }
  .zone { position: relative; z-index: 2; }
  /* Quand la place manque (tablette en portrait), c'est le nom de l'atelier qui se raccourcit */
  .moi { flex: 1; min-width: 0; justify-content: flex-end; margin-left: 0.4rem; }
  .cagnotte, .photo { flex: none; }
  .cagnotte { display: inline-flex; align-items: center; gap: 0.3rem; white-space: nowrap; }
  @media (max-width: 480px) {
    /* Téléphone : tirelire compacte pour que tout tienne sur la ligne */
    .cagnotte { font-size: 1rem; padding: 0.4rem 0.7rem; gap: 0.2rem; }
    .photo { width: 2.3rem; height: 2.3rem; }
    .outils { gap: 0.3rem; }
    .moi { gap: 0.35rem; }
  }

  .zone { display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
  /* Colonne accrochée en haut : le bouton de l'atelier ne bouge jamais, seule la carte change de hauteur vers le bas */
  .paysage .zone { justify-content: flex-start; padding-top: 1.5rem; }
  /* Le bouton des ateliers, en haut à droite : l'atelier en cours et une flèche vers le tiroir */
  .bouton-atelier {
    appearance: none; cursor: pointer; flex: 0 1 auto; min-width: 0; display: inline-flex; align-items: center; gap: 0.4rem; font: inherit; font-weight: 700;
    padding: 0.25rem 0.55rem 0.25rem 0.25rem; border-radius: 999px; border: 2px solid var(--c); background: rgba(255, 255, 255, 0.08); color: var(--texte);
  }
  .bouton-atelier:active { background: rgba(255, 255, 255, 0.18); }
  .pastille-atelier { flex: none; width: 2rem; height: 2rem; border-radius: 50%; display: grid; place-items: center; background: var(--c); color: #1a1033; }
  .nom-atelier { font-size: 1rem; min-width: 0; max-width: 9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .fleche-atelier { display: block; flex: none; color: var(--c); margin-right: 0.15rem; }
  /* La lecture défile dans son propre cadre, la page reste en place */
  .carte-jeu.lecture { flex: 1; min-height: 8rem; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
  :global(body.lecture-ouverte #app) { height: 100dvh; }
  :global(body.lecture-ouverte) .jeu { min-height: 0; }
  :global(body.lecture-ouverte) .zone { flex: 1; min-height: 0; }
  .lecture::-webkit-scrollbar { width: 6px; }
  .lecture::-webkit-scrollbar-thumb { background: rgba(159, 243, 230, 0.4); border-radius: 3px; }
  /* Téléphone en portrait : la page fait exactement la hauteur de l'écran, la carte prend la place qui reste */
  :global(body.ecran-tenu #app) { height: 100dvh; min-height: 0; padding-bottom: calc(env(safe-area-inset-bottom) + 0.6rem); }
  /* Rythme vertical : le même espace entre la barre du haut et la carte */
  :global(body.ecran-tenu) .jeu { min-height: 0; gap: 1.1rem; }
  :global(body.ecran-tenu) .zone { flex: 1; min-height: 0; gap: 1.1rem; }
  :global(body.ecran-tenu) .carte-jeu:not(.lecture) {
    flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0.75rem; gap: 0.6rem; margin-top: 0;
  }
  :global(body.ecran-tenu) .choix { gap: 0.55rem; }
  :global(body.ecran-tenu) .choix-btn { padding-block: 0.7rem; font-size: 1.2rem; }
  :global(body.ecran-tenu) .choix.longs { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  :global(body.ecran-tenu) .choix.longs .choix-btn { padding: 0.55rem 0.45rem; }
  :global(body.ecran-tenu) .choix.emojis .choix-btn { font-size: 2.6rem; padding-block: 0.35rem; }
  :global(body.ecran-tenu) .question { padding: 0; }
  /* La liste des histoires */
  .histoires { gap: 0.3rem; }
  .histoire {
    appearance: none; border: 0; cursor: pointer; display: flex; align-items: center; gap: 0.7rem; width: 100%; text-align: left; flex: none;
    padding: 0.75rem 0.6rem; border-radius: 0.9rem; background: transparent; color: var(--texte); font: inherit; font-size: 1.15rem;
  }
  .histoire + .histoire { box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.1); }
  .histoire:active { background: rgba(255, 255, 255, 0.12); }
  .coche { flex: none; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: grid; place-items: center; border: 2px solid rgba(255, 255, 255, 0.2); }
  .coche.faite { border-color: var(--vert); background: var(--vert); color: #0b3317; }
  .titre-histoire { flex: 1; min-width: 0; font-weight: 600; display: flex; flex-direction: column; line-height: 1.25; }
  .titre-histoire small { font-weight: 400; font-size: 0.85rem; color: var(--doux); }
  .lecture .auteur { text-align: center; color: var(--doux); font-size: 0.95rem; margin-top: -0.6rem; }
  /* une poésie : les vers gardés à la ligne, le poème au milieu de la carte, toutes les strophes alignées à gauche */
  .texte-lecture.poesie { align-self: center; align-items: flex-start; max-width: 100%; }
  .texte-lecture.poesie p { width: auto; max-width: 100%; margin: 0; }
  .mots-histoire { flex: none; color: var(--doux); font-size: 0.95rem; }
  .invisible { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .questions-lecture { gap: 1rem; }
  .haut-lecture { display: flex; align-items: center; gap: 0.6rem; position: relative; z-index: 2; }
  .aides { margin-left: auto; display: flex; gap: 0.4rem; flex: none; }
  .aide-btn {
    appearance: none; cursor: pointer; display: grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.18); background: transparent; color: var(--doux);
  }
  .aide-btn.actif { background: var(--jaune); border-color: var(--jaune); color: #3a2a00; }
  .carte-jeu.lecture { position: relative; }
  .texte-lecture { display: flex; flex-direction: column; gap: 0.9rem; }
  .texte-lecture.couleurs :global(span.l2) { color: #ffe3a3; }
  /* La règle : la ligne en cours reste claire, le reste du texte est assombri */
  .regle-lecture {
    position: absolute; left: 0.4rem; right: 0.4rem; z-index: 1; pointer-events: none; border-radius: 0.5rem; transition: top 0.2s ease, height 0.2s ease;
    background: rgba(255, 210, 61, 0.12); border-top: 2px solid rgba(255, 210, 61, 0.75); border-bottom: 2px solid rgba(255, 210, 61, 0.75);
    box-shadow: 0 0 0 100vmax rgba(13, 27, 62, 0.55);
  }
  .suivante-zone { position: sticky; bottom: 0; z-index: 2; display: flex; justify-content: flex-end; pointer-events: none; }
  .suivante {
    pointer-events: auto; appearance: none; border: 0; cursor: pointer; font: inherit; font-weight: 700; font-size: 1rem;
    padding: 0.6rem 1.1rem; border-radius: 999px; background: var(--jaune); color: #3a2a00; box-shadow: 0 4px 0 rgba(0, 0, 0, 0.35);
  }
  .lecture .fini-lire { position: relative; z-index: 2; }
  .badge-lecture { align-self: flex-start; margin: 0 !important; font-size: 0.95rem !important; font-weight: 700 !important; color: var(--c); }
  .consigne-lecture { margin: 0; text-align: center; color: var(--doux); }
  .lien-relire {
    appearance: none; align-self: center; cursor: pointer; border: 2px solid rgba(159, 243, 230, 0.5); background: transparent;
    color: var(--c); font: inherit; font-weight: 600; font-size: 1rem; padding: 0.4rem 1.1rem; border-radius: 999px; margin-top: auto;
  }
  .lecture .lien-relire { margin-top: 0; align-self: flex-start; }
  /* Le retour à la liste des histoires, en haut à gauche de tous les écrans d'une histoire */
  .vers-liste { margin-top: 0; align-self: flex-start; flex: none; white-space: nowrap; }
  .vers-liste .mot { margin-left: 0.35em; }
  /* Téléphone : la flèche seule, pour que le haut de la carte tienne sur une ligne */
  @media (max-width: 480px) { .vers-liste .mot { display: none; } .haut-lecture .lien-relire { padding-inline: 0.7rem; white-space: nowrap; } }
  .titre-ql { margin: 0; font-size: 1rem; color: var(--c); font-weight: 700; text-align: center; }
  .q-lecture { margin: 0; font-size: clamp(1.3rem, 5vw, 1.7rem); font-weight: 700; text-align: center; line-height: 1.3; }
  .choix-lecture { display: grid; grid-template-columns: 1fr; gap: 0.6rem; }
  .choix-lecture .choix-btn { padding: 0.8rem 0.6rem; }
  .fin-lecture { margin: 0; text-align: center; font-size: 1.2rem; font-weight: 700; }
  .fini-lire { align-self: center; margin-top: 0.4rem; }
  .lecture h2 { font-size: 1.5rem; text-align: center; color: var(--c); margin-bottom: 0.2rem; }
  .lecture p { margin: 0 auto; width: 100%; max-width: 58ch; font-size: clamp(1.15rem, 4.6vw, 1.3rem); line-height: 1.7; font-weight: 400; }
  .carte-jeu {
    /* translucide : le décor se devine derrière, flouté */
    margin-top: 0.2rem; background: color-mix(in srgb, var(--carte) 60%, transparent); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border-radius: 1.4rem; padding: 1rem; display: flex; flex-direction: column; gap: 0.9rem;
    box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3); border-top: 5px solid var(--c);
  }
  .niveau { display: flex; align-items: center; gap: 0.6rem; font-weight: 600; font-size: 0.95rem; }
  /* Hauteur constante, celle de l'exercice le plus haut (l'horloge) : changer d'atelier ne fait rien sauter.
     Les exercices plus courts se centrent dans la carte. */
  .carte-jeu:not(.lecture) { min-height: 29.5rem; }
  .carte-jeu:not(.lecture) > .niveau { margin-bottom: auto; }
  /* En mode chrono, la barre de temps reste collée sous le niveau */
  .carte-jeu:not(.lecture) > .niveau:has(+ .minuteur) { margin-bottom: 0; }
  .carte-jeu:not(.lecture) > .minuteur { margin-bottom: auto; margin-top: 0; }
  .carte-jeu:not(.lecture) > :last-child { margin-bottom: auto; }
  .barre { flex: 1; display: flex; gap: 3px; }
  .niveau-fixe { white-space: nowrap; }
  .choix-niveau { display: inline-flex; align-items: center; gap: 0.25rem; flex: none; }
  .niveau-btn {
    appearance: none; border: 0; cursor: pointer; font: inherit; font-weight: 600; color: var(--texte); white-space: nowrap;
    background: rgba(255, 255, 255, 0.1); border-radius: 999px; padding: 0.25rem 0.7rem;
  }
  .niveau-btn.ouvert { background: var(--c); color: #1a1033; }
  .fleche {
    appearance: none; border: 0; cursor: pointer; width: 2rem; height: 2rem; border-radius: 50%; font-size: 1.4rem; font-weight: 700;
    line-height: 1; background: rgba(255, 255, 255, 0.15); color: var(--texte); display: grid; place-items: center;
  }
  .fleche:disabled { opacity: 0.3; cursor: default; }
  .barre span { flex: 1; height: 0.55rem; border-radius: 999px; background: rgba(255, 255, 255, 0.13); transition: background 0.3s; }
  .barre .plein { background: var(--c); }
  .combo { color: var(--orange); font-weight: 700; }
  .bouton-chrono {
    appearance: none; flex: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem;
    border: 2px solid rgba(255, 255, 255, 0.18); background: transparent; color: var(--doux);
    border-radius: 999px; padding: 0.25rem 0.55rem; font: inherit; font-weight: 700; font-size: 0.95rem;
  }
  .bouton-chrono.actif { background: var(--jaune); border-color: var(--jaune); color: #3a2a00; }

  .minuteur { height: 0.7rem; background: rgba(255, 255, 255, 0.12); border-radius: 999px; overflow: hidden; margin-top: -0.3rem; }
  .minuteur div { height: 100%; background: var(--vert); transition: width 0.1s linear, background 0.3s; }
  .minuteur .moitie { background: var(--jaune); }
  .minuteur .urgent { background: var(--rouge); }

  .dessin { text-align: center; font-size: 1.55rem; line-height: 1.35; letter-spacing: 0.05em; word-break: break-all; }
  .dessin div + div { margin-top: 0.3rem; }
  .indice { margin: 0; text-align: center; color: var(--jaune); font-size: 1.15rem; }
  .demande-indice {
    appearance: none; align-self: center; cursor: pointer; border: 2px dashed rgba(255, 210, 61, 0.6); background: transparent;
    color: var(--jaune); font-weight: 600; font-size: 1rem; padding: 0.35rem 1rem; border-radius: 999px;
  }
  /* Deuxième chance : le message se voit bien, sans rouge */
  .encore { margin: 0 auto; padding: 0.45rem 1.4rem; border-radius: 999px; background: var(--jaune); color: #2b2100; font-size: 1.5rem; font-weight: 700; animation: hop 0.35s ease; }
  .explication { margin: 0; text-align: center; color: var(--jaune); font-size: 1.15rem; font-weight: 400; }

  /* Les mêmes tailles dans tous les ateliers (celles des synonymes) : l'énoncé (--enonce), la consigne (1.1rem, gris-bleu),
     les réponses (--reponse, en gras). */
  .carte-jeu { --enonce: clamp(1.35rem, 6vw, 1.8rem); --reponse: 1.3rem; }
  .question { text-align: center; font-size: var(--enonce); font-weight: 400; line-height: 1.4; padding: 0.3rem 0; }
  .consigne { margin: -0.5rem 0 0; text-align: center; color: var(--doux); font-size: 1.1rem; }
  .correction { margin: 0; text-align: center; font-size: 2rem; font-weight: 700; color: var(--jaune); }
  /* Dictée : le mot corrigé en lettres attachées, comme au tableau */
  .correction.cursive { font-family: var(--cursive); font-weight: 400; font-size: 1.8rem; line-height: 1.8; }

  /* le son à écouter (dictée, anglais) : un bouton qui a l'allure du mot surligné des synonymes */
  .son-mot {
    appearance: none; border: 0; cursor: pointer; font: inherit; font-size: var(--enonce); font-weight: 700; line-height: 1.2;
    display: inline-flex; align-items: center; gap: 0.3em; vertical-align: middle;
    background: var(--jaune); color: #1a1033; padding: 0.1em 0.5em; border-radius: 0.4em; box-shadow: 0 4px 0 rgba(0, 0, 0, 0.35);
  }
  .son-mot:active { transform: translateY(3px); box-shadow: 0 1px 0 rgba(0, 0, 0, 0.35); }
  .reecouter {
    appearance: none; border: 0; cursor: pointer; align-self: center; display: flex; padding: 0.35rem 0.9rem; margin-top: -0.4rem;
    border-radius: 999px; background: rgba(255, 255, 255, 0.12); color: var(--c);
  }

  .choix { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }
  .horloge { display: flex; justify-content: center; }
  .visuel { display: flex; justify-content: center; }
  /* Capitales : le drapeau toujours à côté du nom du pays ; un nom long passe sur deux lignes, le drapeau reste à côté */
  /* posé sur la ligne d'écriture (centré, il paraît trop haut : Andika laisse beaucoup de place sous les lettres) ;
     sur deux lignes, sur la dernière (« last baseline », sinon la première) */
  .question.avec-drapeau { display: flex; align-items: baseline; align-items: last baseline; justify-content: center; gap: 0.35em; }
  .drapeau.petit { flex-shrink: 0; margin: 0; height: 0.6em; width: auto; aspect-ratio: 3 / 2; border-radius: 0.1em; filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.3)); }
  .consigne.forte { color: var(--texte); font-size: var(--enonce); line-height: 1.4; margin: 0; } /* la question sous une image : c'est l'énoncé */
  .image-choix { display: block; margin: 0 auto; height: 3.4rem; max-width: 100%; object-fit: contain; }
  .choix.emojis .choix-btn { font-size: 3.2rem; padding: 0.5rem; line-height: 1.1; }
  .choix.longs { grid-template-columns: 1fr; gap: 0.5rem; }
  .choix.longs .choix-btn { padding-inline: 0.8rem; }
  .phrase { margin: 0.3rem 0 0; text-align: center; font-size: var(--enonce); font-weight: 400; line-height: 1.4; }
  .phrase mark, .question mark { background: var(--jaune); color: #1a1033; padding: 0.05em 0.35em; border-radius: 0.4em; font-weight: 700; }
  /* la case à remplir (homophones, temps, et le « ? » des calculs) */
  mark.trou { background: rgba(255, 210, 61, 0.25); color: var(--jaune); border: 2px dashed var(--jaune); }
  .choix-btn {
    appearance: none; border: 0; cursor: pointer; font: inherit; font-size: var(--reponse); font-weight: 700; line-height: 1.2; padding: 0.9rem 0.4rem;
    border-radius: 1.1rem; background: var(--blanc-bouton); color: #1a1033; box-shadow: 0 5px 0 rgba(0, 0, 0, 0.35);
    transition: transform 0.08s, background 0.2s, opacity 0.2s;
  }
  .choix-btn:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 1px 0 rgba(0, 0, 0, 0.35); }
  .choix-btn:disabled { cursor: default; }
  .choix-btn.bon { background: var(--vert); color: #0b3317; animation: hop 0.35s ease; }
  .choix-btn.eteint { opacity: 0.35; }
  /* une image en réponse (drapeau, photo) : le bouton prend l'allure des cartes d'image (Visuel.svelte) */
  .choix-btn.carte-choix { background: var(--carte); border: 3px solid var(--doux); border-radius: 1.4rem; padding: 0.7rem 0.5rem; }
  .choix-btn.carte-choix.bon { background: var(--vert); border-color: var(--vert); }
  .carte-choix .image-choix { height: 4.6rem; }
  /* un drapeau en réponse : le format 3:2 de tous les drapeaux, coins arrondis comme sur la carte */
  .drapeau-choix { width: auto; aspect-ratio: 3 / 2; object-fit: fill; border-radius: 0.3rem; }
  @keyframes hop { 50% { scale: 1.08; } }

  form { display: flex; gap: 0.6rem; }
  /* le champ où l'on écrit : la case à remplir (comme le trou des homophones) */
  input {
    flex: 1; min-width: 0; font: inherit; font-size: var(--enonce); font-weight: 700; text-align: center; padding: 0.5rem;
    border-radius: 1.1rem; border: 2px dashed var(--jaune); background: rgba(255, 210, 61, 0.12); color: var(--jaune); outline: none;
  }
  input::placeholder { color: rgba(255, 210, 61, 0.55); }
  input:focus { background: rgba(255, 210, 61, 0.2); }
  input.bon { border: 2px solid var(--vert); color: var(--vert); background: rgba(91, 227, 125, 0.12); }
  .ok {
    appearance: none; border: 0; cursor: pointer; background: var(--jaune); color: #3a2a00; font-weight: 700; font-size: 1.3rem;
    padding: 0 1.3rem; border-radius: 1.1rem; box-shadow: 0 5px 0 rgba(0, 0, 0, 0.35);
  }
  .ok:disabled { opacity: 0.45; }

  .fete {
    position: fixed; left: 50%; top: 40%; translate: -50% -50%; z-index: 20; pointer-events: none;
    background: var(--jaune); color: #3a2a00; padding: 1.2rem 2rem; border-radius: 1.5rem; text-align: center;
    display: flex; flex-direction: column; gap: 0.3rem; box-shadow: 0 8px 0 rgba(0, 0, 0, 0.35);
    animation: arrive 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); max-width: calc(100vw - 2rem);
  }
  .fete strong { font-size: 2rem; white-space: nowrap; }
  .fete span { font-weight: 400; font-size: 1.1rem; }
  @keyframes arrive { from { scale: 0.3; opacity: 0; } }
  .confetti { position: fixed; top: -2rem; font-size: 1.6rem; pointer-events: none; z-index: 19; animation: tombe 2.4s ease-in forwards; }
  @keyframes tombe { to { translate: 0 110vh; rotate: 540deg; } }

  @media (prefers-reduced-motion: reduce) { .confetti { display: none; } }
</style>
