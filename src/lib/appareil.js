// Téléphone ou tablette ? Un téléphone a un petit côté de moins de 600 px, dans les deux sens (portrait ou paysage).
// Sur téléphone, la mise en page est resserrée (pas d'avatar ni de nom d'atelier en haut, tout tient dans l'écran).
export const estTelephone = () => typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 600;
