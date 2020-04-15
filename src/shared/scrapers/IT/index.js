import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';
import * as transform from '../../lib/transform.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const countryLevelMap = {
  Abruzzo: 'iso2:IT-65',
  Basilicata: 'iso2:IT-77',
  Calabria: 'iso2:IT-78',
  Campania: 'iso2:IT-72',
  'Emilia Romagna': 'iso2:IT-45',
  'Emilia-Romagna': 'iso2:IT-45', // changes depending on the scrape date
  'Friuli Venezia Giulia': 'iso2:IT-36',
  Lazio: 'iso2:IT-62',
  Liguria: 'iso2:IT-42',
  Lombardia: 'iso2:IT-25',
  Marche: 'iso2:IT-57',
  Molise: 'iso2:IT-67',
  Piemonte: 'iso2:IT-21',
  Puglia: 'iso2:IT-75',
  Sardegna: 'iso2:IT-88',
  Sicilia: 'iso2:IT-82',
  Toscana: 'iso2:IT-52',
  'P.A. Trento': 'iso2:IT-32',
  Umbria: 'iso2:IT-55',
  "Valle d'Aosta": 'iso2:IT-23',
  Veneto: 'iso2:IT-34',
  'P.A. Bolzano': '-' // skipping Bolsano, it shouldn't be in this level
};

const scraper = {
  country: 'iso1:IT',
  url: 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv',
  timeseries: true,
  aggregate: 'state',
  priority: 1,
  async scraper() {
    const data = await fetch.csv(this, this.url, 'default', false);
    // FIXME when we roll out new TZ support!
    const fallback = process.env.USE_ISO_DATETIME ? datetime.now.at('Europe/Rome') : datetime.getDate();
    const scrapeDate = process.env.SCRAPE_DATE ? new Date(process.env.SCRAPE_DATE) : fallback;
    let latestDate = new Date(data[data.length - 1].data);
    latestDate.setHours(0, 0, 0, 0); // TODO should probably remove this!

    if (datetime.dateIsBefore(latestDate, scrapeDate)) {
      console.error(
        '  🚨 Timeseries for ITA has not been updated, latest date is using %s instead of %s',
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
      })
      .filter(data => data.state !== '-');

    states.push(transform.sumData(states));
    return states;
  }
};

export default scraper;
