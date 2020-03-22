import * as fetch from '../../lib/fetch.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'DEU',
  url: 'https://covid19-germany.appspot.com/now',
  type: 'json',
  curators: [
    {
      name: 'Dr. Jan-Philip Gehrcke',
      email: 'jgehrcke@googlemail.com'
    }
  ],
  sources: [
    {
      name: 'Berliner Morgenpost',
      description: 'Aggregated data from individual ministries of health in Germany'
    }
  ],
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
