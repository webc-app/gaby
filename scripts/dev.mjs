// Lance l'API PHP (port 8099) et le serveur Vite ensemble.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

mkdirSync('.data', { recursive: true });
const php = spawn('php', ['-S', '127.0.0.1:8099', '-t', 'public'], {
  stdio: 'ignore',
  env: { ...process.env, GABY_DATA: `${process.cwd()}/.data`, GABY_DEV: '1' },
});
const vite = spawn('npx', ['vite'], { stdio: 'inherit' });
const stop = () => { php.kill(); vite.kill(); process.exit(); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
vite.on('exit', stop);
