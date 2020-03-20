import json from '@rollup/plugin-json';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import copy from 'rollup-plugin-copy-glob';
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
    livereload(),
    copy([{ files: ['site/**', '!site/*.js', '!site/*.css', '!site/icons/style.css', '!site/lib/*'], dest: 'dist' }], { verbose: true, watch: true }),
    postcss({
      plugins: [postcssImport(), postcssNested()]
    })
  ]
};
