<script>
  // Premier affichage, tout sur un seul écran et le plus simple possible : bonjour et le code personnel à noter.
  import { app, accueilFait, pseudo } from '../lib/etat.svelte.js';
  import { srcAvatar } from '../lib/avatars.js';
  import { sons } from '../lib/sons.js';
  import Icone from '../composants/Icone.svelte';

  let { aller } = $props();

  function commencer() {
    sons.victoire();
    accueilFait();
  }
</script>

<header>
  <button class="rond" onclick={() => aller('parent')} aria-label="Réglages et notice"><Icone nom="reglages" /></button>
</header>

<main>
  <div class="gauche">
  <div class="bonjour">
    <img class="photo" src={srcAvatar(app.etat.profil.avatar)} alt="" />
    <h1>Salut {pseudo()} ! 👋</h1>
  </div>


    <p class="code">Ton code personnel : <strong>{app.code}</strong><br /><small>Note-le pour jouer sur un autre appareil.</small></p>
  </div>

  <button class="bouton jaune go" onclick={commencer}>C’est parti !</button>
</main>

<style>
  header { display: flex; }
  .rond {
    appearance: none; border: 0; background: rgba(255, 255, 255, 0.1); color: var(--texte); border-radius: 50%;
    width: 2.5rem; height: 2.5rem; display: grid; place-items: center; cursor: pointer;
  }
  main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding-block: 0.5rem 1rem; }
  .gauche { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  /* Tablette, ou écran assez large : bonjour à gauche, le bouton à droite */
  @media (min-width: 900px) {
    main { display: grid; grid-template-columns: 1fr 1fr; align-items: center; justify-items: center; column-gap: 2.5rem; max-width: 60rem; margin-inline: auto; width: 100%; }
    .gauche { gap: 2rem; }
    .gauche h1 { font-size: 2.4rem; }
  }
  .bonjour { display: flex; align-items: center; gap: 0.8rem; }
  .photo { width: 3.6rem; height: 3.6rem; border-radius: 50%; object-fit: cover; background: var(--fond-2); overflow: hidden; border: 3px solid var(--jaune); }
  h1 { font-size: 2rem; }
  .code { margin: 0; text-align: center; color: var(--doux); }
  .code strong { color: var(--jaune); letter-spacing: 0.08em; font-size: 1.15rem; }

  .go { width: 100%; max-width: 22rem; font-size: 1.3rem; padding: 0.9rem; }
</style>
