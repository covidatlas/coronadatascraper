import { LocalDate, DateTimeFormatter } from '@js-joda/core';
import * as fetch from '../../lib/fetch.js';

const ISO = DateTimeFormatter.ofPattern('yyyy-MM-dd');
const isDate = s => s.includes('/');

const parseDate = s => {
  // Source data currently uses ddmmyyyy format for dates,
  // but is (maybe?) planning to switch to yyyymmdd.
  // See https://github.com/datadista/datasets/issues/14
  // When/if this happens, replace contents of this function with:
  // return LocalDate.parse(s)

  const [d, m, y] = s.split('/');
  return LocalDate.parse(`${y}-${m}-${d}`);
};

const mostRecent = dates => dates.sort().pop();

const scraper = {
  country: 'ESP',
  url: 'https://github.com/datadista/datasets/tree/master/COVID%2019',
  priority: 1,
  headless: false,
  timeseries: true,
  aggregate: 'state',
  sources: [
    {
      name: 'cases',
      url: 'https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_casos.csv',
      description: 'Cases by date and community'
    },
    {
      name: 'recovered',
      url: 'https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_altas.csv',
      description: 'Recoveries by date and community'
    },
    {
      name: 'deaths',
      url: 'https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_fallecidos.csv',
      description: 'Deaths by date and community'
    }
  ],
  async scraper() {
    const rawData = {};
    for (const { name, url } of this.sources) {
      rawData[name] = await fetch.csv(url);
    }

    // `data_raw` looks like this:
    // ```js
    // {
    //    cases: [
    //      {
    //        cod_ine: '01',
    //        CCAA: 'Andalucía',
    //        '27/02/2020': '1',
    //        '28/02/2020': '6',
    //        // ...
    //      },
    //      {
    //        cod_ine: '02',
    //        CCAA: 'Aragón',
    //        '27/02/2020': '0',
    //        '28/02/2020': '1',
    //        // ...
    //      },
    //      //... other locations
    //    ],
    //    recovered: [
    //      // same format
    //    ],
    //    deaths: [
    //      // same format
    //    ]
    // }
    // ```

    const data = rawData.cases
      .filter(casesRow => casesRow.CCAA !== 'Total')
      .flatMap(casesRow => {
        const location = casesRow.CCAA;
        const sameLocation = d => d.CCAA === location;
        const deathsRow = rawData.deaths.find(sameLocation);
        const recoveredRow = rawData.recovered.find(sameLocation);
        return Object.keys(casesRow)
          .filter(isDate)
          .map(date => {
            return {
              state: location,
              date: parseDate(date).format(ISO),
              cases: +casesRow[date] || 0,
              deaths: +deathsRow[date] || 0,
              recovered: +recoveredRow[date] || 0
            };
          });
      });

    // `data` is an array of objects that look like this:
    // ```js
    // {
    //   location: 'Andalucía',
    //   date: '2020-02-27',
    //   cases: 1,
    //   deaths: 0,
    //   recovered: 0
    // },
    // ```

    const sampleRow = rawData.cases[0];
    const dates = Object.keys(sampleRow)
      .filter(isDate)
      .map(parseDate);

    // either get a specific date, or the latest available
    const date = process.env.SCRAPE_DATE ? process.env.SCRAPE_DATE : mostRecent(dates).format(ISO);

    // return data from that date
    return data.filter(d => d.date === date);
  }
};

export default scraper;
