import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { chargerContenu, texteErreurs, DOSSIER_CONTENU, DOSSIER_IMAGES, DOSSIER_DRAPEAUX } from './scripts/contenu.js';

// Le contenu (dossier contenu/) devient le module « virtual:contenu ». S'il contient une erreur,
// le build s'arrête avec la liste des corrections à faire ; en développement, elle s'affiche dans la page.
function contenu() {
  const ID = 'virtual:contenu';
  return {
    name: 'gaby-contenu',
    resolveId: (id) => (id === ID ? `\0${ID}` : null),
    load(id) {
      if (id !== `\0${ID}`) return null;
      const { contenu: donnees, erreurs, imagesUtilisees, drapeauxUtilises } = chargerContenu();
      if (erreurs.length) this.error(`Contenu à corriger :\n${texteErreurs(erreurs)}`);
      // Les images utilisées sont importées : Vite les copie dans l'app avec un nom qui change à chaque version.
      // Dans le contenu, on les retrouve par leur nom : C.images['lion.jpg'] donne l'adresse du fichier.
      const imports = imagesUtilisees.map((nom, i) => `import image${i} from ${JSON.stringify(join(DOSSIER_IMAGES, nom))};`);
      const table = imagesUtilisees.map((nom, i) => `${JSON.stringify(nom)}: image${i}`).join(', ');
      // De même pour les drapeaux utilisés (src/drapeaux/) : C.svgDrapeaux.fr donne l'adresse de fr.svg
      imports.push(...drapeauxUtilises.map((code, i) => `import drapeau${i} from ${JSON.stringify(join(DOSSIER_DRAPEAUX, `${code}.svg`) + '?url')};`));
      const tableDrapeaux = drapeauxUtilises.map((code, i) => `${JSON.stringify(code)}: drapeau${i}`).join(', ');
      return `${imports.join('\n')}\nexport default { ...${JSON.stringify(donnees)}, images: { ${table} }, svgDrapeaux: { ${tableDrapeaux} } };`;
    },
    configureServer(serveur) {
      serveur.watcher.add(DOSSIER_CONTENU);
      serveur.watcher.on('change', (f) => {
        if (!f.startsWith(DOSSIER_CONTENU)) return;
        const m = serveur.moduleGraph.getModuleById(`\0${ID}`);
        if (m) serveur.moduleGraph.invalidateModule(m);
        serveur.ws.send({ type: 'full-reload' });
      });
    },
  };
}

// Une empreinte de tous les sons enregistrés (public/anglais, public/dictee) : ajoutée à leur adresse (?v=…),
// elle change dès qu'un son est réenregistré, pour qu'aucun appareil ne rejoue une ancienne voix gardée en mémoire.
function versionSons() {
  const h = createHash('sha1');
  for (const dossier of ['anglais', 'dictee']) {
    const chemin = new URL(`./public/${dossier}/`, import.meta.url).pathname;
    let noms = [];
    try { noms = readdirSync(chemin).sort(); } catch { /* pas encore de sons */ }
    for (const nom of noms) h.update(nom).update(readFileSync(join(chemin, nom)));
  }
  return h.digest('hex').slice(0, 10);
}

// L'adresse de contact des mentions légales (CONTACT dans .env) n'est jamais écrite en clair dans le site :
// elle y est codée, et la page ne la reconstitue que si l'on touche « Afficher l'adresse » (contre les robots à spam).
const coder = (texte) => (texte ? Buffer.from([...texte].reverse().join('')).toString('base64') : '');

export default defineConfig(({ mode }) => ({
  plugins: [contenu(), svelte()],
  define: {
    __VERSION_SONS__: JSON.stringify(versionSons()),
    __CONTACT__: JSON.stringify(coder(loadEnv(mode, process.cwd(), '').CONTACT)),
  },
  base: './',
  server: { host: true },
}));
