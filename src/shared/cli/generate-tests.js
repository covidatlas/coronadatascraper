const imports = require('esm')(module);

const generateResponses = imports('./generate-responses.js').default;
const loadSources = imports('../../events/crawler/get-sources/load-sources.js').default;
const runScraper = imports('../lib/run-scraper.js').default;
const fs = imports('../lib/fs.js');
const join = imports('../lib/join.js').default;
const { getName } = imports('../lib/geography/index.js');
const path = imports('path');
const argv = imports('./cli-args.js').default;

const runScrapers = async args => {
  const { options } = args;
  const { date, location } = options;
  const sources = args.sources.filter(s => s.scraper);
  const matchLocation = source => path.basename(source._path, '.js') === location || getName(source) === location;
  const sourcesToScrape = location !== undefined ? sources.filter(matchLocation) : sources;
  for (const source of sourcesToScrape) {
    const data = await runScraper(source);
    if (data) {
      console.log(`✅ Ran scraper ${getName(source)} for date ${date}`);
      const expectedDataPath = join(source._path, '..', 'tests', date, 'expected.json');
      await fs.writeJSON(expectedDataPath, data);
    }
  }
};

const generateExpected = async options => {
  const { date, location } = options;
  if (date === undefined) throw new Error('Please provide a date for generating tests.');
  if (location === undefined) throw new Error('Please provide a location for generating tests.');
  process.env.SCRAPE_DATE = date;
  await loadSources({ options }).then(runScrapers);
};

generateResponses(argv).then(generateExpected);
