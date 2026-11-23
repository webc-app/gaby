<script>
  // Ma tirelire : ce que l'enfant a gagné, ses derniers mouvements, et l'encaissement.
  // Il encaisse quand il veut (tout, ou une partie) ; un parent valide sur place avec son code.
  // Les conditions (quand, pour quoi) sont celles de chaque famille.
  import { app, sauver, euros, hacher, moisCourant, pseudo, enPoints, parUnite } from '../lib/etat.svelte.js';
  import { encaisser } from '../lib/progression.js';
  import { sons } from '../lib/sons.js';

  let { aller } = $props();

  const t = $derived(app.etat.tirelire);
  const gagneCeMois = $derived(t.mois === moisCourant() ? t.gagneMois : 0);

  // Étapes : 'tirelire' → 'code' (combien, puis le code d'un parent) → 'ouvert' (encaissé)
  let etape = $state('tirelire');
  let combien = $state(0); // en euros, ou en points
  let code = $state('');
  let erreur = $state('');
  let encaisse = $state(0);

  function demander() {
    sons.clic();
    combien = t.solde / parUnite();
    code = '';
    erreur = '';
    etape = 'code';
  }

  function valider(e) {
    e.preventDefault();
    const voulu = Math.round(Number(combien) * parUnite());
    if (!(voulu > 0) || voulu > t.solde) { sons.oups(); erreur = `Choisis un montant entre ${euros(1)} et ${euros(t.solde)}.`; return; }
    if (hacher(code) !== app.etat.reglages.pinHash) {
      sons.oups();
      erreur = 'Ce n’est pas le bon code.';
      code = '';
      return;
    }
    encaisse = encaisser(app.etat, voulu);
    sauver();
    etape = 'ouvert';
    sons.eclosion();
    setTimeout(sons.victoire, 700);
  }

  const date = (ms) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
</script>

<header>
  <button class="retour" onclick={aller}>← Retour</button>
</header>

<main>
  {#if etape === 'ouvert'}
    <div class="bravo">
      <h1>Bravo {pseudo()} ! 🎉</h1>
      <p>{euros(encaisse)} encaissés.{#if t.solde > 0}{' '}Il reste {euros(t.solde)} dans ta tirelire.{/if}</p>
      <button class="bouton jaune" onclick={() => (etape = 'tirelire')}>Continuer</button>
    </div>
    {#each Array(28) as _, n}
      <span class="confetti" style="left:{(n * 37) % 100}%; animation-delay:{(n % 7) * 0.12}s">{['🎉', '⭐', '💶', '💰'][n % 4]}</span>
    {/each}
  {:else}
    <div class="solde">
      <span class="titre-solde">Ma tirelire</span>
      <strong>{euros(t.solde)}</strong>
    </div>

    {#if etape === 'tirelire'}
      <button class="bouton vert large" disabled={t.solde <= 0} onclick={demander}>{enPoints() ? '⭐' : '💶'} Encaisser</button>
      <p class="petit">Papa ou maman valide avec son code.</p>
    {:else}
      <section class="carte">
        {#if app.etat.reglages.pinHash}
          <form onsubmit={valider}>
            <label>
              <span>Combien veux-tu encaisser ?</span>
              <span class="montant"><input bind:value={combien} type="number" min={1 / parUnite()} max={t.solde / parUnite()} step={1 / parUnite()} inputmode={enPoints() ? 'numeric' : 'decimal'} aria-label="Montant à encaisser" /> {enPoints() ? 'points' : '€'}</span>
            </label>
            <label>
              <span>Papa ou maman, votre code :</span>
              <input bind:value={code} type="password" inputmode="numeric" autocomplete="off" aria-label="Code parent" />
            </label>
            {#if erreur}<p class="erreur">{erreur}</p>{/if}
            <button class="bouton jaune">Valider</button>
          </form>
        {:else}
          <p>Il faut d’abord créer un code parent dans les réglages.</p>
        {/if}
        <button class="lien" onclick={() => (etape = 'tirelire')}>Annuler</button>
      </section>
    {/if}

    {#if t.journal.length}
      <section class="carte">
        <h2>Derniers mouvements</h2>
        {#each t.journal.slice(0, 10) as m}
          <div class="ligne"><span>{date(m.t)} · {m.motif}</span><strong class:moins={m.montant < 0}>{m.montant > 0 ? '+' : '−'}{euros(Math.abs(m.montant))}</strong></div>
        {/each}
      </section>
    {/if}

    <p class="petit">Ce mois-ci : {euros(gagneCeMois)} gagnés.</p>
  {/if}
</main>

<style>
  main { display: flex; flex-direction: column; align-items: center; gap: 0.9rem; margin-top: 0.4rem; text-align: center; }
  .solde { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; width: 100%; }
  .solde strong { font-size: 2.8rem; color: var(--jaune); }
  .titre-solde { font-weight: 700; color: var(--doux); }
  .large { width: 100%; font-size: 1.3rem; }
  .petit { font-size: 0.85rem; color: var(--doux); margin: 0; }
  .carte { width: 100%; display: flex; flex-direction: column; gap: 0.7rem; }
  h2 { font-size: 1.15rem; }
  form { display: flex; flex-direction: column; gap: 0.8rem; }
  label { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; text-align: left; }
  .montant { display: flex; align-items: center; gap: 0.5rem; font-size: 1.3rem; }
  .montant input { flex: 1; }
  input {
    min-width: 0; font: inherit; font-size: 1.4rem; text-align: center; padding: 0.6rem; border-radius: 0.9rem;
    border: 2px solid var(--doux); background: var(--fond-2); color: var(--texte);
  }
  .erreur { color: var(--rouge); margin: 0; }
  .lien { appearance: none; border: 0; background: none; color: var(--doux); text-decoration: underline; cursor: pointer; font: inherit; font-size: 0.9rem; }
  .ligne { display: flex; justify-content: space-between; gap: 0.6rem; padding: 0.3rem 0; font-size: 0.9rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); text-align: left; }
  .ligne strong { color: var(--jaune); white-space: nowrap; }
  .ligne strong.moins { color: var(--doux); }
  .bravo { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
  .bravo h1 { font-size: 2rem; }
  .bravo p { margin: 0; font-size: 1.15rem; }
  .confetti { position: fixed; top: -2rem; font-size: 1.6rem; pointer-events: none; z-index: 19; animation: tombe 2.6s ease-in forwards; }
  @keyframes tombe { to { translate: 0 110vh; rotate: 540deg; } }
</style>
