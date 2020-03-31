const imports = require('esm')(module);
const arc = require('@architect/functions');

const rateSources = imports('./rate-sources/index.js').default;
const dedupeLocations = imports('./dedupe-locations/index.js').default;
const reportScrape = imports('./report/index.js').default;
const findFeatures = imports('./find-features/index.js').default;
const findPopulations = imports('./find-populations/index.js').default;
const cleanLocations = imports('./clean-locations/index.js').default;
const writeData = imports('./write-data/index.js').default;

/**
 * AWS entry - WIP!
 */
async function crawler(event) {
  const { options } = event;
  process.env.LOG_LEVEL = 'off';
  const output = await rateSources(event)
    .then(dedupeLocations)
    .then(reportScrape)
    .then(options.findFeatures !== false && findFeatures)
    .then(options.findPopulations !== false && findPopulations)
    .then(cleanLocations)
    .then(options.writeData !== false && writeData); // To be retired

  return output;
}

exports.handler = arc.events.subscribe(crawler);
