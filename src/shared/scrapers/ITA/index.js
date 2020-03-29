import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as datetime from '../../lib/datetime.js';
import * as transform from '../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'ITA',
  url: 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv',
  timeseries: true,
  aggregate: 'state',
  priority: 1,
  async scraper() {
    const data = await fetch.csv(this.url, false);
    const scrapeDate = process.env.SCRAPE_DATE ? process.env.SCRAPE_DATE : datetime.getYYYYMMDD();
    let latestDate = new Date(data[data.length - 1].data);
    latestDate.setHours(0, 0, 0, 0);

    if (datetime.dateIsBefore(latestDate, scrapeDate)) {
      console.error(
        '🚨 Timeseries for ITA has not been updated, latest date is using %s instead of %s',
        datetime.getYYYYMMDD(latestDate),
        datetime.getYYYYMMDD(scrapeDate)
      );
      latestDate = datetime.getYYYYMMDD(latestDate, '-');
    } else {
      latestDate = datetime.getYYYYMMDD(scrapeDate, '-');
    }

    const states = data
      .filter(row => {
        return row.data.substr(0, 10) === latestDate;
      })
      .map(row => {
        return {
          recovered: parse.number(row.dimessi_guariti),
          deaths: parse.number(row.deceduti),
          cases: parse.number(row.totale_casi),
          tested: parse.number(row.tamponi),
          state: parse.string(row.denominazione_regione)
        };
      });

    states.push(transform.sumData(states));

    return states;
  }
};

export default scraper;
