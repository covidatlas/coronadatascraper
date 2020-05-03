import runScrapers from './run-scraper.js';
import normalizeLocations from './normalize-locations.js';

export default async function scrapeData(sources, report) {
  let { locations, scraperErrors } = await runScrapers(sources);
  locations = await normalizeLocations(locations);

  report.numErrors = scraperErrors.length;
  report.errors = scraperErrors;
  return locations;
}
