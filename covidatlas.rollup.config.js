import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
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
      sourcemap: true
    },
    plugins: [
      resolve(),
      json(),
      postcss({
        inject: false,
        extract: true,
        plugins: [postcssImport(), postcssNested()]
      })
    ],
    watch: {
      exclude: ['node_modules']
    }
  }
];
