// Crawler operations
import fetchSources from '../events/crawler/get-sources/index.js';
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

/**
 * Entry file while we're still hosted on GitHub
 */
async function generate(date, options = {}) {
  options = { findFeatures: true, findPopulations: true, writeData: true, ...options };

  // Summary of results of each step of generation.
  let summaryReport = {
    date: date || datetime.getYYYYMD()
  };

  const { sources, validationErrors } = await fetchSources(options);
  if (sources.length === 0) {
    console.log('No sources, quitting.');
    return;
  }

  summaryReport.sources = {
    numSources: sources.length,
    errors: validationErrors
  };

  // Crawler
  let { locations, scraperErrors } = await scrapeData(sources);

  await writeRawRegression(locations, options);

  // processor

  const ratings = await rateSources(sources, locations);

  const { deDuped, crosscheckReports } = await dedupeLocations(locations);

  await reportScrape(locations, scraperErrors, deDuped, crosscheckReports, summaryReport);

  const featureResult = await findFeatures(locations);
  summaryReport.findFeatures = featureResult.reportResult;

  summaryReport.findPopulation = await findPopulations(locations, featureResult.featureCollection);

  await transformIds(locations, summaryReport, ratings);

  await cleanLocations(locations, summaryReport);

  const output = await writeData(locations, featureResult.featureCollection, ratings, summaryReport, options); // To be retired

  return output;
}

export default generate;
