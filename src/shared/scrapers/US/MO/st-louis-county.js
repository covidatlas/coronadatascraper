import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import * as geography from '../../../lib/geography/index.js';

const scraper = {
  county: 'St. Louis County',
  state: 'iso2:US-MO',
  country: 'iso1:US',
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
    this.url = await fetch.getArcGISCSVURLFromOrgId(this, 2, 'w657bnjzrjguNyOy', 'StLouisCounty_Bdy_Geo');
    const rows = await fetch.csv(this, this.url, 'default');
    const data = rows[0];

    // On 2020-4-28, MO switched from recording dates as UTC
    // (eg, "2020-04-27T18:13:20.273Z") to epoch (eg,
    // 1585082918049, an _integer_ = milliseconds from Jan 1,
    // 1970).  The Date constructor handles both of these.
    let d = data.edit_date;
    // Check if using epoch.
    if (d.match(/^\d+$/)) d = parseInt(d, 10);
    const editDate = new Date(d);

    return {
      county: geography.addCounty(this.county),
      cases: parse.number(data.Cumulative_Cases),
      deaths: parse.number(data.Deaths),
      recovered: parse.number(data.Cases_Recovered),
      publishedDate: editDate.toISOString()
    };
  }
};
export default scraper;
