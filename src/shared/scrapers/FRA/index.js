import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as datetime from '../../lib/datetime.js';

import { features } from './features.json';

const scraper = {
  country: 'FRA',
  url: 'https://raw.githubusercontent.com/opencovid19-fr/data/master/dist/chiffres-cles.csv',
  timeseries: true,
  priority: 1,
  // aggregate: 'state', // doesn't seem to be aggregating properly
  _populations: {
    Mayotte: 270372,
    Martinique: 376480
  },
  async scraper() {
    const data = await fetch.csv(this.url, false);

    const latestDate = data
      .map(d => d.date)
      .sort()
      .pop();
    const processDate = process.env.SCRAPE_DATE ? datetime.getYYYYMMDD(new Date(process.env.SCRAPE_DATE)) : undefined;
    const reportDate = processDate || latestDate;

    const states = {};

    for (const row of data) {
      const data = {};

      const granularity = row.granularite;
      const rowDate = row.date;

      data.url = row.source_url ? row.source_url : this.url;

      if (row.cas_confirmes !== undefined && row.cas_confirmes !== '') {
        data.cases = parse.number(row.cas_confirmes);
      }

      if (row.deces !== undefined && row.deces !== '') {
        data.deaths = parse.number(row.deces);
      }

      if (row.gueris !== undefined && row.gueris !== '') {
        data.recovered = parse.number(row.gueris);
      }

      if ((granularity === 'region' || granularity === 'collectivite-outremer') && rowDate === reportDate) {
        data.state = row.maille_nom;

        const regionCode = row.maille_code.slice(4);
        data.feature = features.find(item => item.properties.code === regionCode);
        data.population = this._populations[data.state];
        if (!data.population) {
          data.population = data.feature ? data.feature.properties.population : undefined;
        }

        if (data.state !== '') {
          states[regionCode] = { ...(states[regionCode] || {}), ...data };
        }
      } else if (granularity === 'pays' && rowDate === reportDate) {
        states.FRA = { ...(states.FRA || {}), ...data };
      }
    }
    return Object.values(states);
  }
};

export default scraper;
