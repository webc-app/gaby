<script>
  // Mode dev uniquement (?visuels) : toutes les images des questions (pièces, planètes, panneaux), pour les vérifier d'un coup.
  import Visuel from '../composants/Visuel.svelte';
  const LISTE = [
    ['piece', ['pion', 'tour', 'fou', 'cavalier', 'dame', 'roi']],
    ['planete', ['soleil', 'mercure', 'venus', 'terre', 'lune', 'mars', 'jupiter', 'saturne', 'uranus', 'neptune']],
    ['panneau', [...Object.keys(import.meta.glob('../panneaux/*.svg')).map((f) => f.slice(12, -4)), 'feu-rouge', 'feu-vert']],
  ];
</script>

{#each LISTE as [type, ids]}
  <div class="ligne">
    {#each ids as id}<figure><Visuel {type} {id} taille={110} /><figcaption>{id}</figcaption></figure>{/each}
  </div>
{/each}

<style>
  .ligne { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-bottom: 1.2rem; }
  figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
  figcaption { font-size: 0.8rem; color: #b7c9f2; }
</style>
