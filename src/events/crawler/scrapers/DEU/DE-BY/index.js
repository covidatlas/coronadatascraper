import defaultScraperDEU from '../_shared.js';

const scraper = {
  country: 'DEU',
  state: 'DE-BY', // ISO 3166 notation
  url: 'https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv',
  type: 'csv',
  timeseries: true,
  sources: [
    {
      name: 'Robert Koch-Institut (RKI), Bavarian health ministry',
      description: 'RKI, Bavarian health ministry, double-checked with ZEIT ONLINE, curated by JPG, see "curators"',
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
      cases: parseInt(row['DE-BY_cases'], 10),
      deaths: parseInt(row['DE-BY_deaths'], 10),
      coordinates: [11.497, 48.79],
      population: 13 * 10 ** 6
    };
  }
};

export default scraper;
