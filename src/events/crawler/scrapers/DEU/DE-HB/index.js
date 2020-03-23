import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-HB',
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-HB_cases'], 10),
      deaths: parseInt(row['DE-HB_deaths'], 10),
      coordinates: [8.801, 53.079],
      population: 0.548 * 10 ** 6
    };
  }
};

export default scraper;
