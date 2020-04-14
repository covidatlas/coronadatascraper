import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:AT',
  url: 'https://info.gesundheitsministerium.at',
  timeseries: true,
  priority: 1,
  maintainers: [maintainers.qgolsteyn],
  _accronymToRegion: {
    Bgld: 'Burgenland',
    Ktn: 'Kärnten',
    NÖ: 'Niederösterreich',
    OÖ: 'Oberösterreich',
    Sbg: 'Salzburg',
    Stmk: 'Steiermark',
    T: 'Tirol',
    Vbg: 'Vorarlberg',
    W: 'Wien'
  },
  type: 'csv',
  scraper: {
    '0': async function() {
      const data = [];

      this.url = 'https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-at.csv';
      this.sources = [
        {
          description: 'COVID-19/SARS-COV-2 Cases in EU by Country, State/Province/Local Authorities, and Date',
          url: 'https://github.com/covid19-eu-zh/covid19-eu-data',
          name: 'covid19-eu-data'
        }
      ];

      const casesRaw = await fetch.csv(this, this.url, false);
      const casesData = casesRaw.filter(item => datetime.scrapeDateIs(item.datetime));

      if (casesData.length > 0) {
        const casesByRegion = {};

        for (const item of casesData) {
          if (item.nuts_2) {
            casesByRegion[item.nuts_2] = parse.number(item.cases);
          }
        }

        for (const region of Object.keys(casesByRegion)) {
          data.push({
            state: mapping[region],
            cases: casesByRegion[region]
          });
        }

        data.push(transform.sumData(data));
      }

      return data;
    },
    '2020-04-13': async function() {
      this.url = 'https://info.gesundheitsministerium.at/data/Bundesland.js';
      this.sources = [
        {
          url: 'https://info.gesundheitsministerium.at',
          name: 'Austrian Ministry of Health'
        }
      ];

      const data = [];

      const casesUrl = 'https://info.gesundheitsministerium.at/data/Bundesland.js';
      const casesRaw = await fetch.fetch(this, casesUrl, 'txt');
      const casesRegionData = JSON.parse(casesRaw.body.match(/\[.*\]/g));

      const casesByRegion = {};

      for (const item of casesRegionData) {
        casesByRegion[this._accronymToRegion[item.label]] = parse.number(item.y);
      }

      for (const region of Object.keys(casesByRegion)) {
        data.push({
          state: mapping[region],
          cases: casesByRegion[region]
        });
      }

      data.push(transform.sumData(data));

      return data;
    }
  }
};

export default scraper;
