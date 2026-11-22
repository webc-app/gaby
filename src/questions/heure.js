// L'heure : une horloge à aiguilles, choisir l'heure en chiffres (format 24 h). Réglages : contenu/heure.md
import C from 'virtual:contenu';
import { reglageDu, sansPoint } from './outils.js';
import { poids, tirer1, melanger, hasard } from '../lib/progression.js';

const MOMENTS = [
  { de: 6, a: 11, texte: '☀️ Le matin' },
  { de: 12, a: 17, texte: '🌤️ L’après-midi' },
  { de: 18, a: 23, texte: '🌙 Le soir' },
];
const moment = (h) => MOMENTS.find((x) => h >= x.de && h <= x.a);
const ecrire = (h, m) => `${String(((h % 24) + 24) % 24).padStart(2, '0')}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;

const H = C.heure;

/** Les pièges classiques : 12 h d'écart, aiguilles inversées, l'heure d'avant ou d'après, quelques minutes de décalage. */
function leurres(h, m) {
  const autreMoitie = h >= 12 ? h - 12 : h + 12;
  const inverse = [Math.round(m / 5) % 12 || 12, ((h % 12) * 5) % 60];
  return [
    ecrire(autreMoitie, m),
    ecrire(h - 1, m),
    ecrire(h + 1, m),
    ecrire(h, m + 30),
    ecrire(h, m === 0 ? 15 : m - 5),
    ...(m % 5 ? [ecrire(h, m + 1), ecrire(h, m - 1), ecrire(h, m + 5)] : []), // à la minute près : la minute d'à côté
    ecrire(h >= 12 ? inverse[0] + 12 : inverse[0], inverse[1]),
  ];
}

export default {
  id: 'heure',
  nom: H.titre,
  description: sansPoint(H.description),
  couleur: '#ffd23d',
  niveaux: H.niveaux,
  generer(niveau, etat, precedente) {
    const n = reglageDu(H.reglages, niveau);
    const toutes = n.heures.flatMap((h) => n.minutes.map((m) => [h, m]));
    const cleDe = ([h, m]) => `h:${ecrire(h, m)}`;
    const [h, m] = tirer1(toutes, (x) => poids(etat, cleDe(x)), cleDe, precedente);
    const juste = ecrire(h, m);
    const pieges = melanger([...new Set(leurres(h, m))].filter((x) => x !== juste));
    while (pieges.length < 3) pieges.push(ecrire(h, hasard(0, 11) * 5));
    return {
      cle: cleDe([h, m]),
      texte: juste,
      horloge: { h, m },
      consigne: `${moment(h).texte} : quelle heure est-il ?`,
      reponse: juste,
      choix: melanger([juste, ...[...new Set(pieges)].filter((x) => x !== juste).slice(0, 3)]),
      explication: `La petite aiguille montre les heures, la grande les minutes : ${juste}`,
    };
  },
};
