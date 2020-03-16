import path from 'path';
import yargs from 'yargs';
import generate from './index.js';
import * as fs from './lib/fs.js';
import * as stringify from './lib/stringify.js';

async function writeData({ locations }) {
  let date = process.env['SCRAPE_DATE'] ?  '-' + process.env['SCRAPE_DATE'] : '';

  await fs.ensureDir('dist')

  await fs.writeFile(path.join('dist', `data${date}.json`), JSON.stringify(locations, null, 2));

  await fs.writeCSV(path.join('dist', `data${date}.csv`), stringify.csvForDay(locations));

  return { locations };
}

const argv = yargs
  .option('date', {
    alias: 'd',
    description: 'Generate data for the provided date in YYYY-M-D format',
    type: 'string',
  })
  .option('only', {
    alias: 'o',
    description: 'Scrape only the location provided by full name, i.e City, County, State, Country',
    type: 'string',
  })
  .option('skip', {
    alias: 's',
    description: 'Skip the location provided by full name, i.e City, County, State, Country',
    type: 'string',
  })
  .help()
  .alias('help', 'h')
  .argv;

let rules = {
  only: argv.only,
  skip: argv.skip
};

generate(argv.date, rules)
  .then(writeData);
