// Les temps de conjugaison : ce que chaque temps a de particulier, pour la vérification du contenu
// et pour fabriquer les mauvaises réponses. Un fichier par temps dans contenu/ (voir FICHIERS).
// Aucune dépendance : lu aussi par la vérification (Node).

export const PERSONNES = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];

const sans = (forme, fin) => (forme.endsWith(fin) ? forme.slice(0, -fin.length) : null);
/** Des fautes de terminaison : on remplace la terminaison régulière par des terminaisons fausses. */
const parFins = (fins, fausses) => (bonne, p) => {
  const radical = fins[p] ? sans(bonne, fins[p]) : null;
  return radical === null ? [] : (fausses[p] ?? []).map((fin) => radical + fin);
};

// Passé composé : les fautes portent sur le participe (joué → jouer, jouait) et sur l'auxiliaire (ai ↔ suis)
const AUTRE_AUXILIAIRE = { ai: 'suis', as: 'es', a: 'est', avons: 'sommes', avez: 'êtes', ont: 'sont', suis: 'ai', es: 'as', est: 'a', sommes: 'avons', 'êtes': 'avez', sont: 'ont' };
const FAUX_PARTICIPES = [
  ['és', ['er', 'é', 'ez']], ['é', ['er', 'ait', 'ez', 'ée']],
  ['is', ['it', 'i']], ['it', ['is', 'i']], ['i', ['it', 'is', 'ie']],
  ['us', ['u', 'ut']], ['u', ['ut', 'us']], ['t', ['s', '']],
];
const AVOIR = ['ai', 'as', 'a', 'avons', 'avez', 'ont'];
function fautesParticipe(bonne, p) {
  const [aux, ...reste] = bonne.split(' ');
  const participe = reste.join(' ');
  const regle = FAUX_PARTICIPES.find(([fin]) => participe.endsWith(fin) && participe.length > fin.length);
  let faux = regle ? regle[1].map((fin) => `${participe.slice(0, -regle[0].length)}${fin}`) : [];
  // Avec être, le féminin (allée) n'est pas une faute, ni le singulier après « vous » (vous êtes allé, à une seule personne)
  if (!AVOIR.includes(aux)) faux = faux.filter((x) => !/[éiu]e$/.test(x) && !(p === 'vous' && `${x}s` === participe));
  faux = faux.map((x) => `${aux} ${x}`);
  return AUTRE_AUXILIAIRE[aux] ? [...faux, `${AUTRE_AUXILIAIRE[aux]} ${participe}`] : faux;
}

// Présent, au singulier : des lettres finales fausses (je joue → jous, jout ; je peux → peu, peus ; je chante → chants)
function fautesPresentSingulier(bonne) {
  const radical = bonne.replace(/(es|e|s|t|x|d)$/, '');
  if (radical.length < 3) return [];
  const voyelle = /[aeiouyéè]$/.test(radical);
  // « jou » ou « chant » tout seuls ne trompent personne ; « peu », « fini » si
  if (voyelle) return [radical, `${radical}s`, `${radical}t`];
  return [`${radical}s`, ...(/es?$/.test(bonne) ? [] : [`${radical}e`])];
}
const presentPluriel = parFins({ nous: 'ons', vous: 'ez', ils: 'ent' }, { nous: ['ont', 'on', 'ions'], vous: ['er', 'é', 'és'], ils: ['ents', 'es', 'ont'] });

/**
 * Pour chaque temps :
 * - `nom` : « à l’imparfait » (dans la consigne) ;
 * - `memeSon` : les personnes dont la forme se prononce pareil (proposées en priorité) ;
 * - `fautes(bonne, personne)` : des formes fausses plausibles (celles qui existent vraiment sont écartées ensuite) ;
 * - `finJe` : la terminaison obligatoire à « je » (contrôle), aussi celle des « Pièges » qu'on décline ;
 * - `pieges` : 'decline' (écrits à « je », déclinés aux autres personnes), 'participe' (un participe faux), ou rien ;
 * - `deuxMots` : chaque forme est « auxiliaire participe » ; `pronomFixe` : toujours « Il », jamais « Elle » (accord).
 */
export const TEMPS = {
  imparfait: {
    nom: 'à l’imparfait', prefixe: 't', finJe: 'ais', pieges: 'decline',
    fins: { je: 'ais', tu: 'ais', il: 'ait', nous: 'ions', vous: 'iez', ils: 'aient' },
    memeSon: { je: ['il', 'ils'], tu: ['il', 'ils'], il: ['je', 'ils'], ils: ['il', 'je'], nous: ['vous'], vous: ['nous'] },
    fausses: { je: ['ai', 'é', 'és'], tu: ['ai', 'é', 'és'], il: ['ai', 'é', 'ais'], nous: ['ons', 'iont', 'illons'], vous: ['ez', 'iés', 'ier'], ils: ['aint', 'aits', 'ais'] },
  },
  futur: {
    nom: 'au futur', prefixe: 't-futur', finJe: 'ai', pieges: 'decline',
    fins: { je: 'ai', tu: 'as', il: 'a', nous: 'ons', vous: 'ez', ils: 'ont' },
    memeSon: { je: ['vous'], tu: ['il'], il: ['tu'], nous: ['ils'], vous: ['je'], ils: ['nous'] },
    fausses: { je: ['ais', 'é', 'ait'], tu: ['at', 'ais', 'ât'], il: ['at', 'ait', 'ât'], nous: ['ont', 'on', 'ions'], vous: ['er', 'é', 'iez'], ils: ['ons', 'onts', 'on'] },
  },
  present: {
    nom: 'au présent', prefixe: 't-present',
    memeSon: { je: ['tu', 'il', 'ils'], tu: ['je', 'il', 'ils'], il: ['je', 'tu', 'ils'], ils: ['il', 'tu', 'je'], nous: [], vous: [] },
    fautes: (bonne, p) => (['je', 'tu', 'il'].includes(p) ? fautesPresentSingulier(bonne) : presentPluriel(bonne, p)),
  },
  'passe compose': {
    nom: 'au passé composé', prefixe: 't-pc', pieges: 'participe', deuxMots: true, pronomFixe: true,
    memeSon: {},
    fautes: fautesParticipe,
  },
};
for (const t of Object.values(TEMPS)) t.fautes ??= parFins(t.fins, t.fausses);

// Le fichier de contenu de chaque temps (contenu/<fichier>.md) ; « conjugaison » est l'imparfait, le premier écrit
export const FICHIERS = { present: 'present', futur: 'futur', conjugaison: 'imparfait', 'passe-compose': 'passe compose' };
