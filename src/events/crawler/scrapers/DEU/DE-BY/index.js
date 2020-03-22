import deuScraperCommon from '../_shared.js';

const scraper = {
  country: 'DEU',
  state: 'DE-BY', // ISO 3166 notation
  url: 'https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv',
  type: 'json',
  timeseries: true,
  curators: [
    {
      name: 'Dr. Jan-Philip Gehrcke',
      email: 'jgehrcke@googlemail.com'
    }
  ],
  sources: [
    {
      name: 'Robert Koch-Institut, Bavarian health ministry',
      description: 'Fresh data obtained from Bavarian health ministry by ZEIT ONLINE',
      url: 'https://github.com/jgehrcke/covid-19-germany-gae'
    }
  ],
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-BY_cases'], 10),
      deaths: parseInt(row['DE-BY_deaths'], 10),
      coordinates: [11.497, 48.79],
      population: 13 * 10 ** 6
    };
  },
  scraper: deuScraperCommon
};

export default scraper;
