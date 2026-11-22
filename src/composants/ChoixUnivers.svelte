<script>
  // Choisir son univers : l'écran change de couleur et de décor tout de suite.
  import { app, sauver } from '../lib/etat.svelte.js';
  import { sons } from '../lib/sons.js';

  const UNIVERS = [
    { id: 'espace', nom: 'Espace', emoji: '🪐', fond: '#0d1b3e', lumiere: '#2c5aa8' },
    { id: 'prehistoire', nom: 'Préhistoire', emoji: '🌋', fond: '#0d1b3e', lumiere: '#2c5aa8' },
    { id: 'course', nom: 'Course', emoji: '🏁', fond: '#0d1b3e', lumiere: '#2c5aa8' },
  ];

  function choisir(u) {
    if ((app.etat.univers ?? 'espace') === u.id) return;
    sons.clic();
    app.etat.univers = u.id;
    sauver();
  }
</script>

<div class="univers">
  {#each UNIVERS as u}
    <button type="button" class="tuile" class:choisi={(app.etat.univers ?? 'espace') === u.id}
      style="--f:{u.fond}; --l:{u.lumiere}" onclick={() => choisir(u)}>
      <span class="emoji">{u.emoji}</span>
      <span>{u.nom}</span>
    </button>
  {/each}
</div>

<style>
  .univers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
  .tuile {
    appearance: none; cursor: pointer; font: inherit; font-weight: 600; font-size: 0.9rem; color: #fff;
    display: flex; flex-direction: column; align-items: center; gap: 0.15rem; padding: 0.55rem 0.2rem;
    border: 3px solid transparent; border-radius: 1rem;
    background: radial-gradient(ellipse at 50% 0%, var(--l), var(--f) 75%);
  }
  .tuile.choisi { border-color: var(--jaune); }
  .emoji { font-size: 1.6rem; }
</style>
