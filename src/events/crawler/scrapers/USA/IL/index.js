import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';
import * as datetime from '../../../lib/datetime.js';
import * as rules from '../../../lib/rules.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'IL',
  country: 'USA',
  priority: 1,
  aggregate: 'county',
  _baseUrl: 'http://www.dph.illinois.gov/sites/default/files/COVID19/',
  _reject: [{ county: 'Illinois County' }, { county: 'Chicago County' }, { county: 'Suburban Cook County' }],
  async scraper() {
    const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();
    if (datetime.dateIsBefore(date, '2020-03-23')) {
      this.url = `${this._baseUrl}COVID19CountyResults.json`;
    } else if (datetime.dateIsBefore(date, '2020-03-24')) {
      const datePart = datetime.getYYYYMMDD(date, '');
      this.url = `${this._baseUrl}COVID19CountyResults${datePart}.json`;
    } else if (datetime.dateIsBefore(date, '2020-03-25')) {
      this.url = `${this._baseUrl}COVID19CountyResults202003250.json`;
    } else {
      this.url = 'http://www.dph.illinois.gov/sitefiles/COVIDTestResults.json';
    }

    const data = await fetch.json(this.url);
    const counties = [];
    for (const county of data.characteristics_by_county.values) {
      const output = {
        county: geography.addCounty(county.County),
        cases: parse.number(county.confirmed_cases),
        tested: parse.number(county.total_tested)
      };
      if (rules.isAcceptable(output, null, this._reject)) {
        counties.push(output);
      }
    }
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
