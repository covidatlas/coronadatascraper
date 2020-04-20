import * as fetch from '../../lib/fetch/index.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:SE',
  url:
    'https://services5.arcgis.com/fsYDFeRKu1hELJJs/arcgis/rest/services/FOHM_Covid_19_FME_1/FeatureServer/1/query?f=json&where=1%3D1&outFields=*&returnGeometry=false',
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  sources: [{ url: 'https://folkhalsomyndigheten.se', name: 'Public Health Agency of Sweden' }],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const casesRaw = await fetch.json(this, this.url, 'default', false);
    const casesData = casesRaw.features.map(({ attributes }) => attributes);

    const casesByRegion = {};

    const data = [];

    for (const item of casesData) {
      if (datetime.dateIsBeforeOrEqualTo(datetime.getYYYYMMDD(new Date(item.Statistikdatum)), date)) {
        for (const region of Object.keys(mapping)) {
          casesByRegion[region] = item[region] + (casesByRegion[region] || 0);
        }
      }
    }

    for (const region of Object.keys(mapping)) {
      data.push({
        state: mapping[region],
        cases: casesByRegion[region]
      });
    }

    const todaysData = casesData.find(item =>
      datetime.scrapeDateIs(datetime.getYYYYMMDD(new Date(item.Statistikdatum)))
    );

    if (todaysData) {
      data.push({
        deaths: todaysData.Kumulativa_avlidna,
        cases: todaysData.Kumulativa_fall,
        hospitalized: todaysData.Kumulativa_intensivvardade
      });
    } else {
      data.push(transform.sumData(data));
    }

    return data;
  }
};

export default scraper;
