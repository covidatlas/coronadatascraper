import * as fetch from '../../lib/fetch/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:LT',
  url:
    'https://services.arcgis.com/XdDVrnFqA9CT3JgB/arcgis/rest/services/covid_locations/FeatureServer/0/query?f=json&where=1%3D1&outFields=*&returnGeometry=false',
  priority: 1,
  type: 'csv',
  sources: [
    {
      url: 'http://sam.lrv.lt/lt/news/koronavirusas',
      name: 'Ministry of Health of the Republic of Lithuania'
    }
  ],
  maintainers: [maintainers.qgolsteyn],
  async scraper() {
    const casesRaw = await fetch.json(this, this.url, 'default');
    const casesData = casesRaw.features.map(({ attributes }) => attributes);

    const casesByRegion = {};

    for (const item of casesData) {
      const data = casesByRegion[mapping[item.Miestas]] || [];
      data.push({
        city: item.Miestas,
        state: mapping[item.Miestas],
        cases: item.Atvejai ? item.Atvejai : undefined,
        deaths: item.Mirė ? item.Mirė : undefined,
        recovered: item.Pasveiko ? item.Pasveiko : undefined
      });
      casesByRegion[mapping[item.Miestas]] = data;
    }

    const data = [];

    for (const region of Object.keys(casesByRegion)) {
      data.push(transform.sumData(casesByRegion[region], { state: region }));
    }

    return data;
  }
};

export default scraper;
