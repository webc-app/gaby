// Textes courts affichés pendant le jeu. La bulle du monstre, elle, décrit l'exercice en cours
// (champ `description` de chaque matière, dans src/questions/).

/** max : le niveau max de l'atelier (le dernier, où tout est mélangé) */
export const niveauGagne = (niveau, nouveau, max) => {
  const nom = niveau >= max ? 'Niveau max' : `Niveau ${niveau}`;
  if (!nouveau) return `${nom} retrouvé ! 💪`;
  return niveau >= max ? 'Niveau max ! 🏆' : `${nom} ! 🚀`;
};
/** « Niveau 3 » ou « Niveau max 🏆 » */
export const nomNiveau = (niveau, max) => (niveau >= max ? 'Niveau max 🏆' : `Niveau ${niveau}`);
