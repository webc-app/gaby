// npm run contenu : vérifie tous les fichiers du dossier contenu/ et résume ce qu'ils contiennent.
import { existsSync } from 'node:fs';
import { chargerContenu, texteErreurs } from './contenu.js';
import { VOIX, nomFichier } from '../src/lib/voix.js';

const { contenu, erreurs } = chargerContenu();

if (erreurs.length) {
  console.log(`\n✗ ${erreurs.length} problème${erreurs.length > 1 ? 's' : ''} à corriger :\n`);
  console.log(texteErreurs(erreurs));
  console.log('');
  process.exit(1);
}

// Les sons à enregistrer (npm run voix) : la dictée et l'anglais
const aDire = {
  dictee: contenu.dictee.mots.map((m) => m.texte),
  anglais: [...contenu.anglais.mots.map((m) => m.anglais), ...contenu.anglais.dialogues.flatMap((d) => [d.question, d.bonne, ...d.mauvaises])],
};
const manquants = Object.entries(aDire).flatMap(([a, textes]) => textes.filter((t) => !existsSync(new URL(`../public/${VOIX[a].dossier}/${nomFichier(t)}.m4a`, import.meta.url))).map((t) => `${a} : ${t}`));
if (manquants.length) {
  console.log(`\n⚠ ${manquants.length} son${manquants.length > 1 ? 's' : ''} pas encore enregistré${manquants.length > 1 ? 's' : ''} : lancer « npm run voix » (sur le Mac).`);
  console.log(manquants.slice(0, 10).map((m) => `  ${m}`).join('\n'));
}

const compte = (c) => (c.verbes ? c.verbes.length + c.phrases.length : null) ?? c.items?.length ?? c.mots?.length ?? c.pays?.length ?? c.groupes?.reduce((n, g) => n + g.phrases.length, 0) ?? 0;
console.log('\n✓ Contenu vérifié, aucun problème.\n');
for (const [id, c] of Object.entries(contenu)) {
  if (id === 'lecture') continue;
  const quoi = c.reglages ? 'réglages' : `${compte(c) + (c.dialogues?.length ?? 0)} questions`;
  console.log(`  ${(c.titre || id).padEnd(16)} ${String(c.niveaux).padStart(2)} niveaux · ${quoi}`);
}
console.log(`  ${'Lecture'.padEnd(16)} ${contenu.lecture.textes.length} histoire${contenu.lecture.textes.length > 1 ? 's' : ''}\n`);
