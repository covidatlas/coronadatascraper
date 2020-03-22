import defaultScraperDEU from '../_shared.js';

const scraper = {
  country: 'DEU',
  state: 'DE-HB',
  url: 'https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv',
  type: 'csv',
  timeseries: true,
  sources: [
    {
      name: 'Robert Koch-Institut (RKI), Bremen ministry of health',
      description: 'RKI, Bremen ministry of health, double-checked with ZEIT ONLINE, curated by JPG, see "curators"',
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
  maintainers: [
    {
      name: 'Dr. Jan-Philip Gehrcke',
      email: 'jgehrcke@googlemail.com',
      url: 'https://gehrcke.de',
      github: 'jgehrcke'
    }
  ],
  scraper: defaultScraperDEU,
  _rowToResult: row => {
    return {
      cases: parseInt(row['DE-HB_cases'], 10),
      deaths: parseInt(row['DE-HB_deaths'], 10),
      coordinates: [8.801, 53.079],
      population: 0.548 * 10 ** 6
    };
  }
};

export default scraper;
