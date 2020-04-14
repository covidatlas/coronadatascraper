import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import datetime from '../../../lib/datetime/index.js';
import * as rules from '../../../lib/rules.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-IL',
  country: 'iso1:US',
  priority: 1,
  aggregate: 'county',
  sources: [
    {
      url: 'http://www.dph.illinois.gov',
      name: 'IDPH',
      description: 'Illinois Department of Public Health'
    }
  ],
  _baseUrl: 'http://www.dph.illinois.gov/sites/default/files/COVID19/',
  _reject: [
    { county: 'Illinois County' },
    { county: 'Chicago County' },
    { county: 'Suburban Cook County' },
    { county: 'Cook County' }
  ],
  async scraper() {
    const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();
    if (datetime.dateIsBefore(date, '2020-03-23')) {
      this.url = `${this._baseUrl}COVID19CountyResults.json`;
    } else if (datetime.dateIsBefore(date, '2020-03-24')) {
      const datePart = datetime.getYYYYMMDD(date, '');
      this.url = `${this._baseUrl}COVID19CountyResults${datePart}.json`;
    } else {
      this.url = 'http://www.dph.illinois.gov/sitefiles/COVIDTestResults.json';
    }

    const data = await fetch.json(this.url);
    const counties = [];
    const cookCounty = { county: 'Cook County', cases: 0, deaths: 0, tested: 0 };
    for (const county of data.characteristics_by_county.values) {
      let countyName = county.County;
      if (county.County === 'Unassigned') {
        countyName = UNASSIGNED;
      } else {
        countyName = geography.addCounty(countyName);
      }
      const output = {
        county: countyName,
        cases: parse.number(county.confirmed_cases),
        deaths: parse.number(county.deaths || 0),
        tested: parse.number(county.total_tested)
      };
      if (rules.isAcceptable(output, null, this._reject)) {
        counties.push(output);
      } else if (output.county === 'Chicago County' || output.county === 'Cook County') {
        cookCounty.cases += output.cases;
        cookCounty.deaths += output.deaths;
        cookCounty.tested += output.tested;
      }
    }
    counties.push(cookCounty);
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
