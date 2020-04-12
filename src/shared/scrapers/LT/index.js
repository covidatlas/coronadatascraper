import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

const scraper = {
  country: 'iso1:LT',
  url: 'https://osp.maps.arcgis.com/apps/MapSeries/index.html?appid=79255eaa219140dfa65c01ae95ed143b',
  timeseries: true,
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
  async scraper() {
    const casesData = await fetch.csv(
      await fetch.getArcGISCSVURLFromOrgId('', 'XdDVrnFqA9CT3JgB', 'covid_statistics'),
      false
    );

    const locationsData = await fetch.csv(
      await fetch.getArcGISCSVURLFromOrgId('', 'XdDVrnFqA9CT3JgB', 'covid_statistics'),
      false
    );

    console.log(casesData);
  }
};

export default scraper;
