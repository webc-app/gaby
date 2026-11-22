<script>
  // Entrée dans l'app : créer un profil (son pseudo, son avatar ; 10 joueurs au plus) ou retrouver le sien (code personnel).
  // Tout est anonyme : un pseudo, un avatar, pas d'e-mail ni de compte.
  import { connecter, creerProfil } from '../lib/etat.svelte.js';
  import { AVATARS } from '../lib/avatars.js';
  import { sons } from '../lib/sons.js';
  import ChoixProfil from '../composants/ChoixProfil.svelte';

  let choix = $state(null); // null | 'nouveau' | 'retour'
  let pseudo = $state(''); // l'enfant écrit le sien (ou en tire un au hasard avec le dé)
  let avatar = $state(AVATARS[Math.floor(Math.random() * AVATARS.length)].id);
  let code = $state('');
  let erreur = $state('');
  let enCours = $state(false);

  const MESSAGES = {
    code: 'Ce code ne correspond à aucun profil.',
    complet: 'Il y a déjà 10 joueurs : un parent doit en supprimer un.',
    pris: 'Ce pseudo est déjà pris : choisis-en un autre.',
    pseudo: 'Choisis un pseudo.',
    reseau: 'Pas de connexion : vérifie Internet et réessaie.',
    serveur: 'Le serveur ne répond pas, réessaie un peu plus tard.',
  };

  async function creer(e) {
    e.preventDefault();
    if (enCours) return;
    erreur = '';
    if (!pseudo.trim()) { erreur = MESSAGES.pseudo; return; }
    enCours = true;
    const { resultat } = await creerProfil(pseudo.trim(), avatar);
    enCours = false;
    if (resultat !== 'ok') { sons.oups(); erreur = MESSAGES[resultat] ?? MESSAGES.serveur; }
  }

  async function retrouver(e) {
    e.preventDefault();
    if (enCours || !code.trim()) return;
    erreur = '';
    enCours = true;
    const r = await connecter(code);
    enCours = false;
    if (r !== 'ok') { sons.oups(); erreur = MESSAGES[r] ?? MESSAGES.serveur; }
  }

  function aller(c) { sons.clic(); erreur = ''; choix = c; }
</script>

<main>
  {#if !choix}
    <h1>Bienvenue ! 👋</h1>
    <div class="deux">
      <button class="bouton jaune" onclick={() => aller('nouveau')}>Je suis nouveau</button>
      <button class="bouton discret" onclick={() => aller('retour')}>J’ai déjà un profil</button>
    </div>
  {:else if choix === 'nouveau'}
    <form class="carte" onsubmit={creer}>
      <ChoixProfil bind:pseudo bind:avatar />
      {#if erreur}<p class="erreur">{erreur}</p>{/if}
      <button class="bouton jaune" disabled={enCours}>{enCours ? '…' : 'Créer mon profil'}</button>
      <button type="button" class="lien" onclick={() => aller(null)}>Retour</button>
    </form>
  {:else}
    <form class="carte" onsubmit={retrouver}>
      <label class="champ">
        <span class="titre">Ton code personnel</span>
        <input bind:value={code} placeholder="Par exemple LUNE-482" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" class="code" />
      </label>
      {#if erreur}<p class="erreur">{erreur}</p>{/if}
      <button class="bouton jaune" disabled={enCours}>{enCours ? '…' : 'C’est parti !'}</button>
      <button type="button" class="lien" onclick={() => aller(null)}>Retour</button>
    </form>
  {/if}
</main>

<style>
  main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.1rem; padding-block: 1rem; }
  h1 { font-size: 2rem; }
  .deux { display: flex; flex-direction: column; gap: 0.7rem; width: 100%; max-width: 22rem; }
  form { width: 100%; max-width: 26rem; display: flex; flex-direction: column; gap: 0.9rem; }
  .champ { display: flex; flex-direction: column; gap: 0.35rem; }
  .titre { font-weight: 700; font-size: 1.05rem; }
  input {
    font: inherit; font-size: 1.2rem; padding: 0.6rem 0.8rem; border-radius: 0.9rem; min-width: 0;
    border: 2px solid var(--doux); background: var(--fond-2); color: var(--texte);
  }
  input.code { text-transform: uppercase; letter-spacing: 0.1em; text-align: center; }
  .erreur { margin: 0; color: var(--rouge); font-weight: 600; }
  .lien { appearance: none; border: 0; background: none; color: var(--doux); text-decoration: underline; cursor: pointer; font: inherit; }
</style>
