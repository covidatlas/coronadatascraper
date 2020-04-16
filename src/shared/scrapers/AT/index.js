import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

import mapping from './mapping.json';
import muniMapping from './municipality-mapping.json';

const scraper = {
  country: 'iso1:AT',
  url: 'https://info.gesundheitsministerium.at',
  timeseries: true,
  priority: 1,
  maintainers: [maintainers.qgolsteyn],
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

      const casesRaw = await fetch.csv(this, this.url, 'default', false);
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
    '2020-04-14': async function() {
      this.url = 'https://info.gesundheitsministerium.at/data/GenesenTodesFaelleBL.js';
      this.sources = [
        {
          url: 'https://info.gesundheitsministerium.at',
          name: 'Austrian Ministry of Health'
        }
      ];
      return [
        { state: 'iso2:AT-9', cases: 2053 },
        { state: 'iso2:AT-8', cases: 832 },
        { state: 'iso2:AT-7', cases: 3328 },
        { state: 'iso2:AT-6', cases: 1588 },
        { state: 'iso2:AT-5', cases: 1174 },
        { state: 'iso2:AT-4', cases: 2140 },
        { state: 'iso2:AT-3', cases: 2387 },
        { state: 'iso2:AT-2', cases: 386 },
        { state: 'iso2:AT-1', cases: 271 },
        { cases: 14043 }
      ];
    },
    '2020-04-15': async function() {
      this.url = 'https://info.gesundheitsministerium.at/data/GenesenTodesFaelleBL.js';
      this.sources = [
        {
          url: 'https://info.gesundheitsministerium.at',
          name: 'Austrian Ministry of Health'
        }
      ];

      const data = [];

      const recoveredDeathsUrl = 'https://info.gesundheitsministerium.at/data/GenesenTodesFaelleBL.js';
      const recoveredDeathsRaw = await fetch.fetch(this, recoveredDeathsUrl, 'recovereddeaths', 'txt');
      const recoveredDeathsData = JSON.parse(recoveredDeathsRaw.body.match(/\[.*\]/g));

      const casesUrl = 'https://info.gesundheitsministerium.at/data/Bezirke.js';
      const casesRaw = await fetch.fetch(this, casesUrl, 'cases', 'txt');
      const casesRegionData = JSON.parse(casesRaw.body.match(/\[.*\]/g));

      const casesByRegion = {};
      const deathsByRegion = {};
      const recoveredByRegion = {};

      for (const item of casesRegionData) {
        casesByRegion[muniMapping[item.label]] = item.y + (casesByRegion[muniMapping[item.label]] || 0);
      }

      for (const item of recoveredDeathsData) {
        recoveredByRegion[item.label] = item.y;
        deathsByRegion[item.label] = item.z;
      }

      for (const region of Object.keys(casesByRegion)) {
        data.push({
          state: mapping[region],
          cases: casesByRegion[region],
          recovered: recoveredByRegion[region],
          deaths: deathsByRegion[region]
        });
      }

      data.push(transform.sumData(data));

      return data;
    }
  }
};

export default scraper;
