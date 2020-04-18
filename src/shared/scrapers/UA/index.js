import datetime from '../../lib/datetime/index.js';
import * as fetch from '../../lib/fetch/index.js';
import maintainers from '../../lib/maintainers.js';
import * as parse from '../../lib/parse.js';

const clIdMap = {
  'Cherkasy region': 'iso2:UA-71',
  'Chernihiv region': 'iso2:UA-74',
  'Chernivtsi region': 'iso2:UA-77',
  'Dnipropetrovsk region': 'iso2:UA-12',
  'Donetsk region': 'iso2:UA-14',
  'Ivano-Frankivsk region': 'iso2:UA-26',
  'Kharkiv region': 'iso2:UA-63',
  'Kherson region': 'iso2:UA-65',
  'Khmelnytsky region': 'iso2:UA-68',
  'Kiev region': 'iso2:UA-32',
  'Kirovograd region': 'iso2:UA-35',
  'Lugansk region': 'iso2:UA-09',
  'Lviv region': 'iso2:UA-46',
  'Mykolaiv region': 'iso2:UA-48',
  'Odessa region': 'iso2:UA-51',
  'Rivne region': 'iso2:UA-56',
  'Sumy region': 'iso2:UA-59',
  'Ternopil region': 'iso2:UA-61',
  'Transcarpathian region': 'iso2:UA-21',
  'Vinnytsia region': 'iso2:UA-05',
  'Volyn region': 'iso2:UA-07',
  'Zaporozhye region': 'iso2:UA-23',
  'Zhytomyr region': 'iso2:UA-18',
  Kyiv: 'iso2:UA-30',
  Poltava: 'iso2:UA-53'

  // not used currently
  // 'Autonomous Republic of Crimea': 'iso2:UA-43',
  // Sevastopol: 'iso2:UA-40',
  // 'Zakarpattia region': 'iso2:UA-21'
};

const scraper = {
  country: 'iso1:UA',
  sources: [
    {
      url: 'https://www.rnbo.gov.ua/en/',
      name: 'National Security and Defense Council of Ukraine'
    }
  ],
  _baseURL: 'https://api-covid19.rnbo.gov.ua/data?to=', // append YYYY-MM-DD
  type: 'json',
  aggregate: 'state',
  maintainers: [maintainers.ciscorucinski],
  async scraper() {
    const regions = [];
    let date = process.env.SCRAPE_DATE;
    date = datetime.getYYYYMMDD(date);

    this.url = this._baseURL + date;
    const data = await fetch.json(this, this.url, 'default', false, { disableSSL: true });

    if (data === null) {
      throw new Error(`UA: failed to fetch data from ${this.url}.`);
    }

    for (const region of data.ukraine) {
      const name = region.label.en;
      const clId = clIdMap[name];

      if (!clId) {
        console.error(`New region added to UA: ${name}, please add to clIdMap.`);
        continue;
      }

      regions.push({
        state: clId,
        cases: parse.number(region.confirmed),
        deaths: parse.number(region.deaths),
        recovered: parse.number(region.recovered)
      });
    }
    return regions;
  }
};

export default scraper;
