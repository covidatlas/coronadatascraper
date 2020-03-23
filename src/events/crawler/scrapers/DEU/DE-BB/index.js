import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-BB', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-BB_cases'], 10),
      deaths: parseInt(row['DE-BB_deaths'], 10),
      coordinates: [52.52, 13.405],
      population: 3.74 * 10 ** 6
    };
  }
};

export default scraper;
