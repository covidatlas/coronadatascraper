// Crawler operations
import fetchSources from '../events/crawler/fetch-sources/index.js';
import scrapeData from '../events/crawler/scrape-data/index.js';

// Metadata + geo processing operations
import rateSources from '../events/processor/rate-sources/index.js';
import findFeatures from '../events/processor/find-features/index.js';
import findPopulations from '../events/processor/find-populations/index.js';
import cleanLocations from '../events/processor/clean-locations/index.js';
import writeData from '../events/processor/write-data/index.js';

async function generate(date, options = {}) {
  options = { findFeatures: true, findPopulations: true, writeData: true, ...options };

  if (date) {
    process.env.SCRAPE_DATE = date;
  } else {
    delete process.env.SCRAPE_DATE;
  }

  // JSON used for reporting
  const report = {
    date
  };

  const output = await fetchSources({ date, report, options })
    .then(scrapeData)
    .then(rateSources)
    //
    .then(options.findFeatures !== false && findFeatures)
    .then(options.findPopulations !== false && findPopulations)
    .then(cleanLocations)
    .then(options.writeData !== false && writeData); // To be retired

  return output;
}

export default generate;
