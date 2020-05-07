import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import postcssNested from 'postcss-nested';
import postcssImport from 'postcss-import';

export default [
  {
    input: 'covidatlas/index.js',
    moduleContext: {
      [require.resolve('focus-visible')]: 'window'
    },
    output: {
      dir: 'public/',
      chunkFileNames: '[name].js',
      sourcemap: true
    },
    plugins: [
      resolve(),
      json(),
      postcss({
        inject: false,
        extract: true,
        plugins: [postcssImport(), postcssNested()]
      }),
      replace({
        values: {
          'process.env.NODE_ENV': '"production"'
        }
      })
    ],
    watch: {
      exclude: ['node_modules']
    }
  },
  {
    input: 'covidatlas/map.js',
    output: {
      dir: 'public/',
      sourcemap: true
    },
    plugins: [resolve(), json()],
    watch: {
      exclude: ['node_modules']
    }
  },
  {
    input: 'covidatlas/location.js',
    output: {
      dir: 'public/',
      sourcemap: true
    },
    plugins: [resolve(), json()],
    watch: {
      exclude: ['node_modules']
    }
  },
  {
    input: 'covidatlas/embed-graph.js',
    output: {
      dir: 'public/',
      sourcemap: true
    },
    plugins: [resolve(), json()],
    watch: {
      exclude: ['node_modules']
    }
  }
];
