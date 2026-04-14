import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from "@rollup/plugin-typescript";
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

// moment and moment-timezone are marked external so consumers supply
// them. The Temporal global is expected from the host or a
// consumer-installed polyfill.
const external = ['moment', 'moment-timezone'];

// Shared plugin set. Typescript plugin is instantiated per-build so the
// two entries don't share compiler state (the ESM entry uses a newer
// target to allow top-level await).
const makePlugins = (tsOverrides = {}) => [
  typescript(tsOverrides),
  nodeResolve(),
  commonjs(),
  terser(),
];

export default [
  // ESM build — lazy moment loading via top-level await + dynamic import.
  // Consumer bundlers (Vite, Rollup, Webpack 5+) split moment into its
  // own chunk and only fetch it on the fallback path. Temporal-capable
  // hosts never network-load moment at all.
  {
    input: 'src/moment-temporal.esm.ts',
    external,
    output: {
      file: pkg.module,
      format: 'es',
      exports: 'default',
      name: 'MomentTemporal',
    },
    plugins: makePlugins({
      // ES2022 is the first target that natively supports top-level
      // await. The main tsconfig stays at ES2020 for the CJS/UMD path.
      target: 'es2022',
      module: 'esnext',
    }),
  },

  // CJS + UMD builds — eager moment load, no top-level await. This is
  // what Node CJS consumers and legacy <script> tags resolve to.
  {
    input: 'src/moment-temporal.ts',
    external,
    output: [
      {
        file: pkg.main,
        format: 'umd',
        exports: 'default',
        name: 'MomentTemporal',
        globals: {
          moment: 'moment',
          'moment-timezone': 'moment',
        },
      },
      {
        file: pkg.common,
        format: 'cjs',
        exports: 'default',
        name: 'MomentTemporal',
      },
    ],
    plugins: makePlugins(),
  },
];
