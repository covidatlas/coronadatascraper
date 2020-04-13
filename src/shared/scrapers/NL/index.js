import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

import mapping from './mapping.json';

const scraper = {
  country: 'iso1:NL',
  url: 'https://github.com/J535D165/CoronaWatchNL',
  timeseries: true,
  priority: 1,
  type: 'csv',
  sources: [
    {
      description: 'RIVM reported numbers on the Coronavirus outbreak in The Netherlands',
      url: 'https://github.com/J535D165/CoronaWatchNL',
      name: 'CoronaWatchNL'
    }
  ],
  maintainers: [maintainers.qgolsteyn],
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const casesData = (
      await fetch.csv(
        'https://raw.githubusercontent.com/J535D165/CoronaWatchNL/master/data/rivm_NL_covid19_province.csv',
        false
      )
    ).filter(item => datetime.scrapeDateIs(item.Datum));

    const nationalData = await fetch.csv(
      'https://raw.githubusercontent.com/J535D165/CoronaWatchNL/master/data/rivm_NL_covid19_national.csv',
      false
    );

    const hospitalized = nationalData.find(
      item => datetime.scrapeDateIs(item.Datum) && item.Type === 'Ziekenhuisopname'
    );
    const deaths = nationalData.find(item => datetime.scrapeDateIs(item.Datum) && item.Type === 'Overleden');

    const casesByProvince = {};

    for (const item of casesData) {
      if (datetime.dateIsBeforeOrEqualTo(item.Datum, date) && item.Provincienaam) {
        casesByProvince[item.Provincienaam] = parse.number(item.Aantal);
      }
    }

    const data = [];

    for (const region of Object.keys(casesByProvince)) {
      data.push({
        state: mapping[region],
        cases: casesByProvince[region]
      });
    }

    if (hospitalized || deaths || data.length > 0)
      data.push(
        transform.sumData(data, {
          hospitalized: hospitalized ? parse.number(hospitalized.Aantal) : undefined,
          deaths: deaths ? parse.number(deaths.Aantal) : undefined
        })
      );

    return data;
  }
};

export default scraper;
