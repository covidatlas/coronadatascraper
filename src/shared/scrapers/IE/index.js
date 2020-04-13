import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import maintainers from '../../lib/maintainers.js';
import * as transform from '../../lib/transform.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:IE',
  url:
    'http://opendata-geohive.hub.arcgis.com/datasets/d9be85b30d7748b5b7c09450b8aede63_0.csv?outSR={"latestWkid":3857,"wkid":102100}',
  timeseries: true,
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  sources: [
    {
      url: 'https://data.gov.ie/',
      name: 'Ireland Open Data Portal'
    }
  ],
  async scraper() {
    const casesData = (await fetch.csv(this.url, false)).filter(item => datetime.scrapeDateIs(item.TimeStamp));

    const casesByRegion = {};

    for (const item of casesData) {
      casesByRegion[item.CountyName] = item.ConfirmedCovidCases ? parse.number(item.ConfirmedCovidCases) : undefined;
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
  }
};

export default scraper;
