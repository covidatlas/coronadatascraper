import * as parse from '../../../lib/parse.js';
import defaultScraperDEU, { sharedSchema } from '../_shared.js';

const scraper = {
  ...sharedSchema,
  country: 'iso1:DE',
  state: 'iso2:DE-MV', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parse.number(row[`${scraper.state.slice(5)}_cases`]),
      deaths: parse.number(row[`${scraper.state.slice(5)}_deaths`]),
      coordinates: [12.429, 53.612],
      population: 1.635 * 10 ** 6
    };
  }
};

export default scraper;
