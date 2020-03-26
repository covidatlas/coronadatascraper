import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as datetime from '../../lib/datetime.js';
import * as transfrom from '../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'CHE',
  url: 'https://github.com/daenuprobst/covid19-cases-switzerland/',
  timeseries: true,
  priority: 1,
  // aggregate: 'state', // doesn't seem to be aggregating properly
  _cantons: [
    'AG',
    'AI',
    'AR',
    'BE',
    'BL',
    'BS',
    'FR',
    'GE',
    'GL',
    'GR',
    'JU',
    'LU',
    'NE',
    'NW',
    'OW',
    'SG',
    'SH',
    'SO',
    'SZ',
    'TG',
    'TI',
    'UR',
    'VD',
    'VS',
    'ZG',
    'ZH'
  ],
  async scraper() {
    const casesURL =
      'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_cases_switzerland.csv';

    const deathsURL =
      'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_fatalities_switzerland.csv';

    const demographicsURL =
      'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/demographics.csv';

    const casesData = await fetch.csv(casesURL, false);
    const deathsData = await fetch.csv(deathsURL, false);
    const demographicsData = await fetch.csv(demographicsURL, false);

    let date = datetime.getYYYYMMDD();
    if (process.env.SCRAPE_DATE) {
      date = datetime.getYYYYMMDD(new Date(process.env.SCRAPE_DATE));
    }

    const index = casesData.findIndex(row => {
      const dateKey = Object.keys(row)[0]; // Date key has an unknown character in it
      return row[dateKey] === date;
    });

    const states = [];

    for (const canton of this._cantons) {
      const casesRow = casesData[index];
      const deathsRow = deathsData[index];

      const cantonDemographic = demographicsData.find(row => {
        const cantonKey = Object.keys(row)[0]; // Date key has an unknown character in it
        return row[cantonKey] === canton;
      });

      const data = {};

      data.state = canton;

      if (casesRow[canton] !== undefined && casesRow[canton] !== '') {
        data.cases = parse.number(casesRow[canton]);
      }

      if (deathsRow[canton] !== undefined && deathsRow[canton] !== '') {
        data.deaths = parse.number(deathsRow[canton]);
      }

      data._featureId = { iso_3166_2: `CH-${canton}` };

      data.population = parse.number(cantonDemographic.Population);

      states.push(data);
    }

    states.push(transfrom.sumData(states));

    return states;
  }
};

export default scraper;
