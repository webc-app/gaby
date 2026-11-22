// Les ateliers « questions à 4 réponses » (Culture, Échecs, Code de la route) : même fiches, même fonctionnement.
// Un thème au hasard (à parts égales), puis une question de ce thème. Sans mauvaises réponses écrites,
// on prend les bonnes réponses des autres questions identiques du thème (« Quelle est cette pièce ? »…).
import C from 'virtual:contenu';
import { melanger } from '../lib/progression.js';
import { tirerFiche, sansPoint } from './outils.js';

export function atelierQcm(id, { couleur, temps = 15 }) {
  const K = C[id];
  const themes = [...new Set(K.items.map((x) => x.theme))];
  return {
    id,
    nom: K.titre,
    description: sansPoint(K.description),
    couleur,
    temps, // temps de base en mode chrono (ensuite calé sur ses propres réponses)
    niveaux: K.niveaux,
    generer(niveau, etat, precedente) {
      const dispo = themes.filter((t) => K.items.some((x) => x.theme === t && x.niveau <= niveau));
      const theme = dispo[Math.floor(Math.random() * dispo.length)];
      const cleDe = (x) => `g:${x.question}|${x.bonne}`;
      const f = tirerFiche(K.items.filter((x) => x.theme === theme), niveau, K.niveaux, etat, cleDe, precedente);

      let faux = [...f.mauvaises];
      if (faux.length < 3) {
        const voisins = K.items.filter((x) => x.theme === f.theme && x.question === f.question && x.bonne !== f.bonne && !faux.includes(x.bonne));
        // d'abord ceux du même niveau (les drapeaux voisins se ressemblent), puis les autres
        const proches = melanger(voisins.filter((x) => x.niveau === f.niveau)).concat(melanger(voisins.filter((x) => x.niveau !== f.niveau)));
        faux = [...faux, ...new Set(proches.map((x) => x.bonne))].slice(0, 3);
      }
      return {
        cle: cleDe(f),
        texte: f.question,
        visuel: f.image?.type === 'fichier' ? { ...f.image, src: C.images[f.image.id] } : f.image,
        drapeau: f.drapeau && C.svgDrapeaux[f.drapeau], // l'adresse du fichier src/drapeaux/<code>.svg
        consigne: f.question,
        reponse: f.bonne,
        choix: melanger([f.bonne, ...faux]),
        explication: f.explication ?? `C’était : ${f.bonne}`,
      };
    },
  };
}
