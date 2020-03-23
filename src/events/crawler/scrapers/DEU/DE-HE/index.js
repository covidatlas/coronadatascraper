import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-HE', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-HE_cases'], 10),
      deaths: parseInt(row['DE-HE_deaths'], 10),
      coordinates: [9.162, 50.652],
      population: 6.24 * 10 ** 6
    };
  }
};

export default scraper;
