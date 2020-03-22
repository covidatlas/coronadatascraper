import defaultScraperDEU from '../_shared.js';

const scraper = {
  country: 'DEU',
  state: 'DE-SN', // ISO 3166 notation
  url: 'https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv',
  type: 'json',
  timeseries: true,
  sources: [
    {
      name: 'Robert Koch-Institut (RKI), Sachsen ministry of health',
      description: 'RKI, Sachsen ministry of health, double-checked with ZEIT ONLINE, curated by JPG, see "curators"',
      url: 'https://github.com/jgehrcke/covid-19-germany-gae'
    }
  ],
  curators: [
    {
      name: 'Dr. Jan-Philip Gehrcke',
      email: 'jgehrcke@googlemail.com',
      url: 'https://gehrcke.de',
      github: 'jgehrcke'
    }
  ],
  maintainers: this.curators,
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-SN_cases'], 10),
      deaths: parseInt(row['DE-SN_deaths'], 10),
      coordinates: [13.201, 51.104],
      population: 4.08 * 10 ** 6
    };
  }
};

export default scraper;
