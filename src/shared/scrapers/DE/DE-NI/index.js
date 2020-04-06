import defaultScraperDEU, { sharedSchema } from '../_shared.js';
import * as parse from '../../../lib/parse.js';

const scraper = {
  ...sharedSchema,
  country: 'iso1:DE',
  state: 'iso2:DE-NI', // ISO 3166 notation
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parse.number(row[`${scraper.state.slice(5)}_cases`]),
      deaths: parse.number(row[`${scraper.state.slice(5)}_deaths`]),
      coordinates: [9.845, 52.636],
      population: 7.96 * 10 ** 6
    };
  }
};

export default scraper;
