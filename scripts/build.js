const process = require('node:process')
const esbuild = require('esbuild')

/** @type { esbuild.BuildOptions } */
const baseOptions = { entryPoints: ['src/main.ts'], bundle: true }

const exit = () => {
  process.exit(1)
}

esbuild
  .build({ ...baseOptions, outfile: 'dist/main.cjs.js', format: 'cjs' })
  .catch(exit)

esbuild
  .build({ ...baseOptions, outfile: 'dist/main.esm.js', format: 'esm' })
  .catch(exit)
