import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-TH', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-TH_cases'], 10),
      deaths: parseInt(row['DE-TH_deaths'], 10),
      coordinates: [10.845, 51.011],
      population: 2.14 * 10 ** 6
    };
  }
};

export default scraper;
