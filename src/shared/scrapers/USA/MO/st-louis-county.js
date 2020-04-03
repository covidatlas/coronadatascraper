import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import * as geography from "../../../lib/geography";

const scraper = {
  county: 'St. Louis County',
  state: 'MO',
  country: 'USA',
  aggregate: 'county',
  priority: 1,
  sources: [
    {
      url: 'https://stlouisco.com/Your-Government/County-Executive/COVID-19',
      name: 'St. Louis County COVID-19 page'
    }
  ],
  url: 'https://stlcogis.maps.arcgis.com/apps/MapSeries/index.html?appid=6ae65dea4d804f2ea4f5d8ba79e96df1',
  headless: true,
  type: 'table',
  maintainers: [maintainers.slezakbs],
  async scraper() {
    this.url = await fetch.getArcGISCSVURLFromOrgId(2, 'w657bnjzrjguNyOy', 'StLouisCounty_Bdy_Geo');
    const data = await fetch.csv(this.url);
    if (data.length === 1) {
      return {
        county: geography.addCounty(this.county),
        cases: parse.number(data[0]['Cumulative_Cases']),
        deaths: parse.number(data[0]['Deaths']),
        recovered: parse.number(data[0]['Cases_Recovered'])
      }
    } else {
      return {};
    }
  }
};
export default scraper;