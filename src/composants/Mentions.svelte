<script>
  // Mentions légales, confidentialité et licences. Qui édite et héberge le site est réglé dans le fichier .env
  // (VITE_EDITEUR, CONTACT, VITE_HEBERGEUR, VITE_DEPOT), jamais dans le code : chacun met les siennes.
  // L'adresse de contact arrive codée (voir vite.config.js) et n'est décodée qu'à la demande.
  const editeur = import.meta.env.VITE_EDITEUR;
  const contactCode = __CONTACT__;
  let contact = $state('');
  const afficherContact = () => { contact = [...new TextDecoder().decode(Uint8Array.from(atob(contactCode), (c) => c.charCodeAt(0)))].reverse().join(''); };
  const hebergeur = import.meta.env.VITE_HEBERGEUR;
  const depot = import.meta.env.VITE_DEPOT;
</script>

<details class="carte aide mentions">
  <summary>Mentions légales et confidentialité</summary>

  {#if editeur || hebergeur || contactCode}
    <h3>Mentions légales</h3>
    {#if editeur}<p><strong>Éditeur</strong> : {editeur}</p>{/if}
    {#if contactCode}
      <p><strong>Contact</strong> :
        {#if contact}<a href="mailto:{contact}">{contact}</a>{:else}<button class="lien" onclick={afficherContact}>afficher l’adresse e-mail</button>{/if}
      </p>
    {/if}
    {#if hebergeur}<p><strong>Hébergeur</strong> : {hebergeur}</p>{/if}
  {/if}

  <h3>Confidentialité</h3>
  <p>
    Gaby ne demande ni nom, ni e-mail, ni photo, et ne collecte aucune donnée personnelle. Le pseudo, l’avatar,
    la tirelire et la progression sont enregistrés seulement dans ce navigateur, sur cet appareil : rien n’est envoyé
    au serveur ni ailleurs. Pas de compte, pas de cookie, pas de publicité, pas de statistiques, et l’app ne contacte
    aucun autre site.
  </p>
  <p>
    Pour tout effacer : « Supprimer le joueur » ci-dessus, ou effacer les données du site dans les réglages du navigateur.
    La copie de sauvegarde est un fichier que vous enregistrez vous-même : elle reste chez vous.
  </p>

  <h3>Licences</h3>
  <p>
    Code sous licence MIT, contenu pédagogique sous licence CC BY 4.0. Images, polices et voix viennent de sources
    libres (avatars DiceBear, drapeaux Flagpedia, photos NASA et Wikimedia Commons, polices Andika et Playwrite,
    voix Piper){#if depot}, détaillées dans le <a href={depot} target="_blank" rel="noopener">code source de Gaby</a>{/if}.
  </p>
  <p>
    Photo de la Lune : © Gregory H. Revera, CC BY-SA 3.0. Photo de Mars : © ESA &amp; MPS for OSIRIS Team
    MPS/UPD/LAM/IAA/RSSD/INTA/UPM/DASP/IDA, CC BY-SA 3.0 IGO.
  </p>
</details>

<style>
  /* même allure que les autres blocs repliables des réglages, détaché de ce qui précède */
  .mentions { margin-top: 0.9rem; }
  .mentions summary { font-weight: 700; font-size: 1.1rem; cursor: pointer; }
  .mentions h3 { font-size: 1rem; margin: 0.9rem 0 0.3rem; }
  .mentions p { margin: 0 0 0.5rem; font-size: 0.9rem; line-height: 1.4; color: var(--doux); }
  .mentions strong { color: var(--texte); }
  .mentions a { color: var(--jaune); }
  .lien { appearance: none; border: 0; background: none; padding: 0; color: var(--jaune); text-decoration: underline; cursor: pointer; font: inherit; }
</style>
