import runScrapers from './run-scraper.js';
import normalizeLocations from './normalize-locations.js';

export default async function scrapeData(sources, report) {
  const { locations, scraperErrors } = await runScrapers(sources);
  const normalizedLocations = await normalizeLocations(locations);

  report.numErrors = scraperErrors.length;
  report.errors = scraperErrors;
  return normalizedLocations;
}
