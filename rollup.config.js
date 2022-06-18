import pkg from './package.json'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

import tsConfig from './tsconfig.json'

export default {
  input: 'src/index.ts',
  output: {
    file: 'build/dcs-server.js',
    format: 'cjs',
    sourcemap: 'inline',
  },
  external: Object.keys(pkg.dependencies),
  plugins: [
    commonjs(),
    nodeResolve({ preferBuiltins: true }),
    json(),
    typescript({
      compilerOptions: {
        ...tsConfig.compilerOptions,
        module: 'esnext',
      },
    }),
  ],
  onwarn(warning, warn) {
    // suppress known okay warnings
    if (warning.code === 'EVAL') return
    if (warning.code === 'CIRCULAR_DEPENDENCY') return

    warn(warning)
  },
}
