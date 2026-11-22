<script>
  // Le décor derrière l'app, selon l'univers : espace, préhistoire ou course.
  // Toujours très pâle, d'une seule couleur, et très lent, pour ne pas déconcentrer.
  // Coupé si l'appareil demande moins d'animations.
  let { univers = 'espace' } = $props();

  // Étoiles placées une fois pour toutes (pseudo-hasard stable d'un affichage à l'autre)
  const etoiles = Array.from({ length: 46 }, (_, i) => {
    const r = (n) => ((Math.sin(i * 127.1 + n * 311.7) * 43758.5453) % 1 + 1) % 1;
    return { x: r(1) * 100, y: r(2) * 100, t: 1 + r(3) * 1.8, d: r(4) * 8, v: 5 + r(5) * 6 };
  });
</script>

{#if univers === 'prehistoire'}
<div class="ciel prehistoire" aria-hidden="true">
  {#each etoiles.slice(0, 22) as e}
    <span class="etoile poussiere" style="left:{e.x}%; top:{e.y * 0.6}%; width:{e.t + 0.5}px; height:{e.t + 0.5}px; animation-delay:-{e.d}s; animation-duration:{e.v + 4}s"></span>
  {/each}

  <!-- Grand soleil couchant, très pâle -->
  <div class="soleil-pre"></div>

  <!-- Collines au loin -->
  <svg class="collines" viewBox="0 0 1000 200" preserveAspectRatio="none">
    <path d="M0 130 C 120 90 220 110 330 120 C 450 132 520 80 650 95 C 780 110 860 70 1000 100 L1000 200 L0 200 Z" fill="#8fb1ee" opacity="0.08" />
    <path d="M0 160 C 150 140 260 170 400 155 C 540 140 640 170 780 150 C 880 138 950 150 1000 145 L1000 200 L0 200 Z" fill="#8fb1ee" opacity="0.1" />
  </svg>

  <!-- Volcan et sa fumée -->
  <div class="volcan">
    <svg viewBox="0 0 200 160">
      <path d="M10 160 L 78 52 L 92 58 L 104 50 L 118 56 L 190 160 Z" fill="#8fb1ee" opacity="0.11" />
      <path d="M78 52 L 92 58 L 104 50 L 118 56 L 112 64 L 84 64 Z" fill="#b7c9f2" opacity="0.14" />
    </svg>
    {#each [0, 1, 2, 3] as k}
      <span class="fumee" style="animation-delay:-{k * 4.5}s"></span>
    {/each}
  </div>

</div>

{:else if univers === 'course'}
<div class="ciel course" aria-hidden="true">
  <!-- Feux de départ -->
  <div class="feux">
    {#each [0, 1, 2, 3, 4] as k}<span style="animation-delay:{k * 0.6}s"></span>{/each}
  </div>

  <!-- Drapeau à damier qui ondule doucement -->
  <svg class="damier" viewBox="0 0 120 90">
    <line x1="6" y1="0" x2="6" y2="90" stroke="#b7c9f2" stroke-width="3" />
    <g class="tissu">
      {#each Array(4) as _, l}
        {#each Array(6) as _, c}
          {#if (l + c) % 2 === 0}<rect x={8 + c * 18} y={4 + l * 14} width="18" height="14" fill="#b7c9f2" />{/if}
        {/each}
      {/each}
      <rect x="8" y="4" width="108" height="56" fill="none" stroke="#b7c9f2" stroke-width="2" />
    </g>
  </svg>

</div>

{:else}
<div class="ciel" aria-hidden="true">
  {#each etoiles as e}
    <span class="etoile" style="left:{e.x}%; top:{e.y}%; width:{e.t}px; height:{e.t}px; animation-delay:-{e.d}s; animation-duration:{e.v}s"></span>
  {/each}

  <!-- Grande planète à anneaux -->
  <div class="planete geante">
    <svg viewBox="0 0 200 200">
      <defs>
        <radialGradient id="fd-geante" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#5b86d6" />
          <stop offset="100%" stop-color="#1c3366" />
        </radialGradient>
        <clipPath id="fd-avant"><rect x="0" y="100" width="200" height="100" /></clipPath>
      </defs>
      <ellipse cx="100" cy="100" rx="96" ry="22" fill="none" stroke="#8fb1ee" stroke-width="5" opacity="0.5" transform="rotate(-18 100 100)" />
      <circle cx="100" cy="100" r="58" fill="url(#fd-geante)" />
      <path d="M46 88 Q100 78 154 90 M44 106 Q100 98 156 110 M50 124 Q100 118 150 128" stroke="#8fb1ee" stroke-width="5" fill="none" opacity="0.18" />
      <g clip-path="url(#fd-avant)" transform="rotate(-18 100 100)">
        <ellipse cx="100" cy="100" rx="96" ry="22" fill="none" stroke="#8fb1ee" stroke-width="5" opacity="0.5" />
      </g>
    </svg>
  </div>

  <!-- Petite lune qui tourne -->
  <div class="orbite">
    <div class="lune">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#9fb8e6" />
        <circle cx="36" cy="40" r="9" fill="#7f99c9" /><circle cx="62" cy="62" r="12" fill="#7f99c9" /><circle cx="64" cy="30" r="5" fill="#7f99c9" />
      </svg>
    </div>
  </div>

  <!-- Planète lointaine -->
  <div class="planete lointaine">
    <svg viewBox="0 0 100 100">
      <defs>
        <radialGradient id="fd-lointaine" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#4fb3b8" />
          <stop offset="100%" stop-color="#16485e" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#fd-lointaine)" />
      <path d="M8 44 Q50 36 92 46 M10 60 Q50 54 90 62" stroke="#9ff3e6" stroke-width="3" fill="none" opacity="0.25" />
    </svg>
  </div>
</div>
{/if}

<style>
  .ciel { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }

  .etoile {
    position: absolute; border-radius: 50%; background: #dfe9ff; opacity: 0.25;
    animation: scintille ease-in-out infinite alternate;
  }
  @keyframes scintille { from { opacity: 0.08; } to { opacity: 0.5; } }

  .planete, .orbite { position: absolute; }
  .planete svg, .lune svg { width: 100%; height: 100%; display: block; }

  .geante { width: min(46vmin, 380px); aspect-ratio: 1; right: -8vmin; top: 6vh; opacity: 0.28; animation: derive 90s ease-in-out infinite alternate; }
  @keyframes derive { from { translate: 0 0; rotate: -4deg; } to { translate: -5vmin 4vmin; rotate: 4deg; } }

  .orbite { width: 26vmin; height: 26vmin; left: 6vmin; top: 22vh; animation: tourne 140s linear infinite; }
  .lune { position: absolute; top: 0; left: 50%; width: min(7vmin, 60px); aspect-ratio: 1; translate: -50% 0; opacity: 0.3; }
  @keyframes tourne { to { rotate: 360deg; } }

  .lointaine { width: min(20vmin, 170px); aspect-ratio: 1; left: 8vw; bottom: 8vh; opacity: 0.22; animation: derive2 120s ease-in-out infinite alternate; }
  @keyframes derive2 { from { translate: 0 0; } to { translate: 6vmin -3vmin; } }

  /* --- Préhistoire --- */
  .poussiere { background: #dfe9ff; }
  .soleil-pre {
    position: absolute; width: min(38vmin, 320px); aspect-ratio: 1; left: -6vmin; top: 8vh; border-radius: 50%;
    background: radial-gradient(circle, rgba(143, 177, 238, 0.2), rgba(143, 177, 238, 0) 70%);
    animation: respire-soleil 40s ease-in-out infinite alternate;
  }
  @keyframes respire-soleil { to { scale: 1.08; translate: 2vmin 1vmin; } }
  .collines { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 26vh; }
  .volcan { position: absolute; left: -3vmin; bottom: 5vh; width: min(46vmin, 380px); aspect-ratio: 200 / 160; }
  .volcan svg { width: 100%; height: 100%; display: block; }
  .fumee {
    position: absolute; left: 46%; top: 22%; width: 12%; aspect-ratio: 1; border-radius: 50%;
    background: #8fb1ee; opacity: 0; animation: fumee 18s ease-out infinite;
  }
  @keyframes fumee {
    0% { opacity: 0; translate: 0 0; scale: 0.6; }
    15% { opacity: 0.13; }
    100% { opacity: 0; translate: -3vmin -26vmin; scale: 2.4; }
  }

  /* --- Course --- */
  .feux { position: absolute; top: 18vh; left: 5vw; display: flex; gap: 1.2vmin; opacity: 0.28; }
  .feux span { width: 2.6vmin; height: 2.6vmin; max-width: 22px; max-height: 22px; border-radius: 50%; background: #1c3366; animation: feu 6s ease-in-out infinite; }
  @keyframes feu { 0%, 40% { background: #1c3366; } 55%, 85% { background: #8fb1ee; } 100% { background: #1c3366; } }
  .damier { position: absolute; top: 26vh; left: 6vw; width: min(18vmin, 150px); opacity: 0.1; }
  .tissu { transform-origin: 8px 32px; transform-box: view-box; animation: ondule 5s ease-in-out infinite alternate; }
  @keyframes ondule { from { skew: 0deg -3deg; } to { skew: 0deg 4deg; scale: 0.96 1; } }

  @media (prefers-reduced-motion: reduce) { .ciel * { animation: none !important; } }
</style>
