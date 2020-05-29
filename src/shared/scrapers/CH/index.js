import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

const scraper = {
  country: 'iso1:CH',
  url: 'https://github.com/daenuprobst/covid19-cases-switzerland/',
  timeseries: true,
  priority: 1,
  type: 'csv',
  maintainers: [maintainers.qgolsteyn],
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
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const casesURL =
      'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_cases_switzerland_openzh.csv';

    const deathsURL =
      'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_fatalities_switzerland_openzh.csv';

    const hospitalizedURL =
      'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_hospitalized_switzerland_openzh.csv';

    const releasedURL =
      'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_released_switzerland_openzh.csv';

    const casesData = await fetch.csv(this, casesURL, 'cases', false);
    const deathsData = await fetch.csv(this, deathsURL, 'deaths', false);
    const hospitalizedData = await fetch.csv(this, hospitalizedURL, 'hospitalized', false);
    const releasedData = await fetch.csv(this, releasedURL, 'released', false);

    const dataByCanton = {};

    // Initialize
    for (const canton of this._cantons) {
      dataByCanton[canton] = {
        state: `iso2:CH-${canton}`
      };
    }

    for (const item of casesData) {
      if (datetime.dateIsBeforeOrEqualTo(item.Date, date)) {
        for (const canton of this._cantons) {
          dataByCanton[canton].cases = parse.float(item[canton]) || dataByCanton[canton].cases;
        }
      }
    }

    for (const item of deathsData) {
      if (datetime.dateIsBeforeOrEqualTo(item.Date, date)) {
        for (const canton of this._cantons) {
          dataByCanton[canton].deaths = parse.float(item[canton]) || dataByCanton[canton].deaths;
        }
      }
    }

    for (const item of hospitalizedData) {
      if (datetime.dateIsBeforeOrEqualTo(item.Date, date)) {
        for (const canton of this._cantons) {
          dataByCanton[canton].hospitalized_current = parse.float(item[canton]) || dataByCanton[canton].hospitalized;
        }
      }
    }

    for (const item of releasedData) {
      if (datetime.dateIsBeforeOrEqualTo(item.Date, date)) {
        for (const canton of this._cantons) {
          dataByCanton[canton].discharged = parse.float(item[canton]) || dataByCanton[canton].discharged;
        }
      }
    }

    const data = Object.values(dataByCanton);
    data.push(transform.sumData(data));

    return data;
  }
};

export default scraper;
