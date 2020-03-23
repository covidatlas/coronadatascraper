import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-NW', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-NW_cases'], 10),
      deaths: parseInt(row['DE-NW_deaths'], 10),
      coordinates: [7.661, 51.433],
      population: 17.91 * 10 ** 6
    };
  }
};

export default scraper;
