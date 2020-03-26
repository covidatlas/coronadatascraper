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
  _baseUrl: 'http://www.dph.illinois.gov/',
  _reject: [{ county: 'Illinois County' }, { county: 'Chicago County' }, { county: 'Suburban Cook County' }],
  async scraper() {
    const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();
    
    if (datetime.dateIsBefore(date, '2020-03-24')) {
      this.url = `${this._baseUrl}sites/default/files/COVID19/COVID19CountyResults.json`;
    } else if (datetime.dateIsBefore(date, '2020-03-25')) {
      this.url = `${this._baseUrl}sites/default/files/COVID19/COVID19CountyResults20200323.json`;
    } else if (datetime.dateIsBefore(date, '2020-03-26')) {
      this.url = 'http://www.dph.illinois.gov/sitefiles/COVIDTestResults.json';
    } else {
      const sourcePage = 'http://www.dph.illinois.gov/topics-services/diseases-and-conditions/diseases-a-z-list/coronavirus';
      const sourceScrape = await fetch.fetch(sourcePage, date);
      
      const regex = /Plotly\.d3\.json\('(.+)',/gm;
      const m = regex.exec(sourceScrape);
      this.url = `${this._baseUrl}${m[1]}`
    }

    const data = await fetch.json(this.url);
    const counties = [];

    var chicago = data.characteristics_by_county.values.find(x => x.County == 'Chicago');

    for (var county of data.characteristics_by_county.values) {
      if (county.County=='Illinois' || county.County=='Chicago') {
        continue;
      } else if (county.County=='Cook') {
        var output = {
          county: geography.addCounty(county.County),
          cases: parse.number(county.confirmed_cases) + parse.number(chicago.confirmed_cases)
        };
      } else {
        var output = {
          county: geography.addCounty(county.County),
          cases: parse.number(county.confirmed_cases)
        };
      }
      
      if (rules.isAcceptable(output, null, this._reject)) {
        counties.push(output);
      }
    }

    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
