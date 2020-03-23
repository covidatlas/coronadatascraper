import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-BW', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-BW_cases'], 10),
      deaths: parseInt(row['DE-BW_deaths'], 10),
      coordinates: [9.35, 48.661],
      population: 11.02 * 10 ** 6
    };
  }
};

export default scraper;
