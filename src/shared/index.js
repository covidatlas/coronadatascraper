// Crawler operations
import fetchSources from '../events/crawler/get-sources/index.js';
import validateSources from '../events/crawler/get-sources/validate-sources.js';
import scrapeData from '../events/crawler/scrape-data/index.js';
import { loadRaw, writeRaw } from '../events/processor/write-data/write-raw.js';

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

async function getSources(options) {
  const sources = await fetchSources(options);
  if (sources.length === 0) {
    console.log('No sources, quitting.');
    process.exit(0);
  }
  return sources;
}

/** Run the crawl and scrape. */
async function runScrape(sources, date, report, options) {
  await validateSources(sources, report.sources);

  const locations = await scrapeData(sources, report.scrape);

  await writeRaw(sources, locations, report, options);

  return locations;
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

function getFullOptions(options) {
  return { findFeatures: true, findPopulations: true, writeData: true, ...options };
}

/**
 * Entry file while we're still hosted on GitHub
 */
export default async function generate(date, options = {}) {
  options = getFullOptions(options);

  // Summary of results of each step of generation.
  const report = emptyReport(date);

  const sources = await getSources(options);
  const locations = await runScrape(sources, date, report, options);
  return generateReports(date, sources, locations, report, options);
}

/** Run only the crawl and scrape, saving raw files. */
export async function scrapeToRawFiles(date, options = {}) {
  options = getFullOptions(options);
  options.dumpRaw = true;

  const report = emptyReport(date);
  const sources = await getSources(options);
  await runScrape(sources, date, report, options);
}

/** Generate reports, using previously saved raw files only. */
export async function generateReportsFromRawFiles(date, options = {}) {
  options = getFullOptions(options);

  console.log('Restoring locations and report from prior saved raw files.');
  const { sources, locations, report } = await loadRaw(options);
  return generateReports(date, sources, locations, report, options);
}
