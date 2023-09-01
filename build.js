import * as esbuild from 'esbuild';


if(process.env.mode === 'production') {
  await esbuild.build({
    entryPoints: ['index.js'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: 'dist/okeydb.cjs',
    define: {
      'ESB_PLATFORM': '"node"',
    }
  });
  
  await esbuild.build({
    entryPoints: ['index.js'],
    bundle: true,
    platform: 'browser',
    globalName: 'OkeyDB',
    outfile: 'dist/okeydb.browser.js',
    define: {
      'ESB_PLATFORM': '"browser"',
    }
  });
  
  await esbuild.build({
    entryPoints: ['index.js'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: 'dist/okeydb.browser.mjs',
    define: {
      'ESB_PLATFORM': '"browser"',
    }
  });  
} else {
  const ctx = await esbuild.context({
    entryPoints: ['index.js'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: 'test/dist/okeydb.browser.mjs',
    define: {
      'ESB_PLATFORM': '"browser"',
    }
  });
  const server = await ctx.serve({
    servedir: './test',
  });
  console.log(`Server is running at ${server.host}:${server.port}`);
}

