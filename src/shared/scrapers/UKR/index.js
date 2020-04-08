import * as fetch from '../../lib/fetch/index.js';
import datetime from '../../lib/datetime/index.js';
import maintainers from '../../lib/maintainers.js';
import * as geography from '../../lib/geography/index.js';
import * as parse from '../../lib/parse.js';

const iso2ref = {
  'Autonomous Republic of Crimea': 'iso2:UA-43',
  'Cherkasy region': 'iso2:UA-71',
  'Chernihiv region': 'iso2:UA-74',
  'Chernivtsi region': 'iso2:UA-77',
  'Dnipropetrovsk region': 'iso2:UA-12',
  'Donetsk region': 'iso2:UA-14',
  'Ivano-Frankivsk region': 'iso2:UA-26',
  'Kharkiv region': 'iso2:UA-63',
  'Kherson region': 'iso2:UA-65',

  'Khmelnytskyi region': 'iso2:UA-68',
  'Khmelnytsky region': 'iso2:UA-68',

  'Kirovohrad region': 'iso2:UA-35',
  'Kirovograd region': 'iso2:UA-35',

  Kyiv: 'iso2:UA-30',
  'Kyiv city': 'iso2:UA-30',

  'Kyiv region': 'iso2:UA-32',
  'Kiev region': 'iso2:UA-32',

  'Luhansk region': 'iso2:UA-09',
  'Lugansk region': 'iso2:UA-09',

  'Lviv region': 'iso2:UA-46',
  'Mykolaiv region': 'iso2:UA-48',

  'Odesa region': 'iso2:UA-51',
  'Odessa region': 'iso2:UA-51',

  'Poltava region': 'iso2:UA-53',
  'Rivne region': 'iso2:UA-56',
  Sevastopol: 'iso2:UA-40',
  'Sumy region': 'iso2:UA-59',
  'Ternopil region': 'iso2:UA-61',
  'Vinnytsia region': 'iso2:UA-05',
  'Volyn region': 'iso2:UA-07',

  'Zakarpattia region': 'iso2:UA-21',
  'Transcarpathian region': 'iso2:UA-21',

  'Zaporizhia region': 'iso2:UA-23',
  'Zaporozhye region': 'iso2:UA-23',

  'Zhytomyr region': 'iso2:UA-18'
};

const scraper = {
  country: 'UKR',
  sources: [
    {
      url: 'https://www.rnbo.gov.ua/en/',
      name: 'National Security and Defense Council of Ukraine\n'
    }
  ],
  url: 'https://api-covid19.rnbo.gov.ua/data?to=', // append YYYY-MM-DD
  type: 'json',
  aggregate: 'state',
  maintainers: [maintainers.ciscorucinski],
  scraper: {
    '0': async function() {
      const regions = [];
      let date = process.env.SCRAPE_DATE;
      date = datetime.getYYYYMMDD(date);
      this.url += date;

      const data = await fetch.json(this.url, false, { disableSSL: true });

      if (data === null) {
        throw new Error(`UKR: failed to fetch data from ${this.url}.`);
      }

      for (const region of data.ukraine) {
        const name =
          region.label.en === 'Kyiv'
            ? geography.addCounty(region.label.en, 'city')
            : geography.addCounty(region.label.en, 'region');

        regions.push({
          cases: parse.number(region.confirmed),
          deaths: parse.number(region.deaths),
          recovered: parse.number(region.recovered),
          coordinates: [region.lng, region.lat],
          county: iso2ref[name]
        });
      }
      return regions;
    }
  }
};
export default scraper;
