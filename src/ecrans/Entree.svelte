<script>
  // Entrée dans l'app : « Qui joue ? » parmi les joueurs de cet appareil, ou un nouveau joueur (pseudo et avatar).
  // Pas de compte, pas d'e-mail : tout reste sur cet appareil.
  import { app, creerJoueur, choisirJoueur, pseudoPris, restaurer } from '../lib/etat.svelte.js';
  import { AVATARS, srcAvatar } from '../lib/avatars.js';
  import { sons } from '../lib/sons.js';
  import ChoixProfil from '../composants/ChoixProfil.svelte';

  let nouveau = $state(app.joueurs.length === 0);
  let pseudo = $state(''); // l'enfant écrit le sien (ou en tire un au hasard avec le dé)
  let avatar = $state(AVATARS[Math.floor(Math.random() * AVATARS.length)].id);
  let erreur = $state('');

  function creer(e) {
    e.preventDefault();
    erreur = '';
    if (!pseudo.trim()) { sons.oups(); erreur = 'Choisis un pseudo.'; return; }
    if (pseudoPris(pseudo)) { sons.oups(); erreur = 'Ce pseudo est déjà pris sur cet appareil : choisis-en un autre.'; return; }
    sons.victoire();
    creerJoueur(pseudo, avatar);
  }

  function jouer(id) {
    sons.clic();
    choisirJoueur(id);
  }

  // Une copie de sauvegarde (faite dans les réglages d'un autre appareil) : on la recharge ici.
  async function fichierChoisi(e) {
    const fichier = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!fichier) return;
    const n = restaurer(await fichier.text());
    if (n === null) { sons.oups(); erreur = 'Ce fichier n’est pas une sauvegarde de Gaby.'; return; }
    sons.victoire();
    erreur = '';
    nouveau = false;
  }
</script>

<main>
  {#if !nouveau}
    <h1>Qui joue ?</h1>
    <div class="joueurs">
      {#each app.joueurs as j (j.id)}
        <button class="joueur" onclick={() => jouer(j.id)}>
          <img src={srcAvatar(j.avatar)} alt="" />
          <span>{j.pseudo}</span>
        </button>
      {/each}
      <button class="joueur ajout" onclick={() => { sons.clic(); nouveau = true; }}>
        <span class="plus" aria-hidden="true">+</span>
        <span>Nouveau joueur</span>
      </button>
    </div>
  {:else}
    <h1>Bienvenue ! 👋</h1>
    <form class="carte" onsubmit={creer}>
      <ChoixProfil bind:pseudo bind:avatar />
      {#if erreur}<p class="erreur">{erreur}</p>{/if}
      <button class="bouton jaune">C’est parti !</button>
      {#if app.joueurs.length}
        <button type="button" class="lien" onclick={() => { erreur = ''; nouveau = false; }}>Retour</button>
      {:else}
        <!-- Nouvel appareil : reprendre les joueurs d'une copie de sauvegarde -->
        <label class="lien">J’ai une copie de sauvegarde<input type="file" accept=".json,application/json" onchange={fichierChoisi} hidden /></label>
      {/if}
    </form>
  {/if}
</main>

<style>
  main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.1rem; padding-block: 1rem; }
  h1 { font-size: 2rem; }
  form { width: 100%; max-width: 26rem; display: flex; flex-direction: column; gap: 0.9rem; }
  .erreur { margin: 0; color: var(--rouge); font-weight: 600; }
  .lien { appearance: none; border: 0; background: none; color: var(--doux); text-decoration: underline; cursor: pointer; font: inherit; text-align: center; }
  .joueurs { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; max-width: 40rem; }
  .joueur {
    appearance: none; border: 0; background: none; color: var(--texte); cursor: pointer; font: inherit; font-weight: 700;
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem; width: 7rem;
  }
  .joueur img, .plus {
    width: 6rem; height: 6rem; border-radius: 50%; border: 3px solid rgba(255, 255, 255, 0.15); background: var(--fond-2); display: block;
  }
  .joueur:hover img, .joueur:focus-visible img { border-color: var(--jaune); }
  .joueur span { overflow-wrap: anywhere; text-align: center; }
  .plus { display: grid; place-items: center; font-size: 2.6rem; font-weight: 400; color: var(--doux); border-style: dashed; }
  .ajout { color: var(--doux); }
</style>
