import assert from 'assert';
import datetime from '../../lib/datetime/iso/index.js';
import * as fetch from '../../lib/fetch/index.js';
import * as transform from '../../lib/transform.js';
import * as parse from '../../lib/parse.js';

const { looksLike } = datetime;

const countryLevelMap = {
  Andalucía: 'iso2:ES-AN',
  Aragón: 'iso2:ES-AR',
  Asturias: 'iso2:ES-AS',
  Baleares: 'iso2:ES-IB',
  Canarias: 'iso2:ES-CN',
  Cantabria: 'iso2:ES-CB',
  'Castilla-La Mancha': 'iso2:ES-CM',
  'Castilla La Mancha': 'iso2:ES-CM',
  'Castilla y León': 'iso2:ES-CL',
  Cataluña: 'iso2:ES-CT',
  Ceuta: 'iso2:ES-CE',
  'C. Valenciana': 'iso2:ES-VC',
  Extremadura: 'iso2:ES-EX',
  Galicia: 'iso2:ES-GA',
  Madrid: 'iso2:ES-MD',
  Melilla: 'iso2:ES-ML',
  Murcia: 'iso2:ES-MC',
  Navarra: 'iso2:ES-NC',
  'País Vasco': 'iso2:ES-PV',
  'La Rioja': 'iso2:ES-RI'
};

const scraper = {
  country: 'iso1:ES',
  url: 'https://github.com/datadista/datasets/tree/master/COVID%2019',
  priority: 1,
  timeseries: true,
  type: 'csv',
  aggregate: 'state',
  sources: [
    {
      name: 'Ministerio de Sanidad',
      url: 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/situacionActual.htm',
      description: 'Government of Spain, Ministry of Health'
    },
    {
      name: 'Departamento de Seguridad Nacional',
      url: 'https://www.dsn.gob.es/gl/current-affairs/press-room',
      description: 'Government of Spain, Department of National Security'
    }
  ],
  curators: [
    {
      name: 'Antonio Delgado', //
      url: 'https://datadista.com/',
      twitter: '@adelgado',
      github: 'adelgadob'
    }
  ],
  maintainers: [
    {
      name: 'Herb Caudill', //
      url: 'https://devresults.com',
      twitter: '@herbcaudill',
      github: 'herbcaudill'
    }
  ],
  _endpoints: [
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
    for (const { name, url } of this._endpoints) {
      rawData[name] = await fetch.csv(this, url, 'default', false);
    }

    // `rawData` looks like this:
    // ```js
    // {
    //    cases: [
    //      {
    //        cod_ine: '01',
    //        CCAA: 'Andalucía',
    //        '2020-02-27': '1',
    //        '2020-02-28': '6',
    //        // ...
    //      },
    //      {
    //        cod_ine: '02',
    //        CCAA: 'Aragón',
    //        '2020-02-27': '0',
    //        '2020-02-28': '1',
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
          .filter(looksLike.isoDate)
          .map(date => {
            const state = parse.string(location);
            const stateMapped = countryLevelMap[state];
            assert(stateMapped, `${state} not found in countryLevelMap`);

            return {
              state: stateMapped,
              date: datetime.parse(date).toString(),
              cases: parse.number(casesRow[date]),
              deaths: parse.number(deathsRow[date] || 0),
              recovered: parse.number(recoveredRow[date] || 0)
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

    const scrapeDate = process.env.SCRAPE_DATE ? datetime.parse(process.env.SCRAPE_DATE) : undefined;

    const sampleRow = rawData.cases[0];
    const dates = Object.keys(sampleRow)
      .filter(looksLike.isoDate)
      .map(datetime.parse)
      .sort();

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    // use the scrape date, or the latest available
    const queryDate = scrapeDate || lastDate;

    if (queryDate < firstDate) throw new Error(`Timeseries starts later than SCRAPE_DATE ${queryDate}`);

    // return data from that date
    const locations = data.filter(d => d.date === queryDate.toString());
    locations.push(transform.sumData(locations));
    return locations;
  }
};

export default scraper;
