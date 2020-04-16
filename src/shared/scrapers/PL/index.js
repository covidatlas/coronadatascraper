import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import maintainers from '../../lib/maintainers.js';
import * as transform from '../../lib/transform.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:PL',
  url: 'https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-pl.csv',
  timeseries: true,
  priority: 1,
  maintainers: [maintainers.qgolsteyn],
  scraper: {
    '0': async function() {
      this.sources = [
        {
          description: 'COVID-19/SARS-COV-2 Cases in EU by Country, State/Province/Local Authorities, and Date',
          url: 'https://github.com/covid19-eu-zh/covid19-eu-data',
          name: 'covid19-eu-data'
        }
      ];
      this.url = 'https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-pl.csv';

      const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

      const casesData = await fetch.csv(this, this.url, 'default', false);

      const casesByRegion = {};
      const deathsByRegion = {};

      for (const item of casesData) {
        if (datetime.dateIsBeforeOrEqualTo(item.datetime, date) && item.nuts_2) {
          casesByRegion[item.nuts_2] = parse.number(item.cases);
          deathsByRegion[item.nuts_2] = parse.number(item.deaths);
        }
      }

      const data = [];

      for (const region of Object.keys(casesByRegion)) {
        data.push({
          state: mapping[region],
          cases: casesByRegion[region]
        });
      }

      if (data.length > 0) data.push(transform.sumData(data));

      return data;
    },
    '2020-04-13': async function() {
      this.url = 'https://www.gov.pl/web/koronawirus/wykaz-zarazen-koronawirusem-sars-cov-2';
      this.sources = [
        {
          url: 'http://www.mz.gov.pl/',
          name: 'Ministry of Health of the Republic of Poland'
        }
      ];

      const $ = await fetch.page(this, this.url, 'default');

      // The website stores all data as a string in an element with id #registerData
      const $pre = $('#registerData');
      const casesData = JSON.parse(JSON.parse($pre.text()).parsedData);

      const casesByRegion = {};
      const deathsByRegion = {};

      for (const item of casesData) {
        casesByRegion[item['Województwo']] = parse.number(item.Liczba);
        deathsByRegion[item['Województwo']] = parse.number(item['Liczba zgonów']);
      }

      const data = [];

      for (const region of Object.keys(casesByRegion)) {
        data.push({
          state: mapping[region],
          cases: casesByRegion[region],
          deaths: deathsByRegion[region]
        });
      }

      return data;
    }
  }
};

export default scraper;
