import deuScraperCommon from '../_shared.js';

const scraper = {
  country: 'DEU',
  state: 'DE-NI', // ISO 3166 notation
  url: 'https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv',
  type: 'json',
  timeseries: true,
  sources: [
    {
      name: 'Robert Koch-Institut (RKI), Niedersachsen ministry of health',
      description:
        'RKI, Niedersachsen ministry of health, double-checked with ZEIT ONLINE, curated by JPG, see "curators"',
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
      cases: parseInt(row['DE-NI_cases'], 10),
      deaths: parseInt(row['DE-NI_deaths'], 10),
      coordinates: [9.845, 52.636],
      population: 7.96 * 10 ** 6
    };
  },
  scraper: deuScraperCommon
};

export default scraper;
