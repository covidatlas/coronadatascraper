import runScrapers from './run-scrapers.js';
import normalizeLocations from './normalize-locations.js';

const scrapeData = async args => runScrapers(args).then(normalizeLocations);

export default scrapeData;
