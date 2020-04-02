import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const countryLevelMap = {
  Abruzzo: 'IT-65',
  Basilicata: 'IT-77',
  'P.A. Bolzano': 'IT-BZ',
  Calabria: 'IT-78',
  Campania: 'IT-72',
  'Emilia Romagna': 'IT-45',
  'Friuli Venezia Giulia': 'IT-36',
  Lazio: 'IT-62',
  Liguria: 'IT-42',
  Lombardia: 'IT-25',
  Marche: 'IT-57',
  Molise: 'IT-67',
  Piemonte: 'IT-21',
  Puglia: 'IT-75',
  Sardegna: 'IT-88',
  Sicilia: 'IT-82',
  Toscana: 'IT-52',
  'P.A. Trento': 'IT-32',
  Umbria: 'IT-55',
  "Valle d'Aosta": 'IT-23',
  Veneto: 'IT-34'
};

const scraper = {
  country: 'ITA',
  url: 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv',
  timeseries: true,
  aggregate: 'state',
  priority: 1,
  async scraper() {
    const data = await fetch.csv(this.url, false);
    // FIXME when we roll out new TZ support!
    const fallback = process.env.USE_ISO_DATETIME ? datetime.now.at('Europe/Rome') : datetime.getDate();
    const scrapeDate = process.env.SCRAPE_DATE ? new Date(process.env.SCRAPE_DATE) : fallback;
    let latestDate = new Date(data[data.length - 1].data);
    latestDate.setHours(0, 0, 0, 0); // TODO should probably remove this!

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
        const state = parse.string(row.denominazione_regione);
        const stateMapped = countryLevelMap[state];
        assert(stateMapped, `${state} not found in countryLevelMap`);

        return {
          recovered: parse.number(row.dimessi_guariti),
          deaths: parse.number(row.deceduti),
          cases: parse.number(row.totale_casi),
          tested: parse.number(row.tamponi),
          state: stateMapped
        };
      });

    states.push(transform.sumData(states));

    console.log(states);

    return states;
  }
};

export default scraper;
