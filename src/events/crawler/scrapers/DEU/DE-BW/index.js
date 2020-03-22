import deuScraperCommon from '../_shared.js';

const scraper = {
  country: 'DEU',
  state: 'DE-BW', // ISO 3166 notation
  url: 'https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv',
  type: 'json',
  timeseries: true,
  sources: [
    {
      name: 'Robert Koch-Institut (RKI), Baden-Württemberg ministry of health',
      description:
        'RKI, Baden-Württemberg ministry of health, double-checked with ZEIT ONLINE, curated by JPG, see "curators"',
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
      cases: parseInt(row['DE-BW_cases'], 10),
      deaths: parseInt(row['DE-BW_deaths'], 10),
      coordinates: [11.497, 48.79],
      population: 11.02 * 10 ** 6
    };
  },
  scraper: deuScraperCommon
};

export default scraper;
