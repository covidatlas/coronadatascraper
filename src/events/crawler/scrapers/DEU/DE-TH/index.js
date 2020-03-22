import deuScraperCommon from '../_shared.js';

const scraper = {
  country: 'DEU',
  state: 'DE-TH', // ISO 3166 notation
  url: 'https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv',
  type: 'json',
  timeseries: true,
  sources: [
    {
      name: 'Robert Koch-Institut (RKI), Thüringen ministry of health',
      description: 'RKI, Thüringen ministry of health, double-checked with ZEIT ONLINE, curated by JPG, see "curators"',
      url: 'https://github.com/jgehrcke/covid-19-germany-gae'
    }
  ],
  curators: [
    {
      name: 'Dr. Jan-Philip Gehrcke',
      email: 'jgehrcke@googlemail.com',
      url: 'https://gehrcke.de',
      github: 'jgehrcke',
      twitter: 'gehrcke'
    }
  ],
  maintainers: [
    {
      name: 'Dr. Jan-Philip Gehrcke',
      email: 'jgehrcke@googlemail.com',
      url: 'https://gehrcke.de',
      github: 'jgehrcke',
      twitter: 'gehrcke'
    }
  ],
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-TH_cases'], 10),
      deaths: parseInt(row['DE-TH_deaths'], 10),
      coordinates: [10.845, 51.011],
      population: 2.14 * 10 ** 6
    };
  },
  scraper: deuScraperCommon
};

export default scraper;
