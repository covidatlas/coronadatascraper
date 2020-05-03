import runScrapers from './run-scraper.js';
import normalizeLocations from './normalize-locations.js';

export default async function scrapeData(sources) {
  let { locations, scraperErrors } = await runScrapers(sources);
  locations = await normalizeLocations(locations);
  return { locations, scraperErrors }
}
