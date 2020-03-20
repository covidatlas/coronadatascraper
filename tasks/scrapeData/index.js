import runScrapers from './runScraper.js';
import normalizeLocations from './normalizeLocations.js';
import cleanLocations from './cleanLocations.js';
import dedupLocations from './dedupData.js';
import rateLocations from './rateLocations.js';

const scrapeData = async args =>
  runScrapers(args)
    .then(normalizeLocations)
    .then(dedupLocations)
    .then(rateLocations)
    .then(cleanLocations);

export default scrapeData;
