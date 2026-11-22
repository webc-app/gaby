// Fabrique des centaines de questions dans chaque atelier, à chaque niveau (jusqu'au niveau max),
// et vérifie qu'elles sont jouables : bonne réponse parmi les choix, 4 choix différents, rien de vide.
//   node scripts/tester-ateliers.mjs
import { createServer } from 'vite';

const serveur = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { matieres } = await serveur.ssrLoadModule('/src/questions/index.js');
const { etatInitial } = await serveur.ssrLoadModule('/src/lib/etat.svelte.js');
const { niveauMax } = await serveur.ssrLoadModule('/src/lib/progression.js');

let problemes = 0;
const signaler = (m, niveau, q, quoi) => { problemes++; if (problemes <= 30) console.log(`  ✗ ${m.id} niveau ${niveau} : ${quoi}`, JSON.stringify(q).slice(0, 160)); };

for (const m of matieres) {
  if (m.lecture) { console.log(`  Lecture : ${m.textes.length} histoire(s)`); continue; }
  const etat = etatInitial();
  const vues = [];
  for (let niveau = 1; niveau <= niveauMax(m); niveau++) {
    const differentes = new Set();
    let prec = null;
    for (let k = 0; k < 200; k++) {
      const q = m.generer(niveau, etat, prec);
      prec = q.cle;
      differentes.add(q.cle);
      if (!q.cle || q.reponse === undefined || q.reponse === '') signaler(m, niveau, q, 'clé ou réponse vide');
      if (q.choix) {
        if (!q.choix.map(String).includes(String(q.reponse))) signaler(m, niveau, q, 'la bonne réponse n’est pas parmi les choix');
        if (new Set(q.choix.map(String)).size !== q.choix.length) signaler(m, niveau, q, 'deux choix identiques');
        if (q.choix.length < 2 || (m.id !== 'homophones' && q.choix.length !== 4)) signaler(m, niveau, q, `${q.choix.length} choix`);
      } else if (!m.clavier) signaler(m, niveau, q, 'pas de choix et pas de clavier');
    }
    vues.push(differentes.size);
  }
  console.log(`  ${m.nom.padEnd(14)} niveaux 1 → max : ${vues.join(' / ')} questions différentes sur 200`);
}
await serveur.close();
console.log(problemes ? `\n✗ ${problemes} problème(s)` : '\n✓ Toutes les questions sont jouables.');
process.exit(problemes ? 1 : 0);
