import runScrapers from './runScraper.js';
import normalizeLocations from './normalizeLocations.js';
import dedupeLocations from './dedupeLocations.js';
import rateSources from '../rateSources/index.js';
import reportScraping from './reportScraping.js';

const scrapeData = async args =>
  runScrapers(args)
    .then(normalizeLocations)
    .then(rateSources)
    .then(dedupeLocations)
    .then(reportScraping);

export default scrapeData;
