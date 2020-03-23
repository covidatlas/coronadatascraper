import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-SH', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-SH_cases'], 10),
      deaths: parseInt(row['DE-SH_deaths'], 10),
      coordinates: [9.696, 54.219],
      population: 2.89 * 10 ** 6
    };
  }
};

export default scraper;
