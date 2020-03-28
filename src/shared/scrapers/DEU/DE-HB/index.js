import * as parse from '../../../lib/parse.js';
import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-HB',
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parse.number(row[`${scraper.state}_cases`]),
      deaths: parse.number(row[`${scraper.state}_deaths`]),
      coordinates: [8.801, 53.079],
      population: 0.548 * 10 ** 6
    };
  }
};

export default scraper;
