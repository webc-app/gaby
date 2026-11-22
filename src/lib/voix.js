// Les voix de l'app : tout ce qui est dit à voix haute est enregistré à l'avance (npm run voix),
// un fichier son par texte dans public/<dossier>/. Même voix sur iPhone, iPad, Android et ordinateur, et hors ligne.
// Sans dépendance : ce module sert aussi au script d'enregistrement.
//
// La dictée est dite par Piper (voix neuronale gratuite, qui tourne sur le Mac : champ piper), l'anglais par la voix du Mac (voixMac).
// Avec un fichier .env ElevenLabs (clé et voix), c'est ElevenLabs qui dit tout.

/** Pour chaque atelier qui parle : le dossier des sons, la langue, la voix Piper s'il y en a une, et la voix du Mac (de secours si Piper est là). */
export const VOIX = {
  anglais: { dossier: 'anglais', langue: 'en', voixMac: 'Samantha', vitesseMac: 150 },
  // la dictée : chaque mot est enregistré une fois, l'app le dit deux fois (repeter)
  dictee: { dossier: 'dictee', langue: 'fr', piper: 'fr_FR-siwis-medium', voixMac: 'Thomas', vitesseMac: 140, repeter: true },
};

/** Nom de fichier d'un texte : « la grenouille » → « la-grenouille », « éléphant » → « elephant » */
export const nomFichier = (texte) => texte.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Le son d'un texte pour un atelier : « dictee/la-grenouille » (sans extension) */
export const sonDe = (atelier, texte) => `${VOIX[atelier].dossier}/${nomFichier(texte)}`;
