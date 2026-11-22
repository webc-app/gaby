<script>
  // Les images des questions : pièces d'échecs (src/pieces/), panneaux du code de la route (src/panneaux/), planètes (src/planetes/), feux dessinés ici,
  // un emoji ou un nombre (type 'emoji', id = le texte), un drapeau (type 'drapeau', src = son adresse) ou un fichier image du contenu (type 'fichier', src = son adresse).
  let { type, id, src = null, taille = 130 } = $props();
  // Les pièces d'échecs : les dessins de Wikimedia Commons (src/pieces/, voir SOURCE.md), « pion-noir » pour une noire
  const PIECES = import.meta.glob('../pieces/*.svg', { eager: true, query: '?url', import: 'default' });
  const piece = (nom) => PIECES[`../pieces/${nom}.svg`];
  // Les panneaux : les modèles officiels (src/panneaux/, voir SOURCE.md) ; seuls les feux sont dessinés ici
  const PANNEAUX = import.meta.glob('../panneaux/*.svg', { eager: true, query: '?url', import: 'default' });
  const panneau = (nom) => PANNEAUX[`../panneaux/${nom}.svg`];
  // Les planètes : photos de la NASA (src/planetes/, voir SOURCE.md)
  const PLANETES = import.meta.glob('../planetes/*.webp', { eager: true, query: '?url', import: 'default' });
  const planete = (nom) => PLANETES[`../planetes/${nom}.webp`];
</script>

<!-- Toutes les images sur la même carte, dans tous les ateliers : carrée, bleue, coins arrondis, contour gris-bleu (--doux),
     avec l'ombre des boutons ; l'image au centre (un drapeau un peu plus large), une planète remplit la carte. -->
<div class="carte" class:espace={type === 'planete'} style="--t:{taille}px">
{#if type === 'fichier'}
<img class="fichier" {src} alt="Illustration de la question" />
{:else if type === 'drapeau'}
<img class="drapeau" {src} alt="Drapeau" />
{:else if type === 'panneau' && panneau(id)}
<img src={panneau(id)} alt="Panneau du code de la route" />
{:else if type === 'emoji'}
<span class="emoji">{id}</span>
{:else if type === 'planete'}
<img class:saturne={id === 'saturne'} src={planete(id)} alt="Planète" />
{:else if type === 'piece'}
<img src={piece(id)} alt="Pièce d’échecs" />
{:else}
<svg viewBox="0 0 100 100" role="img" aria-label="Image de la question">
  {#if type === 'panneau'}
    {#if id === 'feu-rouge' || id === 'feu-vert'}
      <rect x="32" y="6" width="36" height="88" rx="10" fill="#222" />
      <circle cx="50" cy="22" r="10" fill={id === 'feu-rouge' ? '#ff3b30' : '#4a1d1d'} />
      <circle cx="50" cy="50" r="10" fill="#4a3a14" />
      <circle cx="50" cy="78" r="10" fill={id === 'feu-vert' ? '#34c759' : '#143a1f'} />
    {/if}
  {/if}
</svg>
{/if}
</div>

<style>
  .carte {
    width: var(--t); max-width: 100%; aspect-ratio: 1; margin-inline: auto; box-sizing: border-box; display: grid; place-items: center;
    background: var(--carte); border: 3px solid var(--doux); border-radius: 20%;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.35);
  }
  .carte > * { display: block; width: 76%; height: 76%; object-fit: contain; }
  /* tous les drapeaux au même format 3:2 (leur cadre est réglé dans les fichiers de src/drapeaux/) */
  .carte > .drapeau { width: 86%; height: auto; aspect-ratio: 3 / 2; object-fit: fill; }
  /* les planètes : la photo remplit la carte, avec l'espace noir autour (Saturne, plus large, est complétée de noir) */
  .carte.espace { background: #000; overflow: hidden; }
  .carte.espace > img { width: 100%; height: 100%; object-fit: cover; }
  .carte.espace > .saturne { object-fit: contain; }
  .drapeau, .fichier { border-radius: 0.35rem; }
  /* un emoji ou un nombre à nommer (anglais) : en grand, sur la carte */
  .carte > .emoji { width: auto; height: auto; font-size: calc(var(--t) * 0.5); line-height: 1; font-weight: 700; color: var(--texte); }
</style>
