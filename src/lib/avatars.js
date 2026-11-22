// Les avatars proposés aux joueurs (images dans public/avatars/) : dix-huit personnages du style « Voxel Art »
// de DiceBear (dicebear.com, licence CC0), enregistrés une fois pour toutes : l'app ne demande rien à un autre site.
export const AVATARS = Array.from({ length: 18 }, (_, i) => {
  const id = `voxel-${String(i + 1).padStart(2, '0')}`;
  return { id, src: `./avatars/${id}.svg` };
});

// Les profils créés avant le 2026-11-22 portent encore le nom d'un ancien avatar : chacun reçoit le personnage de même rang.
const ANCIENS = ['pilote-ours', 'ours-grognon', 'pilote', ...Array.from({ length: 15 }, (_, i) => `avatar-${String(i + 1).padStart(2, '0')}`)];
const avatarDe = (id) => AVATARS.find((a) => a.id === id) ?? AVATARS[Math.max(0, ANCIENS.indexOf(id))];
export const srcAvatar = (id) => avatarDe(id).src;
export const idAvatar = (id) => avatarDe(id).id;

// Pseudos proposés au hasard (bouton 🎲) : un animal et un adjectif, jamais un vrai nom ni un personnage connu.
// L'enfant peut aussi écrire le sien : le champ dit « Pas ton vrai nom ! ».
const ANIMAUX = [
  ['Tigre', 'm'], ['Hibou', 'm'], ['Renard', 'm'], ['Panda', 'm'], ['Dauphin', 'm'], ['Lynx', 'm'], ['Koala', 'm'],
  ['Castor', 'm'], ['Faucon', 'm'], ['Lama', 'm'], ['Requin', 'm'], ['Pingouin', 'm'], ['Écureuil', 'm'], ['Lézard', 'm'],
  ['Loutre', 'f'], ['Panthère', 'f'], ['Chouette', 'f'], ['Baleine', 'f'], ['Tortue', 'f'], ['Gazelle', 'f'], ['Licorne', 'f'], ['Fourmi', 'f'],
];
const ADJECTIFS = [
  ['Rapide', 'Rapide'], ['Malin', 'Maligne'], ['Joyeux', 'Joyeuse'], ['Curieux', 'Curieuse'], ['Agile', 'Agile'], ['Brave', 'Brave'],
  ['Rusé', 'Rusée'], ['Calme', 'Calme'], ['Bleu', 'Bleue'], ['Doré', 'Dorée'], ['Futé', 'Futée'], ['Rigolo', 'Rigolote'], ['Costaud', 'Costaude'],
];
const auHasard = (liste) => liste[Math.floor(Math.random() * liste.length)];
export function pseudoAuHasard(sauf) {
  let pseudo;
  do {
    const [animal, genre] = auHasard(ANIMAUX);
    const [m, f] = auHasard(ADJECTIFS);
    pseudo = `${animal} ${genre === 'f' ? f : m}`;
  } while (pseudo === sauf || pseudo.length > 20);
  return pseudo;
}
