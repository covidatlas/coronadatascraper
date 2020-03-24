import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as datetime from '../../lib/datetime.js';

import { features } from './features.json';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'FRA',
  url: 'https://raw.githubusercontent.com/opencovid19-fr/data/master/dist/chiffres-cles.csv',
  timeseries: true,
  priority: 1,
  // aggregate: 'state', // doesn't seem to be aggregating properly
  async scraper() {
    const data = await fetch.csv(this.url, false);
    let date = datetime.getYYYYMMDD();
    if (process.env.SCRAPE_DATE) {
      date = datetime.getYYYYMMDD(new Date(process.env.SCRAPE_DATE));
    }

    const states = {};

    for (const row of data) {
      const data = {};

      const granularity = row.granularite;
      const rowDate = row.date;

      data.url = row.source_url !== undefined ? row.source_url : this.url;

      if (row.cas_confirmes !== undefined && row.cas_confirmes !== '') {
        data.cases = parse.number(row.cas_confirmes);
      }

      if (row.deces !== undefined && row.deces !== '') {
        data.deaths = parse.number(row.deces);
      }

      if (row.gueris !== undefined && row.gueris !== '') {
        data.recovered = parse.number(row.gueris);
      }

      if ((granularity === 'region' || granularity === 'collectivite-outremer') && rowDate === date) {
        data.state = row.maille_nom;

        const regionCode = row.maille_code.slice(4);
        data.feature = features.find(item => item.properties.code === regionCode);
        data.population = data.feature ? data.feature.properties.population : undefined;

        if (data.state !== '') {
          states[regionCode] = { ...(states[regionCode] || {}), ...data };
        }
      } else if (granularity === 'pays' && rowDate === date) {
        states.FRA = { ...(states.FRA || {}), ...data };
      }
    }
    return Object.values(states);
  }
};

export default scraper;
