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
    const casesUrl =
      'https://raw.githubusercontent.com/J535D165/CoronaWatchNL/master/data/rivm_NL_covid19_province.csv';
    const casesRaw = await fetch.csv(this, casesUrl, 'cases', false);
    const nationalUrl =
      'https://raw.githubusercontent.com/J535D165/CoronaWatchNL/master/data/rivm_NL_covid19_national.csv';
    const nationalData = await fetch.csv(this, nationalUrl, 'national', false);

    let date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    // Get corrected date criteria.
    const allDates = casesRaw.map(item => item.Datum).concat(nationalData.map(item => item.Datum));
    const uniqueDates = Array.from(new Set(allDates)).sort();
    const lastDate = uniqueDates[uniqueDates.length - 1];
    if (date > lastDate) {
      console.error(`${date} is later than last sample ${lastDate}, using ${lastDate}`);
      date = lastDate;
    }
    if (date < uniqueDates[0])
      throw new Error(`${date} requested is less than first date in series, ${uniqueDates[0]}`);

    const casesData = casesRaw.filter(i => i.Datum === date);
    const hospitalized = nationalData.find(i => i.Datum === date && i.Type === 'Ziekenhuisopname');
    const deaths = nationalData.find(i => i.Datum === date && i.Type === 'Overleden');

    const casesByProvince = {};

    for (const item of casesData) {
      if (item.Datum <= date && item.Provincienaam) {
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

    if (hospitalized || deaths || data.length > 0) {
      data.push(
        transform.sumData(data, {
          hospitalized: hospitalized ? parse.number(hospitalized.Aantal) : undefined,
          deaths: deaths ? parse.number(deaths.Aantal) : undefined
        })
      );
    }
    // console.table(data);

    return data;
  }
};

export default scraper;
