import runScrapers from './runScraper.js';
import normalizeLocations from './normalizeLocations.js';
import dedupeLocations from './dedupeLocations.js';
import reportScraping from './reportScraping.js';

const scrapeData = async args =>
  runScrapers(args)
    .then(normalizeLocations)
    .then(dedupeLocations)
    .then(reportScraping);

export default scrapeData;
