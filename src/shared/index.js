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

  const srcs = await fetchSources({ date, report, options });
  if (srcs.sources.length === 0) {
    console.log('No sources, quitting.');
    return;
  }

  // Crawler
  const output = await scrapeData(srcs)
    .then(writeRawRegression)
    // processor
    .then(rateSources)
    .then(dedupeLocations)
    .then(reportScrape)
    .then(options.findFeatures !== false && findFeatures)
    .then(options.findPopulations !== false && findPopulations)
    .then(transformIds)
    .then(cleanLocations)
    .then(options.writeData !== false && writeData); // To be retired

  return output;
}

export default generate;
