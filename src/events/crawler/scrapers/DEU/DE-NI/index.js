import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-NI', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-NI_cases'], 10),
      deaths: parseInt(row['DE-NI_deaths'], 10),
      coordinates: [9.845, 52.636],
      population: 7.96 * 10 ** 6
    };
  }
};

export default scraper;
