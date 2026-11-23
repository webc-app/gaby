<script>
  // Le décor derrière l'app, selon l'univers : espace, préhistoire, course, Noël, océan ou Halloween.
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

{:else if univers === 'noel'}
<div class="ciel noel" aria-hidden="true">
  <!-- Flocons qui tombent très lentement -->
  {#each etoiles.slice(0, 30) as e}
    <span class="flocon" style="left:{e.x}%; width:{e.t + 1.5}px; height:{e.t + 1.5}px; animation-delay:-{e.d * 4}s; animation-duration:{e.v * 4}s"></span>
  {/each}

  <!-- Colline enneigée et sapins -->
  <svg class="sol" viewBox="0 0 1000 200" preserveAspectRatio="none">
    <path d="M0 150 C 200 120 380 140 560 135 C 740 130 860 115 1000 125 L1000 200 L0 200 Z" fill="#8fb1ee" opacity="0.1" />
  </svg>
  <svg class="sapins" viewBox="0 0 240 200">
    <g fill="#8fb1ee">
      <path d="M150 20 L 196 92 L 176 92 L 214 150 L 190 150 L 228 196 L 72 196 L 110 150 L 86 150 L 124 92 L 104 92 Z" opacity="0.13" />
      <path d="M58 90 L 86 134 L 74 134 L 98 168 L 18 168 L 42 134 L 30 134 Z" opacity="0.1" />
    </g>
    <!-- L'étoile du grand sapin, qui scintille doucement -->
    <path class="etoile-sapin" transform="translate(140 6)" d="M10 0 L 12.4 7 L 20 7.4 L 14 12 L 16.2 19.5 L 10 15 L 3.8 19.5 L 6 12 L 0 7.4 L 7.6 7 Z" fill="#dfe9ff" />
  </svg>
</div>

{:else if univers === 'ocean'}
<div class="ciel ocean" aria-hidden="true">
  <!-- Lumière qui descend de la surface -->
  <div class="rayons"></div>

  <!-- Bulles qui montent très lentement -->
  {#each etoiles.slice(0, 24) as e}
    <span class="bulle" style="left:{e.x}%; width:{e.t * 2 + 2}px; height:{e.t * 2 + 2}px; animation-delay:-{e.d * 4}s; animation-duration:{e.v * 4}s"></span>
  {/each}

  <!-- Un poisson qui traverse de temps en temps -->
  <svg class="poisson" viewBox="0 0 60 30">
    <path d="M4 15 C 14 3 34 3 44 15 C 34 27 14 27 4 15 Z M44 15 L 58 5 L 54 15 L 58 25 Z" fill="#8fb1ee" />
  </svg>

  <!-- Fond de sable et algues -->
  <svg class="sable" viewBox="0 0 1000 200" preserveAspectRatio="none">
    <path d="M0 160 C 180 140 340 165 520 155 C 700 145 860 160 1000 150 L1000 200 L0 200 Z" fill="#8fb1ee" opacity="0.1" />
  </svg>
  <svg class="algues" viewBox="0 0 120 160">
    <g fill="none" stroke="#8fb1ee" stroke-width="7" stroke-linecap="round">
      <path class="algue" d="M30 160 C 18 130 42 110 28 80 C 16 54 36 36 30 14" opacity="0.13" />
      <path class="algue lente" d="M64 160 C 76 132 52 112 66 86 C 78 64 58 50 64 34" opacity="0.1" />
      <path class="algue" d="M94 160 C 84 140 104 124 94 104" opacity="0.12" />
    </g>
  </svg>
</div>

{:else if univers === 'halloween'}
<div class="ciel halloween" aria-hidden="true">
  {#each etoiles.slice(0, 26) as e}
    <span class="etoile" style="left:{e.x}%; top:{e.y * 0.7}%; width:{e.t}px; height:{e.t}px; animation-delay:-{e.d}s; animation-duration:{e.v}s"></span>
  {/each}

  <!-- Grosse lune pleine -->
  <div class="lune-pleine"></div>

  <!-- Chauves-souris qui passent lentement -->
  {#each [0, 1] as k}
    <svg class="chauve-souris" style="top:{14 + k * 12}vh; animation-delay:-{k * 21}s" viewBox="0 0 60 24">
      <path d="M30 8 C 26 4 22 4 18 8 C 14 2 6 2 0 6 C 6 8 8 14 8 18 C 12 14 16 14 20 18 C 22 14 26 12 30 16 C 34 12 38 14 40 18 C 44 14 48 14 52 18 C 52 14 54 8 60 6 C 54 2 46 2 42 8 C 38 4 34 4 30 8 Z" fill="#8fb1ee" />
    </svg>
  {/each}

  <!-- Colline et citrouille dont le visage luit doucement -->
  <svg class="sol" viewBox="0 0 1000 200" preserveAspectRatio="none">
    <path d="M0 140 C 160 120 300 150 480 145 C 660 140 820 120 1000 135 L1000 200 L0 200 Z" fill="#8fb1ee" opacity="0.1" />
  </svg>
  <svg class="citrouille" viewBox="0 0 100 90">
    <path d="M50 18 C 52 8 56 4 62 2" stroke="#8fb1ee" stroke-width="5" fill="none" opacity="0.14" stroke-linecap="round" />
    <ellipse cx="50" cy="54" rx="44" ry="34" fill="#8fb1ee" opacity="0.13" />
    <path d="M50 20 C 38 30 38 78 50 88 M50 20 C 62 30 62 78 50 88" stroke="#0d1b3e" stroke-width="2" fill="none" opacity="0.25" />
    <g class="visage" fill="#dfe9ff">
      <path d="M26 44 L 38 44 L 32 34 Z M62 44 L 74 44 L 68 34 Z" />
      <path d="M24 60 C 34 74 66 74 76 60 L 68 62 L 62 68 L 56 62 L 50 68 L 44 62 L 38 68 L 32 62 Z" />
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

  /* --- Noël --- */
  .flocon {
    position: absolute; top: -2vh; border-radius: 50%; background: #dfe9ff; opacity: 0.3;
    animation: tombe linear infinite;
  }
  @keyframes tombe {
    0% { translate: 0 0; }
    50% { translate: 2vmin 52vh; }
    100% { translate: -1vmin 106vh; }
  }
  .sol { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 22vh; }
  .sapins { position: absolute; right: 2vw; bottom: 4vh; width: min(40vmin, 330px); }
  .etoile-sapin { animation: scintille-sapin 6s ease-in-out infinite alternate; }
  @keyframes scintille-sapin { from { opacity: 0.12; } to { opacity: 0.35; } }

  /* --- Océan --- */
  .rayons {
    position: absolute; inset: 0 0 auto 0; height: 70vh;
    background: repeating-linear-gradient(100deg, rgba(143, 177, 238, 0.05) 0 6vw, transparent 6vw 14vw);
    mask-image: linear-gradient(to bottom, #000, transparent); -webkit-mask-image: linear-gradient(to bottom, #000, transparent);
    animation: rayons 30s ease-in-out infinite alternate;
  }
  @keyframes rayons { to { translate: 4vw 0; opacity: 0.6; } }
  .bulle {
    position: absolute; bottom: -2vh; border-radius: 50%; border: 1px solid #dfe9ff; opacity: 0.25;
    animation: monte linear infinite;
  }
  @keyframes monte {
    0% { translate: 0 0; }
    50% { translate: 1.5vmin -52vh; }
    100% { translate: -1vmin -106vh; }
  }
  .poisson { position: absolute; top: 34vh; left: -12vmin; width: min(10vmin, 80px); opacity: 0.14; scale: -1 1; animation: nage 60s linear infinite; }
  @keyframes nage { 0% { left: -12vmin; translate: 0 0; } 50% { translate: 0 3vh; } 100% { left: 110vw; translate: 0 0; } }
  .sable { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 18vh; }
  .algues { position: absolute; right: 4vw; bottom: 2vh; width: min(24vmin, 200px); }
  .algue { transform-origin: 50% 100%; transform-box: fill-box; animation: algue 9s ease-in-out infinite alternate; }
  .algue.lente { animation-duration: 13s; animation-delay: -4s; }
  @keyframes algue { from { rotate: -4deg; } to { rotate: 5deg; } }

  /* --- Halloween --- */
  .lune-pleine {
    position: absolute; width: min(30vmin, 250px); aspect-ratio: 1; right: 4vw; top: 6vh; border-radius: 50%;
    background: radial-gradient(circle at 40% 40%, rgba(223, 233, 255, 0.22), rgba(143, 177, 238, 0.1) 60%, rgba(143, 177, 238, 0) 72%);
  }
  .chauve-souris { position: absolute; left: -10vmin; width: min(6vmin, 48px); opacity: 0.16; animation: vole 42s linear infinite; }
  @keyframes vole {
    0% { left: -10vmin; translate: 0 0; }
    25% { translate: 0 -3vh; } 50% { translate: 0 2vh; } 75% { translate: 0 -2vh; }
    100% { left: 110vw; translate: 0 0; }
  }
  .citrouille { position: absolute; right: 6vw; bottom: 5vh; width: min(20vmin, 160px); }
  .visage { animation: luit 7s ease-in-out infinite alternate; }
  @keyframes luit { from { opacity: 0.08; } to { opacity: 0.3; } }

  @media (prefers-reduced-motion: reduce) { .ciel * { animation: none !important; } }
</style>
