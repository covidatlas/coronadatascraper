import defaultScraperDEU from '../_shared.js';

const scraper = {
  country: 'DEU',
  state: 'DE-RP', // ISO 3166 notation
  url: 'https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv',
  type: 'json',
  timeseries: true,
  sources: [
    {
      name: 'Robert Koch-Institut (RKI), Rheinland-Pfalz ministry of health',
      description:
        'RKI, Rheinland-Pfalz ministry of health, double-checked with ZEIT ONLINE, curated by JPG, see "curators"',
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
      cases: parseInt(row['DE-RP_cases'], 10),
      deaths: parseInt(row['DE-RP_deaths'], 10),
      coordinates: [7.308, 50.118],
      population: 4.07 * 10 ** 6
    };
  }
};

export default scraper;
