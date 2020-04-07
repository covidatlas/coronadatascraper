import json from '@rollup/plugin-json';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import copy from 'rollup-plugin-copy-glob';
import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import postcssNested from 'postcss-nested';
import postcssImport from 'postcss-import';

const prod = !process.env.ROLLUP_WATCH;

export default [
  {
    input: 'site/index.js',
    output: {
      file: 'dist/index.js',
      format: 'iife',
      sourcemap: true
    },
    plugins: [
      resolve(),
      json(),
      !prod &&
        serve({
          contentBase: 'dist',
          port: 3000
        }),
      !prod && livereload({ watch: 'site' }),
      copy([{ files: 'site/**/!(*.js|*.css|.DS_Store)', dest: 'dist' }], { verbose: true, watch: !prod }),
      postcss({
        inject: false,
        extract: true,
        plugins: [postcssImport(), postcssNested()]
      })
    ],
    watch: {
      exclude: ['node_modules'] // jic
    }
  }
];
