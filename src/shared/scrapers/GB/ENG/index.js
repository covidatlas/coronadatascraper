import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';

import gssCodes from './gss-codes.json';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

// GSS code to ISO code in Wikidata: https://w.wiki/MQ3

const scraper = {
  country: 'iso1:GB',
  state: 'England',
  url: 'https://www.arcgis.com/sharing/rest/content/items/b684319181f94875a6879bbc833ca3a6/data',
  aggregate: 'county',
  type: 'csv',
  async _gssCodeMap() {
    const codeMap = {};
    for (const row of gssCodes) {
      const { isoCode, gss } = row;
      codeMap[gss] = isoCode;
    }
    // custom code for Bournemouth, Christchurch and Poole
    codeMap.E06000058 = 'GB-XBCP';
    return codeMap;
  },

  async scraper() {
    const data = await fetch.csv(this.url);
    const counties = [];

    const codeMap = await this._gssCodeMap();

    for (const row of data) {
      const gss = row.GSS_CD;
      const iso = codeMap[gss];
      if (!iso) {
        console.error(`GB, ENG: ${row.GSS_CD} not found in GSS codes`);
        continue;
      }

      const clId = `iso2:${iso}`;

      counties.push({
        county: clId,
        cases: parse.number(row.TotalCases)
      });
    }
    return counties;
  }
};

export default scraper;
