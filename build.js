import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

await esbuild.build({
  entryPoints: ['index.js'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/airdb.cjs',
});

const source = readFileSync('./lib/platform/index.js', {encoding: 'utf-8'});
const dest = readFileSync('./lib/platform/index.browser.js', {encoding: 'utf-8'});

writeFileSync('./lib/platform/index.js', dest, {encoding: 'utf-8'});

await esbuild.build({
  entryPoints: ['index.js'],
  bundle: true,
  platform: 'browser',
  globalName: 'AirDB',
  outfile: 'dist/airdb.browser.js',
});

await esbuild.build({
  entryPoints: ['index.js'],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  outfile: 'dist/airdb.browser.mjs',
});

writeFileSync('./lib/platform/index.js', source, {encoding: 'utf-8'});