// Crawler operations
import fetchSources from '../events/crawler/get-sources/index.js';
import scrapeData from '../events/crawler/scrape-data/index.js';

// Metadata + geo processing operations
import rateSources from '../events/processor/rate-sources/index.js';
import dedupeLocations from '../events/processor/dedupe-locations/index.js';
import reportScrape from '../events/processor/report/index.js';
import findFeatures from '../events/processor/find-features/index.js';
import findPopulations from '../events/processor/find-populations/index.js';
import cleanLocations from '../events/processor/clean-locations/index.js';
import writeData from '../events/processor/write-data/index.js';
import * as datetime from './lib/datetime.js';

/**
 * Entry file while we're still hosted on GitHub
 */
async function generate(date, options = {}) {
  options = { findFeatures: true, findPopulations: true, writeData: true, ...options };

  if (date) {
    process.env.SCRAPE_DATE = date;
  } else {
    delete process.env.SCRAPE_DATE;
  }

  if (options.quiet) {
    process.env.LOG_LEVEL = 'off';
  }

  // JSON used for reporting
  const report = {
    date: date || datetime.getYYYYMD()
  };

  // Crawler
  const output = await fetchSources({ date, report, options })
    .then(scrapeData)
    // processor
    .then(rateSources)
    .then(dedupeLocations)
    .then(reportScrape)
    .then(options.findFeatures !== false && findFeatures)
    .then(options.findPopulations !== false && findPopulations)
    .then(cleanLocations)
    .then(options.writeData !== false && writeData); // To be retired

  return output;
}

export default generate;
