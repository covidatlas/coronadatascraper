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

  // JSON used for reporting
  const report = {
    date: date || datetime.getYYYYMD()
  };

  const { sources, validationErrors } = await fetchSources(options);
  if (sources.length === 0) {
    console.log('No sources, quitting.');
    return;
  }

  // Break apart all parts to make connections explicit.

  let output = { sources };
  const dumpkeys = title => {
    console.log(`${title} keys = ${Object.keys(output)}`);
  };

  // Crawler
  let { locations, scraperErrors } = await scrapeData(sources);
  dumpkeys('after scrape');
  await writeRawRegression(locations, options);

  // processor
  output.locations = locations;
  const ratings = await rateSources(sources, locations);

  const { deDuped, crosscheckReports } = await dedupeLocations(locations);

  output.report = report;
  output.report.sources = {
    numSources: sources.length,
    errors: validationErrors
  };
  output.sources = sources;
  output.scraperErrors = scraperErrors;
  output.crosscheckReports = crosscheckReports;
  output = await reportScrape(output);

  const featureResult = await findFeatures(locations);
  locations = featureResult.locations;
  output.report.findFeatures = featureResult.reportResult;

  const populationResult = await findPopulations(locations, featureResult.featureCollection);
  output.report.findPopulation = populationResult.result;

  output.sourceRatings = ratings;
  output = await transformIds(output);
  output = await cleanLocations(output);
  output.options = options;
  output = await writeData(output); // To be retired

  return output;
}

export default generate;
