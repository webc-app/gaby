<script>
  // Le tiroir des ateliers : la liste complète, rangée par matière, avec le nom, une phrase et le niveau.
  // Il glisse depuis la droite, sous le bouton des ateliers (en haut à droite).
  // `fixe` (tablette en paysage) : la même liste, toujours affichée à gauche de l'exercice, en lignes resserrées
  // (sans la phrase) ; elle défile dans son cadre quand l'écran n'est pas assez haut.
  import { fly, fade } from 'svelte/transition';
  import { app } from '../lib/etat.svelte.js';
  import { rubriques, ALEATOIRE } from '../questions/index.js';
  import Icone from './Icone.svelte';
  import { niveauMax } from '../lib/progression.js';

  let { ouvert = $bindable(false), actif, onchoisir, fixe = false } = $props();

  const niveau = (id) => app.etat.matieres[id]?.niveau ?? 1;
  const auMax = (m) => niveau(m.id) >= niveauMax(m);
  const lectureFaite = (m) => m.textes.filter((t) => app.etat.lectures[t.titre]?.valide).length;

  function fermer() { ouvert = false; }
  function choisir(m) { ouvert = false; onchoisir(m); }
  function touche(e) { if (e.key === 'Escape') fermer(); }
</script>

<svelte:window onkeydown={ouvert ? touche : undefined} />

{#snippet ligne(m)}
  <button class="ligne" class:actif={m.id === actif} style="--c:{m.couleur}" onclick={() => choisir(m)}>
    <span class="pastille"><Icone nom={m.id} taille={fixe ? 17 : 22} /></span>
    <span class="textes">
      <strong>{m.nom}</strong>
      {#if !fixe}<small>{m.description}</small>{/if}
    </span>
    {#if m.lecture}
      <span class="niveau">{lectureFaite(m)}/{m.textes.length} lue{m.textes.length > 1 ? 's' : ''}</span>
    {:else}
      <span class="niveau" class:max={auMax(m)}>{auMax(m) ? '🏆 Max' : `Niv. ${niveau(m.id)}`}</span>
    {/if}
  </button>
{/snippet}

<!-- Un cadre par matière (Aléatoire seul en tête), un trait entre les ateliers d'un même cadre -->
{#snippet groupes()}
  <div class="groupe">{@render ligne(ALEATOIRE)}</div>
  {#each rubriques as r}
    <section class="groupe" aria-label={r.titre}>
      <h3>{r.titre}</h3>
      {#each r.ateliers as m}{@render ligne(m)}{/each}
    </section>
  {/each}
{/snippet}

{#if fixe}
  <nav class="fixe" aria-label="Ateliers">{@render groupes()}</nav>
{:else if ouvert}
  <div class="voile" transition:fade={{ duration: 150 }} onclick={fermer} aria-hidden="true"></div>
  <div class="tiroir" role="dialog" aria-modal="true" aria-label="Choisir un atelier" transition:fly={{ x: 380, duration: 230 }}>
    <div class="defile">
      {@render groupes()}
    </div>
    <button class="fermer" onclick={fermer}>Fermer</button>
  </div>
{/if}

<style>
  .voile { position: fixed; inset: 0; z-index: 40; background: rgba(5, 10, 30, 0.55); }
  .tiroir {
    position: fixed; z-index: 41; top: 0; right: 0; bottom: 0; width: min(24rem, 88vw); display: flex; flex-direction: column;
    background: color-mix(in srgb, var(--carte) 70%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border-radius: 1.4rem 0 0 1.4rem; box-shadow: -8px 0 30px rgba(0, 0, 0, 0.4);
    padding: calc(env(safe-area-inset-top) + 0.9rem) 0.9rem calc(env(safe-area-inset-bottom) + 0.7rem);
  }
  .defile { overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 0.6rem; min-height: 0; }
  .groupe { flex: none; display: flex; flex-direction: column; border-radius: 1rem; background: rgba(255, 255, 255, 0.05); }
  h3 { margin: 0; padding: 0.55rem 0.8rem 0.25rem; font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--doux); }
  .ligne {
    appearance: none; border: 0; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; text-align: left;
    width: 100%; padding: 0.5rem 0.6rem; background: transparent; color: var(--texte); font: inherit; border-radius: 1rem;
  }
  /* le trait entre deux ateliers d'un même cadre */
  .ligne + .ligne { box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.1); }
  .ligne:active { background: rgba(255, 255, 255, 0.12); }
  .ligne.actif { box-shadow: inset 0 0 0 2px var(--c); background: color-mix(in srgb, var(--c) 16%, transparent); }
  .ligne.actif + .ligne { box-shadow: none; }
  .pastille { flex: none; width: 2.6rem; height: 2.6rem; border-radius: 50%; display: grid; place-items: center; background: var(--c); color: #1a1033; }
  .textes { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.2; }
  .textes strong { font-size: 1.1rem; font-weight: 400; } /* le nom des ateliers, sans gras */
  .textes small { color: var(--doux); font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .niveau { flex: none; font-size: 0.85rem; font-weight: 400; color: var(--doux); background: rgba(255, 255, 255, 0.08); padding: 0.2rem 0.55rem; border-radius: 999px; }
  .niveau.max { color: #3a2a00; background: var(--jaune); font-weight: 700; }
  .fermer {
    appearance: none; flex: none; margin-top: 0.6rem; border: 0; cursor: pointer; font: inherit; font-weight: 700; font-size: 1rem;
    padding: 0.7rem; border-radius: 999px; background: rgba(255, 255, 255, 0.1); color: var(--texte);
  }

  /* La liste toujours affichée (tablette en paysage) : pas plus haute que l'écran, elle défile dans son cadre s'il le faut */
  .fixe {
    display: flex; flex-direction: column; gap: 0.45rem; max-height: calc(100dvh - 7.5rem);
    padding-right: 0.6rem; /* la barre de défilement est dans la colonne : un peu d'espace pour qu'elle ne colle pas aux rubriques */
    overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
  }
  .fixe::-webkit-scrollbar { width: 6px; }
  .fixe::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.25); border-radius: 3px; }
  /* chaque rubrique : un cadre translucide qui floute le décor */
  .fixe .groupe { background: color-mix(in srgb, var(--carte) 45%, transparent); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
  .fixe h3 { padding: 0.55rem 0.75rem 0.35rem; font-size: 0.72rem; line-height: 1.1; }
  .fixe .ligne { flex: none; height: 2.5rem; padding: 0 0.6rem 0 0.45rem; gap: 0.55rem; border-radius: 0.9rem; }
  .fixe .pastille { width: 1.75rem; height: 1.75rem; }
  .fixe .textes strong { font-size: 1rem; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .fixe .niveau { font-size: 0.8rem; padding: 0.1rem 0.5rem; background: transparent; }
  .fixe .niveau.max { background: var(--jaune); }
</style>
