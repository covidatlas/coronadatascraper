import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-MV', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-MV_cases'], 10),
      deaths: parseInt(row['DE-MV_deaths'], 10),
      coordinates: [12.429, 53.612],
      population: 1.635 * 10 ** 6
    };
  }
};

export default scraper;
