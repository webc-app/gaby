// Lecture : des histoires à lire, puis 3 questions de compréhension. Contenu : contenu/lecture/*.md (une histoire par fichier)
import C from 'virtual:contenu';

export default {
  id: 'lecture',
  nom: 'Lecture',
  description: 'Lire une histoire, tranquillement',
  couleur: '#9ff3e6',
  lecture: true,
  textes: C.lecture.textes,
};
