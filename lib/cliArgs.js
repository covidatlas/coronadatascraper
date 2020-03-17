import yargs from 'yargs';

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

export default argv;