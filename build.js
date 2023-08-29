import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['index.js'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/airdb.cjs',
  define: {
    'ESB_PLATFORM': '"node"',
  }
});

await esbuild.build({
  entryPoints: ['index.js'],
  bundle: true,
  platform: 'browser',
  globalName: 'AirDB',
  outfile: 'dist/airdb.browser.js',
  define: {
    'ESB_PLATFORM': '"browser"',
  }
});

await esbuild.build({
  entryPoints: ['index.js'],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  outfile: 'dist/airdb.browser.mjs',
  define: {
    'ESB_PLATFORM': '"browser"',
  }
});
