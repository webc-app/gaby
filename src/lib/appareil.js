// Téléphone ou tablette ? Un téléphone a un petit côté de moins de 600 px, dans les deux sens (portrait ou paysage).
// Sur téléphone, la mise en page est resserrée (en portrait : l'en-tête sur deux lignes, tout tient dans l'écran).
export const estTelephone = () => typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 600;
