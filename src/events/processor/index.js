const imports = require('esm')(module);
const arc = require('@architect/functions');

const findFeatures = imports('./find-features/index.js').default;
const findPopulations = imports('./find-populations/index.js').default;
const cleanLocations = imports('./clean-locations/index.js').default;
const writeData = imports('./write-data/index.js').default;

/**
 * AWS entry - WIP!
 */
async function crawler(event) {
  const { options } = event;

  const output = await Promise.resolve()
    .then(options.findFeatures !== false && findFeatures)
    .then(options.findPopulations !== false && findPopulations)
    .then(cleanLocations)
    .then(options.writeData !== false && writeData); // To be retired

  return output;
}

exports.handler = arc.events.subscribe(crawler);
