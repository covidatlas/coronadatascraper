import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:AT',
  url: 'https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-at.csv',
  timeseries: true,
  priority: 1,
  type: 'csv',
  sources: [
    {
      description: 'COVID-19/SARS-COV-2 Cases in EU by Country, State/Province/Local Authorities, and Date',
      url: 'https://github.com/covid19-eu-zh/covid19-eu-data',
      name: 'covid19-eu-data'
    }
  ],
  maintainers: [maintainers.qgolsteyn],
  async scraper() {
    const data = [];
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
  }
};

export default scraper;
