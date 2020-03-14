import yargs from 'yargs';
import generate from './index.js';

const argv = yargs
  .option('date', {
    alias: 'd',
    description: 'Generate data for the provided date in YYYY-M-D format',
    type: 'string',
  })
  .help()
  .alias('help', 'h')
  .argv;

generate(argv.date);
