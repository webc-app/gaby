// Enregistre un fichier son pour chaque texte dit à voix haute (anglais et dictée).
//   npm run voix                  → enregistre seulement ce qui manque
//   npm run voix -- --tout        → réenregistre tout (après un changement de voix)
//   npm run voix -- --essai       → quelques mots seulement, dans un dossier à part, pour écouter avant de tout faire
// Avec ElevenLabs : dans le fichier .env (jamais mis en ligne), ELEVENLABS_API_KEY, une voix par langue
// (ELEVENLABS_VOICE_ID_FR, ELEVENLABS_VOICE_ID_EN) et le modèle (ELEVENLABS_MODEL, par défaut eleven_turbo_v2_5).
// Sinon : la voix Piper (gratuite, sur le Mac) ou la voix du Mac indiquée pour chaque atelier dans src/lib/voix.js.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chargerContenu, texteErreurs } from './contenu.js';
import { VOIX, nomFichier } from '../src/lib/voix.js';

const racine = new URL('../', import.meta.url).pathname;
try { process.loadEnvFile(join(racine, '.env')); } catch { /* pas de .env : voix du Mac */ }
const CLE = process.env.ELEVENLABS_API_KEY;
// une voix par langue : une voix française lit le français, une voix anglaise native lit l'anglais (accent juste)
const VOIX_ELEVEN = { fr: process.env.ELEVENLABS_VOICE_ID_FR, en: process.env.ELEVENLABS_VOICE_ID_EN };
const MODELE = process.env.ELEVENLABS_MODEL || 'eleven_turbo_v2_5'; // respecte la langue imposée
const eleven = Boolean(CLE && VOIX_ELEVEN.fr && VOIX_ELEVEN.en);

const { contenu, erreurs } = chargerContenu();
if (erreurs.length) { console.log(`Contenu à corriger d'abord :\n${texteErreurs(erreurs)}`); process.exit(1); }

const tout = process.argv.includes('--tout');
const essai = process.argv.includes('--essai');

/** Tous les textes à dire, par atelier */
const textes = {
  anglais: [...new Set([...contenu.anglais.mots.map((m) => m.anglais), ...contenu.anglais.dialogues.flatMap((d) => [d.question, d.bonne, ...d.mauvaises])])],
  dictee: [...new Set(contenu.dictee.mots.map((m) => m.texte))],
};
if (essai) { textes.dictee = ['la grenouille', 'lune', 'éléphant', 'des chevaux']; textes.anglais = ['dog', 'How old are you?', 'I’m eight.']; }

/** Un texte → un fichier .m4a (AAC 32 kb/s : largement assez pour une voix) */
async function enregistrer(texte, langue, reglage, fichier) {
  const brut = join(tmpdir(), `gaby-voix-${process.pid}`);
  if (eleven) {
    // la langue est imposée : sinon un mot seul (« lune ») peut être lu dans la mauvaise langue
    const rep = await appelEleven(VOIX_ELEVEN[langue], { text: texte, model_id: MODELE, language_code: langue });
    if (!rep.ok) throw new Error(`ElevenLabs a refusé « ${texte} » : ${rep.status} ${(await rep.text()).slice(0, 200)}`);
    writeFileSync(`${brut}.mp3`, Buffer.from(await rep.arrayBuffer()));
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '32000', `${brut}.mp3`, fichier]);
    rmSync(`${brut}.mp3`);
  } else if (reglage.piper) {
    installerPiper(reglage.piper);
    execFileSync(PYTHON, ['-m', 'piper', '-m', join(PIPER, `${reglage.piper}.onnx`), '-f', `${brut}.wav`, '--', texte], { stdio: 'ignore' });
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '32000', `${brut}.wav`, fichier]);
    rmSync(`${brut}.wav`);
  } else {
    execFileSync('say', ['-v', reglage.voixMac, '-r', String(reglage.vitesseMac), '-o', `${brut}.aiff`, texte.replace(/’/g, "'")]);
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '32000', `${brut}.aiff`, fichier]);
    rmSync(`${brut}.aiff`);
  }
}
// Piper : installé une fois dans .voix/ (hors de git), avec le modèle de la voix (60 Mo, téléchargé au premier usage)
const PYTHON = join(racine, '.voix/bin/python');
const PIPER = join(racine, '.voix/piper');
function installerPiper(voix) {
  if (existsSync(join(PIPER, `${voix}.onnx`))) return;
  console.log(`Installation de Piper et de la voix ${voix} dans .voix/ (une seule fois)…`);
  if (!existsSync(PYTHON)) execFileSync('python3', ['-m', 'venv', join(racine, '.voix')]);
  execFileSync(PYTHON, ['-m', 'pip', '-q', 'install', 'piper-tts'], { stdio: 'inherit' });
  mkdirSync(PIPER, { recursive: true });
  execFileSync(PYTHON, ['-m', 'piper.download_voices', voix, '--data-dir', PIPER], { stdio: 'inherit' });
}
const appelEleven = (voix, corps) => fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voix}?output_format=mp3_44100_64`, {
  method: 'POST', headers: { 'xi-api-key': CLE, 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, body: JSON.stringify(corps),
});

console.log(eleven ? `Voix : ElevenLabs (${MODELE}), une voix française et une voix anglaise` : `Voix : ${Object.entries(VOIX).map(([a, r]) => `${a} = ${r.piper ? `Piper ${r.piper}` : `Mac ${r.voixMac}`}`).join(', ')}`);
const dossierEssai = join(tmpdir(), 'gaby-essai-voix');
let caracteres = 0;
for (const [atelier, liste] of Object.entries(textes)) {
  const reglage = VOIX[atelier];
  const sortie = essai ? dossierEssai : join(racine, 'public', reglage.dossier);
  mkdirSync(sortie, { recursive: true });
  let faits = 0;
  for (const texte of liste) {
    const fichier = join(sortie, `${essai ? `${atelier}-` : ''}${nomFichier(texte)}.m4a`);
    if (!tout && !essai && existsSync(fichier)) continue;
    await enregistrer(texte, reglage.langue, reglage, fichier);
    caracteres += texte.length;
    faits++;
  }
  console.log(`${atelier} : ${faits} fichier(s) enregistré(s)${essai ? '' : ` dans public/${reglage.dossier}/ (${liste.length} textes en tout)`}`);
}
if (eleven) console.log(`${caracteres} caractères utilisés chez ElevenLabs.`);
if (essai) { console.log(`Essai : ${dossierEssai}`); execFileSync('open', [dossierEssai]); }
