import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import datetime from '../../../lib/datetime/index.js';

const assert = require('assert');

const scraper = {
  state: 'iso2:US-AZ',
  country: 'iso1:US',
  timeseries: true,
  sources: [
    {
      url: 'https://www.azdhs.gov/',
      name: 'Arizona Department of Health Services'
    }
  ],
  url: 'https://tableau.azdhs.gov/views/COVID-19Dashboard/COVID-19table?%3AisGuestRedirectFromVizportal=y&%3Aembed=y',
  type: 'csv',
  aggregate: 'county',
  scraper: {
    '0': async function() {
      this.url = 'https://opendata.arcgis.com/datasets/5b34cf1637434c7bb6793580c40d1685_0.csv';
      const data = await fetch.csv(this, this.url, 'default', false);

      // Convert T_* field to yyyy-mm-dd string
      // eg. T_4022020 or T_04022020 -> '2020-04-02'
      function parseDateField(s) {
        // Sometimes AZ decides to output their dates differently, eg
        // T_5122020,T_5202013 -- note the first is m/dd/yyyy, the
        // next is m/yyyy/dd.  Other examples: T_3202021,T_3202022.  Super.
        let tmp = s;
        for (let y = 2020; y <= 2021; y++) {
          const ys = `${y}`;
          if (tmp.includes(ys)) {
            tmp = `${tmp.split(ys).join('')}${ys}`;
          }
        }

        let d = tmp.split('_')[1];
        d = d.padStart(8, '0');
        const month = d.slice(0, 2);
        const day = d.slice(2, 4);
        const year = d.slice(4);

        const p = n => parseInt(n, 10);
        assert(p(day) >= 1 && p(day) <= 31, `day ${day} valid for ${d}`);
        assert(p(month) >= 1 && p(month) <= 12, `month ${month} valid for ${d}`);
        assert(p(year) >= 2020 && p(year) <= new Date().getFullYear(), `year ${year} valid for ${d}`);
        const ret = [year, month, day]
          .map(n => `${n}`)
          .map(s => s.padStart(2, '0'))
          .join('-');
        return ret;
      }

      const datefields = Object.keys(data[0]).filter(f => f.match(/^T_\d+/));
      const dataFixedHeadings = data.map(d => {
        const rec = {
          name: d.NAME,
          cases: parse.number(d.Number_Confirmed || 0),
          maxcases: 0,
          maxdate: null
        };
        datefields.reduce((hsh, df) => {
          const c = d[df] === '' ? undefined : parse.number(d[df]);
          if (c !== undefined) hsh[parseDateField(df)] = c;
          if ((c || 0) > rec.maxcases) {
            rec.maxcases = c;
            rec.maxdate = df;
          }
          return hsh;
        }, rec);
        return rec;
      });

      const warnings = dataFixedHeadings.filter(d => d.maxcases > d.cases);
      if (warnings.length > 0) {
        console.log(`Warning: cases potentially incorrect:`);
        warnings.forEach(w => {
          console.log(`* ${w.name}: ${w.maxcases} > ${w.cases} on ${w.maxdate}`);
        });
      }

      const scrapeDate = process.env.SCRAPE_DATE ? new Date(`${process.env.SCRAPE_DATE} 12:00:00`) : new Date();
      let scrapeDateString = datetime.getYYYYMMDD(scrapeDate);
      const dates = Object.keys(dataFixedHeadings[0]).filter(f => f.match(/^\d+-\d+-\d+/));
      if (scrapeDateString < dates[0]) {
        throw new Error(`date ${scrapeDateString} < first date of data ${dates[0]}`);
      }
      const lastDate = dates[dates.length - 1];
      if (scrapeDateString > lastDate) {
        console.log(`US/AZ date ${scrapeDateString} > last date ${lastDate}, using last date.`);
        scrapeDateString = lastDate;
      }

      const counties = [];
      for (const d of dataFixedHeadings) {
        counties.push({
          // unfortunately even arcgis isnt reporting any death data
          county: d.name,
          cases: d[scrapeDateString]
        });
      }

      counties.push(transform.sumData(counties));
      // console.table(counties);
      return counties;
    }
  }
};

export default scraper;
