<script>
  // Une horloge à aiguilles, simple et lisible.
  let { h = 0, m = 0, taille = 180 } = $props();
  const angleH = $derived(((h % 12) + m / 60) * 30);
  const angleM = $derived(m * 6);
</script>

<svg viewBox="0 0 200 200" width={taille} height={taille} role="img" aria-label="Horloge">
  <circle cx="100" cy="100" r="94" fill="#fffaf0" stroke="#ffd23d" stroke-width="8" />
  {#each Array(60) as _, i}
    {@const a = (i * 6 * Math.PI) / 180}
    {@const long = i % 5 === 0}
    <line x1={100 + Math.sin(a) * (long ? 76 : 82)} y1={100 - Math.cos(a) * (long ? 76 : 82)} x2={100 + Math.sin(a) * 87} y2={100 - Math.cos(a) * 87}
      stroke="#1a2440" stroke-width={long ? 3.5 : 1.5} stroke-linecap="round" />
  {/each}
  {#each Array(12) as _, i}
    {@const n = i + 1}
    {@const a = (n * 30 * Math.PI) / 180}
    <text x={100 + Math.sin(a) * 62} y={100 - Math.cos(a) * 62 + 7} text-anchor="middle" font-size="20" font-weight="700" fill="#1a2440" font-family="Andika, sans-serif">{n}</text>
  {/each}
  <!-- Petite aiguille : les heures -->
  <line x1="100" y1="100" x2="100" y2="54" stroke="#1a2440" stroke-width="8" stroke-linecap="round" transform="rotate({angleH} 100 100)" />
  <!-- Grande aiguille : les minutes -->
  <line x1="100" y1="100" x2="100" y2="26" stroke="#ff5a6e" stroke-width="5" stroke-linecap="round" transform="rotate({angleM} 100 100)" />
  <circle cx="100" cy="100" r="7" fill="#1a2440" />
</svg>
