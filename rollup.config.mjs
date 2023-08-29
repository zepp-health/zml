import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'

const plugins = []

if (process.env.NODE_ENV === 'production') {
  plugins.push(
    terser({
      compress: {
        passes: 3,
        toplevel: true,
        drop_console: true,
        pure_funcs: ["Connector.getStatus", "Connector.getAction"],
        global_defs: {
          __PROD__: true,
        },
      },
    }),
  )
}

export default [
  {
    input: 'src/core/device/base-app.js',
    output: {
      file: 'dist/zml-app.js',
      format: 'es',
      plugins,
    },
    plugins: [
      replace({
        preventAssignment: true,
        __DEBUG__: process.env.NODE_ENV === 'production' ? undefined : true,
      }),
      nodeResolve(),
      commonjs(),
    ],
  },
  {
    input: 'src/core/device/base-page.js',
    output: {
      file: 'dist/zml-page.js',
      format: 'es',
      plugins,
    },
    plugins: [
      replace({
        preventAssignment: true,
        __DEBUG__: process.env.NODE_ENV === 'production' ? undefined : true,
      }),
      nodeResolve(),
      commonjs(),
    ],
  },
  {
    input: 'src/core/side/index.js',
    output: {
      file: 'dist/zml-side.js',
      format: 'es',
      plugins,
    },
    plugins: [
      replace({
        preventAssignment: true,
        __DEBUG__: process.env.NODE_ENV === 'production' ? undefined : true,
      }),
      nodeResolve(),
      commonjs(),
    ],
  },
]
