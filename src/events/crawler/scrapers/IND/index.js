import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';
import * as rules from '../../lib/rules.js';
import * as fs from '../../lib/fs.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'IND',
  url: 'https://www.mohfw.gov.in/', // dashaputra.com/goi
  type: 'table',
  // _reject: [{ state: 'Name of State / UT' }],
  aggregate: 'state',

  // Scrape MOHFW.GOV.IN for State, Cases, Deaths, Recovered
  async scraper() {
    this.url = 'https://www.mohfw.gov.in/';
    const $ = await fetch.page(this.url);

    const $table = $('table[style="font-weight:bold"]');
    $('table tr')
      .slice(-1)
      .remove();
    const $trs = $table.find('tbody > tr');
    const regions = [];

    // const fs = require('fs');
    const filepath = './src/events/crawler/scrapers/IND/population.csv';
    await fs.readCSV(filepath);

    const dataArray = fs.readFile(filepath);

    $trs.each((index, tr) => {
      const $tr = $(tr);
      const data = {
        // city,county,state,country,cases,deaths,recovered,tested,active,population,lat,long,url,aggregate,rating,tz,featureId
        state: parse.string($tr.find('td:nth-child(2)').text()),
        cases: parse.number($tr.find('td:nth-child(3)').text()),
        deaths: parse.number($tr.find('td:nth-child(6)').text()),
        recovered: parse.number($tr.find('td:nth-child(5)').text()),
        population: dataArray[index]
      };
      if (rules.isAcceptable(data, null, this._reject)) {
        regions.push(data);
      }
    });
    return regions;
  }
};

export default scraper;
