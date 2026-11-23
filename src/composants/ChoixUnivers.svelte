<script>
  // Choisir son univers : le décor change tout de suite.
  import { app, sauver } from '../lib/etat.svelte.js';
  import { sons } from '../lib/sons.js';

  const UNIVERS = [
    { id: 'espace', nom: 'Espace', emoji: '🪐' },
    { id: 'prehistoire', nom: 'Préhistoire', emoji: '🌋' },
    { id: 'course', nom: 'Course', emoji: '🏁' },
    { id: 'noel', nom: 'Noël', emoji: '🎄' },
    { id: 'ocean', nom: 'Océan', emoji: '🐠' },
    { id: 'halloween', nom: 'Halloween', emoji: '🎃' },
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
      aria-pressed={(app.etat.univers ?? 'espace') === u.id}
      onclick={() => choisir(u)}>
      <span class="emoji">{u.emoji}</span>
      <span>{u.nom}</span>
    </button>
  {/each}
</div>

<style>
  /* Petites étiquettes : un choix de décor, pas plus important que ça */
  .univers { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .tuile {
    appearance: none; cursor: pointer; font: inherit; font-weight: 600; font-size: 0.85rem; color: var(--texte);
    display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.3rem 0.65rem 0.3rem 0.5rem;
    border: 2px solid transparent; border-radius: 999px; background: rgba(255, 255, 255, 0.07);
  }
  .tuile.choisi { border-color: var(--jaune); background: rgba(255, 255, 255, 0.12); }
  .emoji { font-size: 1rem; }
</style>
