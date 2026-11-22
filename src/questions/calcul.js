// Calcul mental : une réponse à choisir parmi quatre (au clavier, on n'écrit que des mots, jamais des chiffres).
// Réglages : contenu/calcul.md
import C from 'virtual:contenu';
import { questionTable, questionCalcul } from './tables.js';
import { reglageDu, sansPoint } from './outils.js';

const K = C.calcul;
const TABLES = { tables2a5: { tables: [2, 3, 4, 5] }, tables: { tables: [2, 3, 4, 5, 6, 7, 8, 9], proches: true } };

export default {
  id: 'calcul',
  nom: K.titre,
  description: sansPoint(K.description),
  couleur: '#ffd23d',
  temps: 8, // temps de base en mode chrono (ensuite calé sur ses propres réponses)
  niveaux: K.niveaux,
  generer(niveau, etat, precedente) {
    const types = reglageDu(K.reglages, niveau);
    const type = types[Math.floor(Math.random() * types.length)];
    return TABLES[type] ? questionTable(TABLES[type], etat, precedente) : questionCalcul(type, etat, precedente);
  },
};
