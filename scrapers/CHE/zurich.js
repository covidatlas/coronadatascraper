import path from 'path';
import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import * as datetime from '../../lib/datetime.js';
import * as rules from '../../lib/rules.js';
import * as fs from '../../lib/fs.js';

/*
  Each scraper must return the following object or an array of the following objects:

  {
    city: String†,
    county: String†,   // County or region name, complete with "County" or "Parish" at the end
    country: String†,  // ISO 3166-1 alpha-3 country code
    cases: Integer,    // Confirmed cases (including presumptive)
    deaths: Integer,
    recovered: Integer,
    tested: Integer
  }

  † Optional, not required if provided in the main scraper definition
*/

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'CHE',
  county: 'Zurich',
  url: 'https://raw.githubusercontent.com/openZH/covid_19/master/COVID19_Fallzahlen_Kanton_ZH_total.csv',
  timeseries: true,
  async scraper() {
    const data = await fetch.csv(this.url, false);
    let latestData;
    if (process.env.SCRAPE_DATE) {
      const date = datetime.getDDMMYYYY(new Date(process.env.SCRAPE_DATE), '.');
      [latestData] = data.filter(dayData => dayData.Date === date);
    } else {
      latestData = data[data.length - 1];
    }
    return {
      recovered: parse.number(latestData.TotalCured),
      deaths: parse.number(latestData.TotalDeaths),
      cases: parse.number(latestData.TotalConfCases),
      tested: parse.number(latestData.TotalTestedCases)
    };
  }
};

export default scraper;
