<script>
  import { app, tirer } from './lib/etat.svelte.js';
  import Fond from './composants/Fond.svelte';
  import Entree from './ecrans/Entree.svelte';
  import Bienvenue from './ecrans/Bienvenue.svelte';
  import Jeu from './ecrans/Jeu.svelte';
  import Tirelire from './ecrans/Tirelire.svelte';
  import Parent from './ecrans/Parent.svelte';
  const visuels = import.meta.env.DEV && new URLSearchParams(location.search).has('visuels');


  // L'univers choisi colore toute l'app (palette dans style.css, décor dans Fond.svelte)
  $effect(() => {
    const u = app.etat.univers ?? 'espace';
    document.documentElement.dataset.univers = u;
  });

  let ecran = $state('jeu');
  const aller = (nom) => { ecran = nom; window.scrollTo(0, 0); };

  // Au démarrage (et après la connexion d'un appareil) : synchronisation.
  $effect(() => {
    if (!app.code) return;
    tirer();
  });
</script>

<Fond univers={app.etat.univers ?? 'espace'} />

{#if visuels}
  <!-- planches de dessin, en développement seulement (?visuels) : chargées à la demande -->
  {#await import('./ecrans/PlancheVisuels.svelte') then m}<m.default />{/await}
{:else if !app.code}
  <Entree />
{:else if ecran === 'parent'}
  <!-- Les réglages : le fond s'assombrit derrière, et toucher à côté de la page la ferme -->
  <div class="voile-page" onclick={() => aller('jeu')} aria-hidden="true"></div>
  <div class="page-prose devant"><Parent aller={(vers) => aller(vers ?? 'jeu')} /></div>
{:else if !app.accueilVu}
  <Bienvenue {aller} />
{:else if ecran === 'tirelire'}
  <div class="page-prose"><Tirelire aller={() => aller('jeu')} /></div>
{:else}
  <Jeu {aller} />
{/if}
