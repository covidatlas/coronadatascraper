import json from '@rollup/plugin-json';
import serve from 'rollup-plugin-serve';
import copy from 'rollup-plugin-copy';
import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import postcssNested from 'postcss-nested';
import postcssImport from 'postcss-import';

export default {
  input: 'site/index.js',
  output: {
    file: 'dist/index.js',
    format: 'iife',
    sourcemap: true
  },
  plugins: [
    resolve(),
    json(),
    serve('dist'),
    copy({
      targets: [{ src: ['site/*', '!index.js', '!style.css', '!icons/style.css'], dest: 'dist/' }]
    }),
    postcss({
      plugins: [postcssImport(), postcssNested()]
    })
  ]
};
