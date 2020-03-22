import runScrapers from './runScraper.js';
import normalizeLocations from './normalizeLocations.js';
import cleanLocations from './cleanLocations.js';
import dedupeLocations from './dedupeLocations.js';
import rateLocations from './rateLocations.js';
import reportScraping from './reportScraping.js';

const scrapeData = async args =>
  runScrapers(args)
    .then(normalizeLocations)
    .then(rateLocations)
    .then(dedupeLocations)
    .then(cleanLocations)
    .then(reportScraping);

export default scrapeData;
