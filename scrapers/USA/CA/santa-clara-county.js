import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';

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
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Santa Clara County',
  state: 'CA',
  country: 'USA',
  url: 'https://www.sccgov.org/sites/phd/DiseaseInformation/novel-coronavirus/Pages/home.aspx',
  async scraper() {
    const $ = await fetch.page(this.url);
    const scriptData = $('script:contains("Total_Confirmed_Cases")')[0].children[0].data;
    const regExp = /\[.*\]/;
    const data = JSON.parse(regExp.exec(scriptData))[0];
    const cases = parse.number(data.Total_Confirmed_Cases);
    const deaths = parse.number(data.Deaths);
    return {
      cases,
      deaths
    };
  }
};

export default scraper;
