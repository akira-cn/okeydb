import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['index.js'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/airdb-lite.cjs',
});