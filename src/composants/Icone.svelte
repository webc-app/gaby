<script>
  // Les icônes de l'app, toutes dans le même style : traits arrondis, épaisseur égale, couleur du texte.
  let { nom, taille = 22 } = $props();
</script>

<svg class="icone" viewBox="0 0 24 24" width={taille} height={taille} aria-hidden="true"
  fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  {#if nom === 'aleatoire'}
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
  {:else if nom === 'tables'}
    <path d="M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5" stroke-width="2.8" />
  {:else if nom === 'divisions'}
    <path d="M5 12 H19" stroke-width="2.8" />
    <circle cx="12" cy="6.3" r="1.8" fill="currentColor" stroke="none" />
    <circle cx="12" cy="17.7" r="1.8" fill="currentColor" stroke="none" />
  {:else if nom === 'synonymes'}
    <path d="M4 8.5 H18 M14.5 5 L18 8.5 L14.5 12" />
    <path d="M20 15.5 H6 M9.5 12 L6 15.5 L9.5 19" />
  {:else if nom === 'homophones'}
    <path d="M7 15.5 C 5.3 14.3 4 12.4 4 10 C 4 6.4 7.6 3.5 12 3.5 C 16.4 3.5 20 6.4 20 10 C 20 13.6 16.4 16.5 12 16.5 C 11.2 16.5 10.4 16.4 9.7 16.2 L 6 18.5 Z" />
    <path d="M8.5 10 H15.5 M8.5 7.3 H13" />
  {:else if nom === 'heure'}
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7 V12 L15.5 14" />
  {:else if nom === 'dictee'}
    <path d="M4.5 15 V12 A7.5 7.5 0 0 1 19.5 12 V15" />
    <rect x="3.5" y="14" width="4" height="6" rx="1.6" />
    <rect x="16.5" y="14" width="4" height="6" rx="1.6" />
  {:else if nom === 'capitales'}
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12 H20.5 M12 3.5 C 9 6.5 9 17.5 12 20.5 C 15 17.5 15 6.5 12 3.5" />
  {:else if nom === 'drapeaux'}
    <!-- un drapeau sur son mât -->
    <path d="M6 21 V3.5 M6 4.5 C 9 3 12 6.5 18.5 4.5 V13 C 12 15 9 11.5 6 13" />
  {:else if nom === 'calcul'}
    <rect x="5" y="3" width="14" height="18" rx="3" />
    <path d="M8.5 7.5 H15.5" />
    <circle cx="9" cy="12.3" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12.3" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="12.3" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="16.3" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="16.3" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="16.3" r="1" fill="currentColor" stroke="none" />
  {:else if nom === 'piece'}
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="5" stroke-width="1.6" opacity="0.7" />
  {:else if ['conjugaison', 'present', 'futur', 'passe-compose'].includes(nom)}
    <!-- un sablier : les temps -->
    <path d="M6.5 3.5 H17.5 M6.5 20.5 H17.5 M7.5 3.5 C 7.5 9, 16.5 9, 16.5 12 C 16.5 15, 7.5 15, 7.5 20.5 M16.5 3.5 C 16.5 9, 7.5 9, 7.5 12 C 7.5 15, 16.5 15, 16.5 20.5" />
  {:else if nom === 'echecs'}
    <!-- un pion -->
    <circle cx="12" cy="6.5" r="3" />
    <path d="M9.5 10.5 H14.5 L13.5 15 H10.5 Z M7.5 20.5 H16.5 L15.5 16.5 H8.5 Z" />
  {:else if nom === 'route'}
    <!-- un feu tricolore -->
    <rect x="8" y="2.8" width="8" height="18.4" rx="3" />
    <circle cx="12" cy="7.2" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="16.8" r="1.5" />
  {:else if nom === 'grammaire'}
    <!-- un mot entre crochets : on l'analyse -->
    <path d="M8 4 H4.5 V20 H8 M16 4 H19.5 V20 H16 M9.5 12 H14.5" />
  {:else if nom === 'vocabulaire'}
    <text x="12" y="16.6" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor" stroke="none" font-family="system-ui, sans-serif">Aa</text>
  {:else if nom === 'nombres'}
    <!-- un disque et son quart : les fractions -->
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5 V12 H20.5" />
  {:else if nom === 'mesures'}
    <!-- une équerre -->
    <path d="M4.5 20 V4.5 L20 20 Z M8.5 16 V13 L11.5 16 Z" />
  {:else if nom === 'problemes'}
    <path d="M8.5 9 C 8.5 6.6 10 5 12 5 C 14 5 15.5 6.5 15.5 8.5 C 15.5 11 12 11.5 12 14.5" />
    <circle cx="12" cy="18.6" r="1.3" fill="currentColor" stroke="none" />
  {:else if nom === 'tresor'}
    <path d="M4 10.5 C 4 7 7.5 5 12 5 C 16.5 5 20 7 20 10.5 Z" />
    <rect x="4" y="10.5" width="16" height="9" rx="1.5" />
    <path d="M10.5 10.5 V13.5 H13.5 V10.5" />
  {:else if nom === 'reglages'}
    <circle cx="12" cy="12" r="3" />
    <path stroke-width="2" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  {:else if nom === 'culture'}
    <path d="M9 18 H15 M10 21 H14" />
    <path d="M12 3 C 8.1 3 5.5 5.9 5.5 9.3 C 5.5 11.6 6.7 13.3 8.2 14.5 C 8.8 15 9 15.5 9 16 V18 H15 V16 C 15 15.5 15.2 15 15.8 14.5 C 17.3 13.3 18.5 11.6 18.5 9.3 C 18.5 5.9 15.9 3 12 3 Z" />
  {:else if nom === 'livre' || nom === 'lecture'}
    <path d="M12 6.5 C 10 5 7 4.5 3.5 5 V18.5 C 7 18 10 18.5 12 20 C 14 18.5 17 18 20.5 18.5 V5 C 17 4.5 14 5 12 6.5 Z" />
    <path d="M12 6.5 V20" />
  {:else if nom === 'cible'}
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  {:else if nom === 'son'}
    <path d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z" />
    <path d="M15.5 9 C 16.7 10.6 16.7 13.4 15.5 15 M18.3 6.5 C 20.8 9.6 20.8 14.4 18.3 17.5" />
  {:else if nom === 'muet'}
    <path d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z" />
    <path d="M16 9.5 L21 14.5 M21 9.5 L16 14.5" />
  {:else if nom === 'reset'}
    <path d="M19.5 12 A7.5 7.5 0 1 1 16.8 6.2" />
    <path d="M17.5 2.8 V6.8 H13.5" />
  {:else if nom === 'regle'}
    <rect x="2.5" y="8" width="19" height="8" rx="1.8" />
    <path d="M6.5 8 V11 M10 8 V12 M13.5 8 V11 M17 8 V12" />
  {:else if nom === 'lignes'}
    <path d="M4 6.5 H20" /><path d="M4 12 H20" stroke-width="3.6" opacity="0.55" /><path d="M4 17.5 H20" />
  {:else if nom === 'grille'}
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
  {:else if nom === 'chrono'}
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 13.5 V9.5 M10 2.8 H14 M12 2.8 V6 M18.2 6.8 L19.8 5.2" />
  {:else if nom === 'anglais'}
    <path d="M5 4.5 H19 A2 2 0 0 1 21 6.5 V14.5 A2 2 0 0 1 19 16.5 H11 L6.5 20 V16.5 H5 A2 2 0 0 1 3 14.5 V6.5 A2 2 0 0 1 5 4.5 Z" />
    <text x="12" y="13.6" text-anchor="middle" font-size="8" font-weight="800" fill="currentColor" stroke="none" font-family="system-ui, sans-serif">EN</text>
  {:else if nom === 'ecouter'}
    <path d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z" />
    <path d="M15.5 9 C 16.7 10.6 16.7 13.4 15.5 15 M18.3 6.5 C 20.8 9.6 20.8 14.4 18.3 17.5" />
  {/if}
</svg>

<style>
  .icone { display: inline-block; vertical-align: -0.2em; flex: none; }
</style>
