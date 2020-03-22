import { LocalDate, DateTimeFormatter } from '@js-joda/core';
import * as fetch from '../../lib/fetch.js';
import * as transform from '../../lib/transform.js';
import * as parse from '../../lib/parse.js';

const scraper = {
  country: 'ESP',
  url: 'https://github.com/datadista/datasets/tree/master/COVID%2019',
  priority: 1,
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
  curators: [{ name: 'Antonio Delgado', url: 'https://datadista.com/', twitter: '@adelgado', github: 'adelgadob' }],
  maintainers: [{ name: 'Herb Caudill', url: 'https://devresults.com', twitter: '@herbcaudill', github: 'herbcaudill' }],
  async scraper() {
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

    const rawData = {};
    for (const { name, url } of this.sources) {
      rawData[name] = await fetch.csv(url, false);
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
        const isSameLocation = d => d.CCAA === location;
        const deathsRow = rawData.deaths.find(isSameLocation);
        const recoveredRow = rawData.recovered.find(isSameLocation);
        return Object.keys(casesRow)
          .filter(isDate)
          .map(date => {
            return {
              state: parse.string(location),
              date: parseDate(date).toString(),
              cases: parse.number(casesRow[date]),
              deaths: parse.number(deathsRow[date]),
              recovered: parse.number(recoveredRow[date])
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

    // Need to jump through a couple extra hoops here because SCRAPE_DATE doesn't use leading zeroes
    const scrapeDate = process.env.SCRAPE_DATE
      ? LocalDate.of(...process.env.SCRAPE_DATE.split('-')) // e.g. '2020-3-8' -> LocalDate.of(2020, 3, 8)
      : undefined;

    const sampleRow = rawData.cases[0];
    const dates = Object.keys(sampleRow)
      .filter(isDate)
      .map(parseDate)
      .sort();

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    // use the scrape date, or the latest available
    const queryDate = scrapeDate || lastDate;

    if (queryDate.isBefore(firstDate)) throw new Error(`Timeseries starts later than SCRAPE_DATE ${queryDate}`);

    // return data from that date
    const locations = data.filter(d => d.date === queryDate.toString());
    locations.push(transform.sumData(locations));
    return locations;
  }
};

export default scraper;
