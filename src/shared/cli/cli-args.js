import yargs from 'yargs';

const { argv } = yargs
  .option('date', {
    alias: 'd',
    description: 'Generate data for or start the timeseries at the provided date in YYYY-M-D format',
    type: 'string'
  })
  .option('endDate', {
    alias: 'e',
    description: 'The date after which to stop generating timeseries data',
    type: 'string'
  })
  .option('location', {
    alias: 'l',
    description: 'Scrape only the location provided by src/shared/scraper path name',
    type: 'string'
  })
  .option('skip', {
    alias: 's',
    description: 'Skip the location provided by src/shared/scraper path name',
    type: 'string'
  })
  .option('outputSuffix', {
    alias: 'o',
    description: 'The suffix to add to output files, i.e. passing TEST will produce data-TEST.json etc',
    type: 'string'
  })
  .option('quiet', {
    alias: 'q',
    description: 'Suppress logs',
    type: 'boolean'
  })
  .option('findFeatures', {
    description: 'Include feature information in output data',
    type: 'boolean'
  })
  .options('findPopulations', {
    description: 'Include population information in output data',
    type: 'boolean'
  })
  .options('writeData', {
    description: 'Write to dist folder',
    type: 'boolean'
  })
  .options('writeTo', {
    description: 'Folder to write to',
    default: 'dist',
    type: 'string'
  })
  .option('onlyUseCache', {
    alias: 'x',
    description: 'Only use cache (no http calls)',
    type: 'boolean'
  })
  .help()
  .alias('help', 'h');

if (argv.date) {
  process.env.SCRAPE_DATE = argv.date;
} else {
  delete process.env.SCRAPE_DATE;
}

if (argv.quiet) {
  process.env.LOG_LEVEL = 'off';
}

if (argv.onlyUseCache) {
  process.env.ONLY_USE_CACHE = true;
} else {
  delete process.env.ONLY_USE_CACHE;
}

export default argv;
