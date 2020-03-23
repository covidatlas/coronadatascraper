import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-BE', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-BE_cases'], 10),
      deaths: parseInt(row['DE-BE_deaths'], 10),
      coordinates: [13.405, 52.52],
      population: 3.74 * 10 ** 6
    };
  }
};

export default scraper;
