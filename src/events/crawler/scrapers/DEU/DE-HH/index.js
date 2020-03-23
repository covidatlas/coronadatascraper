import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-HH', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-HH_cases'], 10),
      deaths: parseInt(row['DE-HH_deaths'], 10),
      coordinates: [9.993, 53.551],
      population: 1.822 * 10 ** 6
    };
  }
};

export default scraper;
