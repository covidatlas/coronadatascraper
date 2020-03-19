import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';

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
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'LA',
  country: 'USA',
  _countyMap: { 'La Salle Parish': 'LaSalle Parish' },
  aggregate: 'county',
  async scraper() {
    const counties = [];
    if (datetime.scrapeDateIsBefore('2020-3-14')) {
      this.url = 'http://ldh.la.gov/Coronavirus/';
      this.type = 'table';
      const $ = await fetch.page(this.url);
      const $table = $('p:contains("Louisiana Cases")').nextAll('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        if (index < 3) {
          return;
        }
        const $tr = $(tr);
        const county = `${parse.string($tr.find(`td:nth-last-child(2)`).text())} Parish`;
        const $tds = $tr.find('td');
        if ($tds.get(0).length > 2 && !$tds.first().attr('rowspan')) {
          return;
        }
        const cases = parse.number($tr.find('td:last-child').text());
        counties.push({
          county: this._countyMap[county] || county,
          cases
        });
      });
    } else {
      if (datetime.scrapeDateIsBefore('2020-3-17')) {
        this.url = 'https://opendata.arcgis.com/datasets/cba425c2e5b8421c88827dc0ec8c663b_0.csv';
      } else {
        this.url = 'https://opendata.arcgis.com/datasets/79e1165ecb95496589d39faa25a83ad4_0.csv';
      }
      this.type = 'csv';
      const data = await fetch.csv(this.url);
      const unassigned = {
        county: UNASSIGNED,
        cases: 0,
        deaths: 0
      };
      for (const county of data) {
        if (county.PARISH === 'Out of State Resident' || county.PARISH === 'Out of State' || county.PARISH === 'Under Investigation' || county.PARISH === 'Parish Under Investigation') {
          unassigned.cases += parse.number(county.Cases);
          unassigned.deaths += parse.number(county.Deaths);
          continue;
        }
        const countyName = `${parse.string(county.PARISH)} Parish`;
        counties.push({
          county: this._countyMap[countyName] || countyName,
          cases: parse.number(county.Cases),
          deaths: parse.number(county.Deaths)
        });
      }
      counties.push(unassigned);
    }
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
