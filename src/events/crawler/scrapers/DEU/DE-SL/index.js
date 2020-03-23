import * as parse from '../../../lib/parse.js';
import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'DEU',
  state: 'DE-SL', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parse.number(row[`${scraper.state}_cases`]),
      deaths: parse.number(row[`${scraper.state}_deaths`]),
      coordinates: [7.023, 49.396],
      population: 0.99 * 10 ** 6
    };
  }
};

export default scraper;
