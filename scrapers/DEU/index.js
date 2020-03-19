import * as fetch from '../../lib/fetch.js';

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
  country: 'DEU',
  url: 'https://covid19-germany.appspot.com/now',
  type: 'json',
  curator: {
    name: 'Dr. Jan-Philip Gehrcke',
    email: 'jgehrcke@googlemail.com'
  },
  source: 'Berliner Morgenpost (aggregated data from individual ministries of health in Germany)',
  async scraper() {
    const data = await fetch.json(this.url);
    return {
      country: 'DEU',
      cases: data.current_totals.cases,
      deaths: data.current_totals.deaths,
      recovered: data.current_totals.recovered,
      coordinates: [9, 51],
      population: 83 * 10 ** 6
    };
  }
};

export default scraper;
