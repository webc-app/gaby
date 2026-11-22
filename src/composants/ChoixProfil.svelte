<script>
  // Choisir son pseudo (sans nom réel) et son avatar.
  import { AVATARS, pseudoAuHasard } from '../lib/avatars.js';
  import { sons } from '../lib/sons.js';

  let { pseudo = $bindable(''), avatar = $bindable(AVATARS[0].id) } = $props();

  function auHasard() {
    sons.clic();
    pseudo = pseudoAuHasard(pseudo);
  }
</script>

<label class="champ">
  <span class="titre">Ton pseudo</span>
  <span class="ligne">
    <input bind:value={pseudo} maxlength="20" placeholder="Pas ton vrai nom !" autocomplete="off" autocorrect="off" spellcheck="false" />
    <button type="button" class="de" onclick={auHasard} aria-label="Un pseudo au hasard">🎲</button>
  </span>
</label>

<span class="titre">Ton avatar</span>
<div class="avatars">
  {#each AVATARS as a}
    <button type="button" class="avatar" class:choisi={avatar === a.id} onclick={() => { sons.clic(); avatar = a.id; }} aria-label="Avatar {a.id}">
      <img src={a.src} alt="" />
    </button>
  {/each}
</div>

<style>
  .champ { display: flex; flex-direction: column; gap: 0.35rem; }
  .titre { font-weight: 700; font-size: 1.05rem; }
  .ligne { display: flex; gap: 0.5rem; }
  .de { appearance: none; border: 0; cursor: pointer; border-radius: 0.9rem; padding: 0 0.9rem; font-size: 1.5rem; background: rgba(255, 255, 255, 0.12); }
  input {
    flex: 1; min-width: 0; font: inherit; font-size: 1.2rem; padding: 0.6rem 0.8rem; border-radius: 0.9rem;
    border: 2px solid var(--doux); background: var(--fond-2); color: var(--texte);
  }
  /* Vignettes rondes, toutes de la même taille, sur un fond commun */
  .avatars { display: grid; grid-template-columns: repeat(auto-fill, 3.4rem); gap: 0.5rem; justify-content: start; margin-top: -0.4rem; }
  .avatar {
    appearance: none; cursor: pointer; padding: 0; width: 3.4rem; height: 3.4rem; border-radius: 50%; overflow: hidden;
    border: 3px solid rgba(255, 255, 255, 0.15); background: var(--fond-2); display: block;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .avatar.choisi { border-color: var(--jaune); box-shadow: 0 0 0 2px var(--jaune); }
</style>
