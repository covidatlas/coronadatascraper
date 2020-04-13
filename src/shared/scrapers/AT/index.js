import assert from 'assert';

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
  sources: [
    {
      description: 'COVID-19/SARS-COV-2 Cases in EU by Country, State/Province/Local Authorities, and Date',
      url: 'https://github.com/covid19-eu-zh/covid19-eu-data',
      name: 'covid19-eu-data'
    },
    {
      url: 'https://info.gesundheitsministerium.at',
      name: 'Austrian Ministry of Health'
    }
  ],
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
  scraper: {
    '0': async function() {
      const data = [];

      this.url = 'https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-at.csv';

      const casesData = (await fetch.csv(this.url, false)).filter(item => datetime.scrapeDateIs(item.datetime));

      if (casesData.length > 0) {
        const casesByRegion = {};
        const hospitalizedByRegion = {};

        for (const item of casesData) {
          if (item.nuts_2) {
            casesByRegion[item.nuts_2] = parse.number(item.cases);
            hospitalizedByRegion[item.nuts_2] = parse.number(item.hospitalized);
          }
        }

        for (const region of Object.keys(casesByRegion)) {
          data.push({
            state: mapping[region],
            cases: casesByRegion[region],
            hospitalized: hospitalizedByRegion[region]
          });
        }

        data.push(transform.sumData(data));
      }

      return data;
    },
    '2020-04-13': async function() {
      const data = [];

      this.url = 'https://info.gesundheitsministerium.at/data/Bundesland.js';

      const casesRegionData = JSON.parse(
        (await fetch.fetch('https://info.gesundheitsministerium.at/data/Bundesland.js')).body.match(/\[.*\]/g)
      );

      const casesByRegion = {};

      for (const item of casesRegionData) {
        casesByRegion[this._accronymToRegion[item.label]] = parse.number(item.y);
      }

      const $hospitalizedPage = await fetch.page(
        'https://www.sozialministerium.at/Informationen-zum-Coronavirus/Dashboard/Zahlen-zur-Hospitalisierung'
      );

      const $table = $hospitalizedPage('table');
      const $head = $table.find('thead tr > th');
      const $rows = $table.find('tbody > tr');

      $head.each((index, th) => {
        const $th = $hospitalizedPage(th);

        switch (index) {
          case 0:
            assert($th.text() === 'Bundesland', `Invalid header column: ${$th.text()}`);
            break;
          case 1:
            assert($th.text() === 'Hospitalisierung', `Invalid header column: ${$th.text()}`);
            break;
          case 2:
            assert($th.text() === 'Intensivstation', `Invalid header column: ${$th.text()}`);
            break;
          default:
            assert(false, 'Too many columns');
        }
      });

      const hospitalizedByRegion = {};

      $rows.each((index, tr) => {
        const $tr = $hospitalizedPage(tr);

        hospitalizedByRegion[parse.string($tr.find('td:first-child').text())] = parse.number(
          parse.number($tr.find('td:nth-child(2)').text())
        );
      });

      for (const region of Object.keys(casesByRegion)) {
        data.push({
          state: mapping[region],
          cases: casesByRegion[region],
          hospitalized: hospitalizedByRegion[region]
        });
      }

      data.push(transform.sumData(data));

      return data;
    }
  }
};

export default scraper;
