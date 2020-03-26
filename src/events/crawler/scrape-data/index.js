import runScrapers from './run-scraper.js';
import normalizeLocations from './normalize-locations.js';
import dedupeLocations from './dedupe-locations.js';
import reportScraping from './report-scraping.js';

const scrapeData = async args =>
  runScrapers(args)
    .then(normalizeLocations)
    .then(dedupeLocations)
    .then(reportScraping);

export default scrapeData;
