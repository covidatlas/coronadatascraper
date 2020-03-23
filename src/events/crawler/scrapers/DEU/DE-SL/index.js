import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-SL', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-SL_cases'], 10),
      deaths: parseInt(row['DE-SL_deaths'], 10),
      coordinates: [7.023, 49.396],
      population: 0.99 * 10 ** 6
    };
  }
};

export default scraper;
