import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-BY', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-BY_cases'], 10),
      deaths: parseInt(row['DE-BY_deaths'], 10),
      coordinates: [11.497, 48.79],
      population: 13 * 10 ** 6
    };
  }
};

export default scraper;
