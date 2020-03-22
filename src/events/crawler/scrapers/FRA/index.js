import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import * as datetime from '../../lib/datetime.js';
import * as rules from '../../lib/rules.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'FRA',
  url: 'https://raw.githubusercontent.com/opencovid19-fr/data/master/dist/chiffres-cles.csv',
  timeseries: true,
  priority: 1,
  aggregate: 'state',
  async scraper() {
    const data = await fetch.csv(this.url, false);
    const states = [];
    let date = datetime.getYYYYMMDD();
    if (process.env.SCRAPE_DATE) {
      date = datetime.getYYYYMMDD(new Date(process.env.SCRAPE_DATE));
    }
    for (const row of data) {
      const granularity = row.granularite !== undefined ? parse.string(row.granularite) : '';
      const rowDate = row.date !== undefined ? parse.string(row.date) : '';
      if ((granularity === 'region' || granularity === 'collectivite-outremer') && rowDate === date) {
        const state = row.maille_nom !== undefined ? parse.string(row.maille_nom) : '';
        const cases = row.cas_confirmes !== undefined ? parse.number(row.cas_confirmes) : 0;
        const deaths = row.deces !== undefined ? parse.number(row.deces) : 0;
        let sourceUrl = row.source_url !== undefined ? parse.string(row.source_url) : this.url;
        sourceUrl = sourceUrl === '' ? this.url : sourceUrl;
        if (state !== '') {
          const data = {
            state,
            cases,
            deaths,
            url: sourceUrl
          };
          if (rules.isAcceptable(data, null, null)) {
            states.push(data);
          }
        }
      }
    }
    states.push(transform.sumData(states));
    return states;
  }
};

export default scraper;
