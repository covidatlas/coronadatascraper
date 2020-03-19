import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as datetime from '../../lib/datetime.js';

/*
  Each scraper must return the following object or an array of the following objects:

  {
    city: String†,
    county: String†,   // County or region name, complete with "County" or "Parish" at the end
    country: String†,  // ISO 3166-1 alpha-3 country code
    cases: Integer,    // Confirmed cases (including presumptive)
    deaths: Integer,
    recovered: Integer,
    tested: Integer
  }

  † Optional, not required if provided in the main scraper definition
*/

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'ITA',
  url: 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv',
  timeseries: true,
  aggregate: 'state',
  async scraper() {
    const data = await fetch.csv(this.url, false);
    let latestDate = data[data.length - 1].data.substr(0, 10);
    if (process.env.SCRAPE_DATE) {
      latestDate = datetime.getYYYYMMDD(new Date(process.env.SCRAPE_DATE), '-');
    }
    return data
      .filter(row => {
        return row.data.substr(0, 10) === latestDate;
      })
      .map(row => {
        return {
          recovered: parse.number(row.dimessi_guariti),
          deaths: parse.number(row.deceduti),
          cases: parse.number(row.totale_casi),
          state: parse.string(row.denominazione_regione)
        };
      });
  }
};

export default scraper;
