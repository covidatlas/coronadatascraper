// Crawler operations
import fetchSources from '../events/crawler/get-sources/index.js';
import validateSources from '../events/crawler/get-sources/validate-sources.js';
import scrapeData from '../events/crawler/scrape-data/index.js';
import writeRawRegression from '../events/processor/write-data/dump-regression-raw.js';

// Metadata + geo processing operations
import rateSources from '../events/processor/rate-sources/index.js';
import dedupeLocations from '../events/processor/dedupe-locations/index.js';
import reportScrape from '../events/processor/report/index.js';
import findFeatures from '../events/processor/find-features/index.js';
import findPopulations from '../events/processor/find-populations/index.js';
import transformIds from '../events/processor/transform-ids/index.js';
import cleanLocations from '../events/processor/clean-locations/index.js';
import writeData from '../events/processor/write-data/index.js';
import datetime from './lib/datetime/index.js';

function emptyReport(date) {
  return {
    date: date || datetime.getYYYYMD(),
    sources: {},
    scrape: {},
    findFeatures: {},
    findPopulation: {},
    transformIds: {},
    validate: {}
  };
}

/** Run the crawl and scrape. */
async function runScrape(date, report, options) {
  const sources = await fetchSources(options);
  if (sources.length === 0) {
    console.log('No sources, quitting.');
    process.exit(0);
  }

  await validateSources(sources, report.sources);

  const locations = await scrapeData(sources, report.scrape);

  await writeRawRegression(locations, options);

  return { sources, locations };
}

/** Generate the reports. */
async function generateReports(date, sources, locations, report, options) {
  const ratings = await rateSources(sources, locations);

  await dedupeLocations(locations, report.scrape);

  await reportScrape(locations, report.scrape);

  const features = await findFeatures(locations, report.findFeatures);

  await findPopulations(locations, features, report.findPopulation);

  await transformIds(locations, ratings, report.scrape, report.transformIds);

  await cleanLocations(locations, report.validate);

  return writeData(locations, features, ratings, report, options);
}

/**
 * Entry file while we're still hosted on GitHub
 */
export default async function generate(date, options = {}) {
  options = { findFeatures: true, findPopulations: true, writeData: true, ...options };

  // Summary of results of each step of generation.
  const report = emptyReport(date);

  const { sources, locations } = await runScrape(date, report, options);

  // processor
  return generateReports(date, sources, locations, report, options);
}
