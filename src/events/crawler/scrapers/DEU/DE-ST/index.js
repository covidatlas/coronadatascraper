import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-ST', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-ST_cases'], 10),
      deaths: parseInt(row['DE-ST_deaths'], 10),
      coordinates: [11.692, 51.95],
      population: 2.28 * 10 ** 6
    };
  }
};

export default scraper;
