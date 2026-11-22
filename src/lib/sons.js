// Sons fabriqués par le navigateur : aucun fichier à télécharger, ça marche hors ligne.

let ctx = null;
let actif = true;
try { actif = localStorage.getItem('gaby-son') !== 'off'; } catch { /* rien */ }

export const sonActif = () => actif;
export function basculerSon() {
  actif = !actif;
  try { localStorage.setItem('gaby-son', actif ? 'on' : 'off'); } catch { /* rien */ }
  return actif;
}

// toujours : pour un son indispensable à l'exercice (la dictée), joué même quand les bruitages sont coupés
function audio(toujours = false) {
  if (!actif && !toujours) return null;
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function note(freq, debut, duree, { type = 'sine', volume = 0.25, glisse = null } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + debut;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glisse) osc.frequency.exponentialRampToValueAtTime(glisse, t + duree);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + duree + 0.05);
}

function bruit(debut, duree, { volume = 0.3, de = 1200, a: vers = 200 } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + debut;
  const tampon = a.createBuffer(1, a.sampleRate * duree, a.sampleRate);
  const d = tampon.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = tampon;
  const filtre = a.createBiquadFilter();
  filtre.type = 'lowpass';
  filtre.frequency.setValueAtTime(de, t);
  filtre.frequency.exponentialRampToValueAtTime(vers, t + duree);
  const gain = a.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  src.connect(filtre).connect(gain).connect(a.destination);
  src.start(t);
}

function vibrer(motif) {
  try { navigator.vibrate?.(motif); } catch { /* rien */ }
}

export const sons = {
  clic: () => note(660, 0, 0.06, { type: 'triangle', volume: 0.12 }),
  bonne: (combo = 1) => {
    const base = 520 * Math.pow(1.06, Math.min(combo, 12)); // monte avec le combo
    note(base, 0, 0.12, { type: 'triangle' });
    note(base * 1.5, 0.09, 0.18, { type: 'triangle' });
    vibrer(30);
  },
  combo: () => {
    [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.07, 0.16, { type: 'square', volume: 0.12 }));
    vibrer([30, 40, 30]);
  },
  oups: () => {
    note(220, 0, 0.18, { type: 'sawtooth', volume: 0.12, glisse: 150 });
    vibrer(120);
  },
  piece: () => {
    note(988, 0, 0.08, { type: 'square', volume: 0.1 });
    note(1319, 0.08, 0.25, { type: 'square', volume: 0.1 });
  },
  victoire: () => {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
      note(f, i * 0.11, i === 5 ? 0.5 : 0.14, { type: 'triangle', volume: 0.2 }));
  },
  rugissement: () => {
    bruit(0, 0.9, { volume: 0.35, de: 900, a: 120 });
    note(110, 0, 0.8, { type: 'sawtooth', volume: 0.15, glisse: 60 });
    vibrer([80, 30, 200]);
  },
  eclosion: () => {
    bruit(0, 0.15, { volume: 0.3, de: 3000, a: 800 });
    bruit(0.25, 0.15, { volume: 0.3, de: 3000, a: 800 });
    [392, 523, 659, 784, 1047].forEach((f, i) => note(f, 0.5 + i * 0.1, 0.3, { type: 'triangle', volume: 0.18 }));
  },
  magie: () => {
    [784, 988, 1175, 1568, 1319].forEach((f, i) => note(f, i * 0.07, 0.35, { type: 'sine', volume: 0.13 }));
    vibrer(25);
  },
  tic: () => note(1200, 0, 0.03, { type: 'square', volume: 0.05 }),
};

// Fichiers son enregistrés à l'avance (anglais) : joués par le même moteur que les bruitages,
// déjà débloqué par le premier toucher, donc ils marchent aussi sur iPad hors d'un clic.
const tampons = new Map();
let enCours = null;

function charger(url, toujours = false) {
  const a = audio(toujours);
  if (!a) return null;
  if (!tampons.has(url)) {
    tampons.set(url, fetch(url).then((r) => r.arrayBuffer()).then((b) => a.decodeAudioData(b)).catch(() => { tampons.delete(url); return null; }));
  }
  return tampons.get(url);
}

export const prechargerFichier = (url, toujours = false) => { charger(url, toujours); };

/**
 * Joue un son enregistré. toujours : même si les bruitages sont coupés.
 * fois : 2 pour le dire deux fois, avec une pause entre les deux (la dictée).
 * Un nouveau son coupe celui en cours (et sa répétition).
 */
let numero = 0;
export async function jouerFichier(url, { toujours = false, fois = 1 } = {}) {
  const moi = ++numero;
  const tampon = await charger(url, toujours);
  const a = audio(toujours);
  if (!tampon || !a) return;
  for (let k = 0; k < fois && moi === numero; k++) {
    if (k) await new Promise((r) => setTimeout(r, 800));
    if (moi !== numero) return;
    try { enCours?.stop(); } catch { /* déjà fini */ }
    enCours = a.createBufferSource();
    enCours.buffer = tampon;
    enCours.connect(a.destination);
    const fini = new Promise((r) => (enCours.onended = r));
    enCours.start();
    await fini;
  }
}

/** Le moteur audio de l'app, pour les sons fabriqués ailleurs (la guitare) ; null si le son est coupé. */
export const contexteSon = () => audio();
