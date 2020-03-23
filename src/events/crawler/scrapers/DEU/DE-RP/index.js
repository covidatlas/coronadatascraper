import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-RP', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-RP_cases'], 10),
      deaths: parseInt(row['DE-RP_deaths'], 10),
      coordinates: [7.308, 50.118],
      population: 4.07 * 10 ** 6
    };
  }
};

export default scraper;
