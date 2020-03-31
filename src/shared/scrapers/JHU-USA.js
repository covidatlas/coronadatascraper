import * as fetch from '../lib/fetch/index.js';
import * as parse from '../lib/parse.js';
import * as geography from '../lib/geography/index.js';
import * as datetime from '../lib/datetime.js';
import maintainers from '../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  maintainers: [maintainers.lazd],
  url: 'https://github.com/CSSEGISandData/COVID-19',
  timeseries: true,
  priority: -1,
  country: 'USA',
  aggregate: 'county',
  curators: [
    {
      name: 'JHU CSSE',
      url: 'https://systems.jhu.edu/research/public-health/ncov/'
    }
  ],
  _urls: {
    cases:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv',
    deaths:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv'
  },
  scraper: {
    '0': async function() {
      const urls = this._urls;
      const cases = await fetch.csv(urls.cases, false);
      const deaths = await fetch.csv(urls.deaths, false);

      const regions = [];
      let date = Object.keys(cases[0]).pop();

      if (process.env.SCRAPE_DATE) {
        // Find old date
        const customDate = datetime.getMDYY(new Date(process.env.SCRAPE_DATE));
        if (!cases[0][customDate]) {
          console.warn('  ⚠️  No data present for %s, output will be empty', customDate);
        }
        date = customDate;
      }

      for (let index = 0; index < cases.length; index++) {
        // Use their US states
        const state = geography.usStates[parse.string(cases[index].Province_State)];
        let county = geography.getCounty(cases[index].Admin2, state);
        if (county === 'Unassigned') {
          county = UNASSIGNED;
        }
        if (!county) {
          continue;
        }
        const caseData = {
          state,
          county,
          cases: parse.number(cases[index][date] || 0),
          deaths: parse.number(deaths[index][date] || 0)
        };

        regions.push(caseData);
      }

      return regions;
    }
  }
};

export default scraper;
