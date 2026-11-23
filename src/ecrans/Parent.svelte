<script>
  import { app, sauver, euros, enPoints, parUnite, hacher, moisCourant, serieJours, etatInitial, jourCle, pseudoPris, changerJoueur, supprimerJoueur, copieDeSauvegarde, sauvegardeFaite, restaurer } from '../lib/etat.svelte.js';
  import ChoixProfil from '../composants/ChoixProfil.svelte';
  import { idAvatar } from '../lib/avatars.js';
  import { matieres } from '../questions/index.js';
  import Icone from '../composants/Icone.svelte';
  import ChoixUnivers from '../composants/ChoixUnivers.svelte';
  import Mentions from '../composants/Mentions.svelte';
  import { sons, sonActif, basculerSon } from '../lib/sons.js';
  import { fixerNiveau, pointsFaibles, niveauMax } from '../lib/progression.js';
  import { nomNiveau } from '../lib/phrases.js';

  let { aller } = $props();

  const etat = $derived(app.etat);
  let pin = $state('');
  let pin2 = $state('');
  let ouvert = $state(false);
  let erreur = $state('');
  let confirmer = $state(null); // action en attente de seconde pression
  let note = $state('');

  const creation = $derived(!app.etat.reglages.pinHash);

  // Code oublié : une multiplication d'adulte (deux nombres à deux chiffres), puis on choisit un nouveau code.
  // Rien n'est perdu. Un enfant décidé pourrait la faire à la calculatrice : le changement reste donc affiché
  // aux parents (date dans l'espace parents), pour qu'ils le remarquent.
  let oubli = $state(null); // null, ou { a, b, reponse }
  const auHasard = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  function codeOublie() {
    erreur = '';
    let a, b;
    do { a = auHasard(13, 49); b = auHasard(13, 39); } while (a % 10 === 0 || b % 10 === 0 || a === b);
    oubli = { a, b, reponse: '' };
  }
  function verifierOubli(e) {
    e.preventDefault();
    if (Number(String(oubli.reponse).replace(/\s/g, '')) !== oubli.a * oubli.b) {
      codeOublie();
      erreur = 'Ce n’est pas le bon résultat. Voici un autre calcul.';
      return;
    }
    app.etat.reglages.pinHash = null;
    app.etat.reglages.codeOublie = Date.now();
    sauver();
    oubli = null;
    erreur = '';
    pin = '';
    pin2 = '';
  }

  function entrer(e) {
    e.preventDefault();
    if (creation) {
      if (!/^\d{4,6}$/.test(pin)) { erreur = 'Choisis 4 à 6 chiffres.'; return; }
      if (pin !== pin2) { erreur = 'Les deux codes ne sont pas pareils.'; return; }
      app.etat.reglages.pinHash = hacher(pin);
      sauver();
      ouvert = true;
    } else if (hacher(pin) === app.etat.reglages.pinHash) {
      ouvert = true;
    } else {
      erreur = 'Code incorrect.';
      pin = '';
    }
  }

  // Deux pressions pour les actions importantes (pas de fenêtre de confirmation).
  function deuxFois(cle, action) {
    if (confirmer === cle) { confirmer = null; action(); }
    else { confirmer = cle; setTimeout(() => { if (confirmer === cle) confirmer = null; }, 4000); }
  }

  function flash(texte) { note = texte; setTimeout(() => (note = ''), 2500); }

  // --- Réglages des gains, en euros ou en points (les montants sont stockés en centimes : 1 point = 1 centime)
  const champs = [
    ['gainReponse', 'Par bonne réponse (le double en mode chrono)', 0, 100],
    ['gainNiveau', 'Nouveau niveau atteint (la première fois)', 0, 1000],
    ['gainLecture', 'Lecture validée : toutes les réponses justes', 0, 1000],
  ];
  const lireReglages = () => Object.fromEntries(champs.map(([k]) => [k, app.etat.reglages[k] / parUnite()]));
  let reglages = $state(lireReglages());
  function enregistrerReglages() {
    for (const [k, , min, max] of champs) {
      const c = Math.min(max, Math.max(min, Math.round((Number(reglages[k]) || 0) * parUnite())));
      app.etat.reglages[k] = c;
      reglages[k] = c / parUnite();
    }
    sauver();
    flash('Réglages enregistrés.');
  }
  // Euros ou points : rien n'est converti, 1 € devient 100 points (et l'inverse)
  function changerUnite(unite) {
    if (app.etat.reglages.unite === unite) return;
    app.etat.reglages.unite = unite;
    reglages = lireReglages();
    sauver();
    flash(unite === 'points' ? 'La tirelire compte maintenant en points.' : 'La tirelire compte maintenant en euros.');
  }

  // --- Ajouter ou retirer de l'argent (un bonus, une punition…) : la ligne apparaît dans la tirelire de l'enfant
  let ajustement = $state('');
  let raison = $state('');
  function ajuster(sens) {
    const c = Math.round(Math.abs(Number(ajustement)) * parUnite()) * sens;
    const reel = Math.max(-etat.tirelire.solde, c); // la tirelire ne descend jamais sous zéro
    if (!reel) return;
    app.etat.tirelire.solde += reel;
    const motif = `${reel < 0 ? 'Retiré' : 'Ajouté'} par les parents${raison.trim() ? ` : ${raison.trim()}` : ''}`;
    app.etat.tirelire.journal.unshift({ t: Date.now(), montant: reel, motif });
    ajustement = '';
    raison = '';
    sauver();
    flash(`${euros(Math.abs(reel))} ${reel < 0 ? 'retirés de' : 'ajoutés à'} la tirelire.`);
  }
  // Remettre la tirelire à zéro (sans encaisser)
  function viderTirelire() {
    const solde = etat.tirelire.solde;
    if (!solde) return;
    app.etat.tirelire.solde = 0;
    app.etat.tirelire.journal.unshift({ t: Date.now(), montant: -solde, motif: 'Remise à zéro par les parents' });
    sauver();
    flash('Tirelire remise à zéro.');
  }

  function niveau(m, n) {
    fixerNiveau(app.etat, m.id, n, niveauMax(m));
    sauver();
    flash(`${m.nom} : ${nomNiveau(Math.max(1, n), niveauMax(m)).toLowerCase()}.`);
  }

  // Les 7 derniers jours : bonnes réponses / erreurs par matière.
  const derniersJours = $derived(Array.from({ length: 7 }, (_, k) => {
    const d = new Date();
    d.setDate(d.getDate() - k);
    return { d, j: etat.jours[jourCle(d)] };
  }).filter((x) => x.j));

  function toutRecommencer() {
    const garder = { reglages: app.etat.reglages, profil: app.etat.profil, univers: app.etat.univers };
    app.etat = { ...etatInitial(), ...garder };
    sauver();
    aller();
  }

  // Pseudo et avatar
  let nouveauPseudo = $state(app.etat.profil?.pseudo ?? '');
  let nouvelAvatar = $state(idAvatar(app.etat.profil?.avatar));
  function enregistrerProfil() {
    const pseudo = nouveauPseudo.trim().slice(0, 20);
    if (!pseudo) return;
    if (pseudoPris(pseudo, app.joueur)) { flash('Ce pseudo est déjà pris sur cet appareil : choisis-en un autre.'); return; }
    app.etat.profil = { pseudo, avatar: nouvelAvatar };
    sauver();
    flash('Profil enregistré.');
  }

  // --- Copie de sauvegarde : tous les joueurs de l'appareil dans un fichier, que les parents gardent.
  function telecharger() {
    const copie = copieDeSauvegarde();
    const blob = new Blob([JSON.stringify(copie, null, 1)], { type: 'application/json' });
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(blob);
    lien.download = `gaby-sauvegarde-${jourCle()}.json`;
    document.body.append(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(lien.href), 10000);
    sauvegardeFaite();
    flash('Copie de sauvegarde enregistrée.');
  }
  async function fichierChoisi(e) {
    const fichier = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!fichier) return;
    const n = restaurer(await fichier.text());
    if (n === null) { flash('Ce fichier n’est pas une sauvegarde de Gaby.'); return; }
    flash(`${n} joueur${n > 1 ? 's' : ''} repris de la sauvegarde.`);
  }
  const ilYa = (t) => {
    const jours = Math.floor((Date.now() - t) / 86400000);
    return jours === 0 ? 'aujourd’hui' : jours === 1 ? 'hier' : `il y a ${jours} jours`;
  };

  // Les bruitages (sur cet appareil). La dictée et l'anglais parlent toujours : sans le son, pas d'exercice.
  let son = $state(sonActif());
  function choisirSon(oui) {
    if (oui === son) return;
    son = basculerSon();
    sons.clic();
  }

  const gagneCeMois = $derived(etat.tirelire.mois === moisCourant() ? etat.tirelire.gagneMois : 0);
  const taux = $derived(etat.stats.reponses ? Math.round((etat.stats.bonnes / etat.stats.reponses) * 100) : 0);
  const date = (ms) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const jourTexte = (d) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  // Les clés des faits : x: tables, d: divisions, s: synonymes, o: homophones, h: heure, m: calcul, e: dictée, c: capitales, f: drapeaux
  const fait = (cle) => {
    const [type, ...reste] = cle.split(':');
    const v = reste.join(':');
    if (type === 'x') return v.replace('x', ' × ');
    if (type === 'd') return v.replace('/', ' ÷ ');
    if (type === 's') return v.replaceAll('*', '');
    return v;
  };
  const aujourdhui = $derived(Object.values(etat.jours[jourCle()] ?? {}).reduce((s, x) => s + x.ok + x.ko, 0));
</script>

<header>
  <button class="retour" onclick={aller}>← Retour</button>
  <h1>Réglages</h1>
</header>

<!-- Deux parties bien séparées : ce que l'enfant règle lui-même (sans code), puis l'espace des parents (avec le code) -->
<div class="partie">
  <h2>Pour toi</h2>
  <p>Le son, ton pseudo et ton avatar, ton univers, et comment marche Gaby. Pas besoin de code.</p>
</div>

<!-- Les bruitages : au choix de l'enfant, sans code -->
<section class="carte aide">
  <h2>Le son</h2>
  <div class="choix-son">
    <button type="button" class="tuile-son" class:choisi={son} aria-pressed={son} onclick={() => choisirSon(true)}><Icone nom="son" taille={26} /><span>Avec les bruitages</span></button>
    <button type="button" class="tuile-son" class:choisi={!son} aria-pressed={!son} onclick={() => choisirSon(false)}><Icone nom="muet" taille={26} /><span>Sans</span></button>
  </div>
  <p class="note-son">La dictée et l’anglais parlent toujours.</p>
</section>

<!-- Le profil : anonyme, modifiable sans code -->
<section class="carte aide profil">
  <h2>Mon profil</h2>
  <ChoixProfil bind:pseudo={nouveauPseudo} bind:avatar={nouvelAvatar} />
  <button class="bouton jaune large" onclick={enregistrerProfil}>Enregistrer</button>
  <button class="bouton discret large" onclick={() => { changerJoueur(); aller(); }}>Changer de joueur</button>
</section>

<!-- L'univers : au choix de l'enfant, sans code -->
<section class="carte aide">
  <h2>Mon univers</h2>
  <ChoixUnivers />
</section>

<!-- Notice et légende : lisibles par tout le monde, sans code -->
<details class="carte aide" open>
  <summary>Comment ça marche ?</summary>
  <ul>
    <li><span class="puce">{enPoints() ? '⭐' : '💶'}</span> <span><strong>Ta tirelire</strong> : elle se remplit jour après jour, à chaque bonne réponse. Elle est en haut de l’écran ; touche-la pour voir le détail.</span></li>
    <li><Icone nom="piece" taille={20} /> <span><strong>Chaque bonne réponse</strong> : +{euros(etat.reglages.gainReponse)}. Une erreur ne coûte rien, jamais.</span></li>
    <li><span class="puce">2</span> <span><strong>Deuxième chance</strong> : à la première erreur, on réessaie. Juste au deuxième essai : +{euros(Math.round(etat.reglages.gainReponse / 2))}, et le niveau ne bouge pas (sauf en mode chrono).</span></li>
    <li><Icone nom="chrono" taille={20} /> <span><strong>Mode chrono</strong> : touche ⏱ dans un atelier (sauf la lecture). Tu as un temps pour répondre, et chaque bonne réponse rapporte le double.</span></li>
    <li><Icone nom="livre" taille={20} /> <span><strong>Lecture</strong> : choisis une histoire, lis-la tranquillement, touche « J’ai fini de lire » et réponds aux 3 questions. Tout juste : +{euros(etat.reglages.gainLecture)}, une seule fois par histoire. Pas de chrono ici : ce qui compte, c’est de bien comprendre.</span></li>
    <li><span class="puce">10</span> <span><strong>Niveaux</strong> : 10 bonnes réponses pour monter. Chaque nouveau niveau : +{euros(etat.reglages.gainNiveau)}. 3 erreurs d’affilée : on redescend d’un niveau. Après le dernier niveau vient le <strong>niveau max 🏆</strong> : tout est mélangé.</span></li>
    <li><span class="puce">‹ ›</span> <span>Au début de chaque atelier, 7 bonnes réponses d’affilée font sauter un niveau, jusqu’à la première erreur : ton niveau se règle tout seul. Tu peux aussi toucher « <strong>Niveau</strong> » pour le changer. Les niveaux sautés ne rapportent rien.</span></li>
    <li><span class="puce">🎲</span> <span><strong>Ton pseudo</strong> : jamais ton vrai nom. Touche 🎲 pour en tirer un au hasard. Pas de compte, ni nom, ni e-mail, ni photo : tout reste sur cet appareil, rien n’est envoyé ailleurs.</span></li>
    <li><span class="puce">👥</span> <span><strong>Plusieurs enfants</strong> : chacun son joueur, sur le même appareil. Touche ton avatar en haut (ou « Changer de joueur » ici) pour passer la main.</span></li>
    <li><span class="puce">✓</span> <span><strong>Encaisser</strong> : touche ta tirelire, puis « Encaisser ». Tu choisis combien, et papa ou maman valide avec son code. Quand et pour quoi ? C’est papa ou maman qui décide des règles de la maison. Ils peuvent aussi ajouter ou retirer {enPoints() ? 'des points' : 'de l’argent'}.</span></li>
  </ul>
</details>

<details class="carte aide">
  <summary>Les icônes</summary>
  <div class="legende">
    {#each [
      ['aleatoire', 'Aléatoire : tous les ateliers courts mélangés'], ['chrono', 'Mode chrono : un temps pour répondre, gains doublés'], ...matieres.map((m) => [m.id, `${m.nom} : ${m.description}`]),
      
      ['piece', 'Ta tirelire'], ['reglages', 'Réglages'],
    ] as [icone, texte]}
      <div class="ligne-legende"><span class="icone-legende"><Icone nom={icone} taille={22} /></span><span>{texte}</span></div>
    {/each}
  </div>
</details>

<div class="partie parents">
  <h2>Pour les parents <span aria-hidden="true">🔒</span></h2>
  <p>
    Tout ce qui touche à la tirelire est protégé par un code que l’enfant ne connaît pas : encaisser la tirelire,
    ajouter ou retirer {enPoints() ? 'des points' : 'de l’argent'}, régler les gains et les niveaux, la copie de sauvegarde, remettre à zéro ou
    supprimer un joueur. Un seul code pour tous les joueurs de cet appareil.
  </p>
</div>

{#if !ouvert && oubli}
  <form class="carte verrou" onsubmit={verifierOubli}>
    <p>Code oublié ? Pour vérifier qu’un adulte est là, calculez :</p>
    <p class="calcul">{oubli.a} × {oubli.b} = ?</p>
    <input bind:value={oubli.reponse} inputmode="numeric" autocomplete="off" placeholder="Résultat" aria-label="Résultat du calcul" />
    {#if erreur}<p class="erreur">{erreur}</p>{/if}
    <button class="bouton jaune">Choisir un nouveau code</button>
    <button type="button" class="lien" onclick={() => { oubli = null; erreur = ''; }}>Retour</button>
  </form>
{:else if !ouvert}
  <form class="carte verrou" onsubmit={entrer}>
    <p>{creation ? 'Choisissez votre code parent (4 à 6 chiffres). Il sera demandé à chaque encaissement et pour ouvrir cet espace.' : 'Votre code parent :'}</p>
    <input bind:value={pin} type="password" inputmode="numeric" autocomplete="off" placeholder="Code" aria-label="Code parent" />
    {#if creation}
      <input bind:value={pin2} type="password" inputmode="numeric" autocomplete="off" placeholder="Encore une fois" aria-label="Confirmer le code" />
    {/if}
    {#if erreur}<p class="erreur">{erreur}</p>{/if}
    <button class="bouton jaune">{creation ? 'Créer' : 'Entrer'}</button>
    {#if !creation}<button type="button" class="lien" onclick={codeOublie}>Code oublié ?</button>{/if}
  </form>
{:else}
  {#if note}<div class="note">{note}</div>{/if}
  {#if etat.reglages.codeOublie}
    <p class="carte alerte">
      Le code parent a été changé avec « Code oublié ? » le {date(etat.reglages.codeOublie)}.
      <button class="lien" onclick={() => { app.etat.reglages.codeOublie = null; sauver(); }}>C’était bien nous</button>
    </p>
  {/if}

  <section class="carte">
    <h2>La tirelire : {euros(etat.tirelire.solde)}</h2>
    <p class="doux">Ajouter ou retirer {enPoints() ? 'des points' : 'de l’argent'}, par exemple un bonus ou une punition. L’enfant voit la ligne dans sa tirelire.</p>
    <div class="ajuster">
      <input type="number" bind:value={ajustement} min="0" step={enPoints() ? 1 : 0.5} inputmode={enPoints() ? 'numeric' : 'decimal'} placeholder={enPoints() ? 'Nombre de points' : 'Montant en €'} aria-label={enPoints() ? 'Nombre de points' : 'Montant en euros'} />
      <input type="text" bind:value={raison} maxlength="40" placeholder="Pourquoi ? (facultatif)" aria-label="Raison" class="raison" />
    </div>
    <div class="ajuster">
      <button class="bouton discret" disabled={!Number(ajustement) || !etat.tirelire.solde} onclick={() => ajuster(-1)}>− Retirer</button>
      <button class="bouton discret" disabled={!Number(ajustement)} onclick={() => ajuster(1)}>+ Ajouter</button>
    </div>
    <button class="bouton jaune large" onclick={() => aller('tirelire')}>Ouvrir la tirelire (encaisser)</button>
    <button class="bouton discret large" disabled={!etat.tirelire.solde} onclick={() => deuxFois('vider', viderTirelire)}>
      {confirmer === 'vider' ? `Appuie encore : la tirelire (${euros(etat.tirelire.solde)}) repart de zéro` : 'Remettre la tirelire à zéro'}
    </button>
  </section>

  <section class="carte">
    <h2>Encaissements</h2>
    {#each etat.encaissements.slice(0, 15) as e}
      <div class="ligne"><span>{date(e.t)}</span><strong>{euros(e.montant)}</strong></div>
    {:else}
      <p class="doux">Pas encore d’encaissement.</p>
    {/each}
  </section>

  <section class="carte resume">
    <div><strong>{euros(etat.tirelire.solde)}</strong><span>tirelire</span></div>
    <div><strong>{euros(gagneCeMois)}</strong><span>gagnés ce mois</span></div>
    <div><strong>{aujourdhui}</strong><span>réponses aujourd’hui</span></div>
    <div><strong>{taux} %</strong><span>bonnes réponses</span></div>
    <div><strong>{serieJours(etat)}</strong><span>jours d’affilée</span></div>
    <div><strong>{euros(etat.encaissements.reduce((s, e) => s + e.montant, 0))}</strong><span>déjà encaissés</span></div>
  </section>

  <section class="carte">
    <h2>Points faibles</h2>
    {#each pointsFaibles(etat) as f}
      <div class="ligne"><span>{fait(f.cle)}</span><span class="doux">{f.ko} raté{f.ko > 1 ? 's' : ''} · {f.ok} réussi{f.ok > 1 ? 's' : ''}</span></div>
    {:else}
      <p class="doux">Rien à signaler pour l’instant.</p>
    {/each}
  </section>

  <section class="carte">
    <h2>Niveaux</h2>
    {#each [{ id: 'aleatoire', nom: 'Aléatoire' }, ...matieres.filter((x) => !x.lecture)] as m}
      {@const info = etat.matieres[m.id] ?? { niveau: 1, max: 1 }}
      <div class="ligne">
        <span><Icone nom={m.id} taille={18} /> {m.nom} : <strong>{nomNiveau(Math.min(info.niveau, niveauMax(m)), niveauMax(m)).toLowerCase()}</strong> <small class="doux">sur {niveauMax(m) - 1} niveaux</small></span>
        <span class="boutons">
          <button class="bouton discret petit" disabled={info.niveau <= 1} onclick={() => niveau(m, info.niveau - 1)}>−1</button>
          <button class="bouton discret petit" disabled={info.niveau <= 1} onclick={() => deuxFois(`zero-${m.id}`, () => niveau(m, 1))}>
            {confirmer === `zero-${m.id}` ? 'Sûr ?' : 'Niveau 1'}
          </button>
        </span>
      </div>
    {/each}
    <p class="doux petit-texte">Chaque nouveau niveau rapporte un bonus, seulement la première fois : redescendre puis remonter ne rapporte rien.</p>
  </section>

  <section class="carte">
    <h2>Ces derniers jours</h2>
    {#each derniersJours as { d, j }}
      <div class="ligne">
        <span>{jourTexte(d)}</span>
        <span class="doux">
          {#each matieres.filter((m) => j[m.id]) as m}
            <Icone nom={m.id} taille={18} /> {j[m.id].ok}✓ {j[m.id].ko}✗&nbsp;&nbsp;
          {/each}
        </span>
      </div>
    {:else}
      <p class="doux">Pas encore joué.</p>
    {/each}
  </section>

  <!-- Pas de compte : la progression n'existe que sur cet appareil. La copie de sauvegarde la met à l'abri. -->
  <section class="carte">
    <h2>Copie de sauvegarde</h2>
    <p class="doux">
      La progression de tous les joueurs reste sur cet appareil. Si le navigateur efface ses données, elle est perdue :
      gardez une copie (dans Fichiers, par e-mail…), elle permet aussi de passer sur un autre appareil.
      Ajoutez Gaby à l’écran d’accueil (Partager › Sur l’écran d’accueil) : Safari n’efface pas les données de ses apps.
    </p>
    <p class="doux petit-texte">Dernière copie : <strong>{app.sauvegarde ? ilYa(app.sauvegarde) : 'jamais'}</strong></p>
    <button class="bouton jaune large" onclick={telecharger}>Enregistrer une copie</button>
    <label class="bouton discret large fichier">Reprendre une copie<input type="file" accept=".json,application/json" onchange={fichierChoisi} hidden /></label>
  </section>

  <section class="carte">
    <h2>Gains</h2>
    <!-- L'argent motive et apprend sa valeur ; certaines familles préfèrent des points. Les montants restent les mêmes. -->
    <div class="unite" role="radiogroup" aria-label="La tirelire compte en">
      <button class="bouton" class:jaune={!enPoints()} class:discret={enPoints()} role="radio" aria-checked={!enPoints()} onclick={() => changerUnite('euros')}>💶 En euros</button>
      <button class="bouton" class:jaune={enPoints()} class:discret={!enPoints()} role="radio" aria-checked={enPoints()} onclick={() => changerUnite('points')}>⭐ En points</button>
    </div>
    <p class="doux petit-texte">{enPoints() ? '100 points valent 1 € : en repassant en euros, rien n’est perdu.' : 'En points, 1 € devient 100 points : rien n’est perdu.'}</p>
    {#each champs as [k, label, min, max]}
      <label class="reglage">
        <span>{label} ({enPoints() ? 'points' : '€'})</span>
        <input type="number" bind:value={reglages[k]} min={min} max={max / parUnite()} step={1 / parUnite()} inputmode={enPoints() ? 'numeric' : 'decimal'} />
      </label>
    {/each}
    <button class="bouton jaune large" onclick={enregistrerReglages}>Enregistrer</button>
  </section>

  <section class="carte danger">
    <h2>Zone sensible</h2>
    <button class="bouton discret large" onclick={() => deuxFois('tout', toutRecommencer)}>
      {confirmer === 'tout' ? 'Appuie encore : TOUT effacer (tirelire, progrès)' : 'Tout recommencer à zéro'}
    </button>
    <button class="bouton discret large" onclick={() => deuxFois('code', () => { app.etat.reglages.pinHash = null; sauver(); aller(); })}>
      {confirmer === 'code' ? 'Appuie encore pour confirmer' : 'Changer le code parent'}
    </button>
    <button class="bouton discret large rouge" onclick={() => deuxFois('suppr', () => { supprimerJoueur(); aller(); })}>
      {confirmer === 'suppr' ? `Appuie encore : effacer ${app.etat.profil.pseudo}, définitivement` : `Supprimer le joueur ${app.etat.profil.pseudo}`}
    </button>
  </section>
{/if}

<!-- Mentions légales, confidentialité et licences : lisibles par tout le monde, sans code -->
<Mentions />

<style>
  .unite { display: flex; gap: 0.6rem; }
  .unite .bouton { flex: 1; }
  .choix-son { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .tuile-son {
    appearance: none; cursor: pointer; font: inherit; font-weight: 600; font-size: 0.95rem; color: var(--texte);
    display: flex; flex-direction: column; align-items: center; gap: 0.25rem; padding: 0.6rem 0.3rem;
    border: 3px solid transparent; border-radius: 1rem; background: rgba(255, 255, 255, 0.08);
  }
  .tuile-son.choisi { border-color: var(--jaune); }
  .note-son { margin: 0; font-size: 0.9rem; color: var(--doux); }
  header { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.9rem; }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.1rem; margin-bottom: 0.6rem; }
  section { margin-bottom: 0.9rem; }
  .verrou { display: flex; flex-direction: column; gap: 0.7rem; }
  /* Titres des deux parties : « Pour toi » (sans code) et « Pour les parents » (avec le code) */
  .partie { margin: 1.4rem 0 0.7rem; padding-bottom: 0.4rem; border-bottom: 2px solid rgba(255, 255, 255, 0.15); }
  .partie:first-of-type { margin-top: 0.4rem; }
  .partie h2 { font-size: 1.35rem; margin: 0 0 0.2rem; }
  .partie p { margin: 0; color: var(--doux); font-size: 0.92rem; line-height: 1.4; }
  .partie.parents { margin-top: 2rem; border-bottom-color: var(--jaune); }
  .verrou p { margin: 0; }
  .calcul { font-size: 1.6rem; font-weight: 700; text-align: center; color: var(--jaune); }
  .lien { appearance: none; border: 0; background: none; color: var(--doux); text-decoration: underline; cursor: pointer; font: inherit; }
  .alerte { margin: 0 0 0.9rem; font-size: 0.92rem; border: 2px solid var(--jaune); }
  input {
    font: inherit; font-size: 1.1rem; padding: 0.6rem 0.8rem; border-radius: 0.8rem;
    border: 2px solid var(--doux); background: var(--fond-2); color: var(--texte); min-width: 0;
  }
  .erreur { color: var(--rouge); }
  .note { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--vert); color: #0b3317; padding: 0.6rem 1rem; border-radius: 0.8rem; margin-bottom: 0.8rem; font-weight: 600; }
  .doux { color: var(--doux); font-size: 0.9rem; margin: 0; }
  .petit-texte { font-size: 0.8rem; margin-top: 0.5rem; }
  .petit { padding: 0.4rem 0.7rem; font-size: 0.9rem; flex: none; }
  .large { width: 100%; margin-top: 0.5rem; }
  .boutons { display: flex; gap: 0.4rem; }
  .resume { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; text-align: center; }
  .resume div { display: flex; flex-direction: column; }
  .resume strong { font-size: 1.15rem; color: var(--jaune); }
  .resume span { font-size: 0.75rem; color: var(--doux); }
  .ligne { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding: 0.4rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.95rem; }
  .ligne small { display: block; }
  .reglage { display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; padding: 0.3rem 0; font-size: 0.95rem; }
  .reglage input { width: 6rem; text-align: right; }
  .ajuster { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
  .ajuster input { flex: 1; min-width: 0; }
  .ajuster .raison { flex: 2; }
  .ajuster .bouton { flex: 1; }
  .danger .bouton { font-size: 0.95rem; }
  .danger .rouge { color: var(--rouge); }
  .profil { display: flex; flex-direction: column; gap: 0.8rem; }
  .fichier { display: block; text-align: center; cursor: pointer; box-sizing: border-box; }
  .aide { margin-bottom: 0.9rem; }
  .aide summary { font-weight: 700; font-size: 1.1rem; cursor: pointer; }
  .aide ul { list-style: none; margin: 0.8rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
  .aide li { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.95rem; line-height: 1.35; }
  .aide li :global(.icone), .puce { flex: none; color: var(--jaune); width: 1.6rem; text-align: center; font-weight: 700; font-size: 0.85rem; }
  .legende { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0.4rem 1rem; margin-top: 0.8rem; }
  .ligne-legende { display: flex; align-items: center; gap: 0.6rem; font-size: 0.92rem; }
  .icone-legende { flex: none; width: 2.2rem; height: 2.2rem; border-radius: 50%; background: rgba(255, 255, 255, 0.1); display: grid; place-items: center; }
</style>
