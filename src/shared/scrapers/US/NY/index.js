import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import datetime from '../../../lib/datetime/index.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-NY',
  country: 'iso1:US',
  aggregate: 'county',
  sources: [
    {
      url: 'https://health.data.ny.gov/Health/New-York-State-Statewide-COVID-19-Testing/xdss-u53e',
      name: 'New York State Department of Health'
    }
  ],
  _counties: [
    'Albany County',
    'Allegany County',
    'Bronx County',
    'Broome County',
    'Cattaraugus County',
    'Cayuga County',
    'Chautauqua County',
    'Chemung County',
    'Chenango County',
    'Clinton County',
    'Columbia County',
    'Cortland County',
    'Delaware County',
    'Dutchess County',
    'Erie County',
    'Essex County',
    'Franklin County',
    'Fulton County',
    'Genesee County',
    'Greene County',
    'Hamilton County',
    'Herkimer County',
    'Jefferson County',
    'Kings County',
    'Lewis County',
    'Livingston County',
    'Madison County',
    'Monroe County',
    'Montgomery County',
    'Nassau County',
    'New York County',
    'Niagara County',
    'Oneida County',
    'Onondaga County',
    'Ontario County',
    'Orange County',
    'Orleans County',
    'Oswego County',
    'Otsego County',
    'Putnam County',
    'Queens County',
    'Rensselaer County',
    'Richmond County',
    'Rockland County',
    'St. Lawrence County',
    'Saratoga County',
    'Schenectady County',
    'Schoharie County',
    'Schuyler County',
    'Seneca County',
    'Steuben County',
    'Suffolk County',
    'Sullivan County',
    'Tioga County',
    'Tompkins County',
    'Ulster County',
    'Warren County',
    'Washington County',
    'Wayne County',
    'Westchester County',
    'Wyoming County',
    'Yates County'
  ],
  async scraper() {
    this.url = 'https://health.data.ny.gov/api/views/xdss-u53e/rows.csv?accessType=DOWNLOAD';
    this.type = 'csv';

    const data = await fetch.csv(this, this.url, 'default', false);

    // FIXME when we roll out new TZ support!
    const today = new Date(process.env.USE_ISO_DATETIME ? datetime.today.at('America/New_York') : datetime.getDate());
    const d = process.env.SCRAPE_DATE ? new Date(`${process.env.SCRAPE_DATE} 12:00:00`) : today;
    const scrapeDate = datetime.getYYYYMD(d);
    console.log(scrapeDate);
    const counties = data
      .filter(row => datetime.getYYYYMD(`${row['Test Date']} 12:00:00`) === scrapeDate)
      .map(row => {
        return {
          county: geography.addCounty(parse.string(row.County)),
          cases: parse.number(row['Cumulative Number of Positives']),
          tested: parse.number(row['Cumulative Number of Tests Performed'])
        };
      });

    /* The data from the URL contains records like this:

       Test Date,County,New Positives,...
       05/05/2020,Albany,27,1321,367,12451
       ...
       03/02/2020,Yates,0,0,0,0

       and it always lags a day behind the current date.  Return
       'undefined' if we're missing the data, b/c we don't know what
       the real values should be.
    */
    if (counties.length === 0) {
      console.log(`No data for scrape date ${scrapeDate}, returning undefined.`);
      return [{ cases: undefined, tested: undefined }];
    }

    const result = geography.addEmptyRegions(counties, this._counties, 'county');
    result.push(transform.sumData(counties));
    return result;
  }
};

export default scraper;

/* Saving for posterity...
  _countyMap: {
    Broom: 'Broome'
  },
  _boroughs: {
    Bronx: 'Bronx County',
    Brooklyn: 'Kings County',
    Manhattan: 'New York County',
    Queens: 'Queens County',
    'Staten Island': 'Richmond County'
  },
  _boroughURL: 'https://www1.nyc.gov/assets/doh/downloads/pdf/imm/covid-19-daily-data-summary.pdf',
  async scraper() {
    this.url = datetime.scrapeDateIsBefore('2020-03-17')
      ? 'https://www.health.ny.gov/diseases/communicable/coronavirus/'
      : 'https://coronavirus.health.ny.gov/county-county-breakdown-positive-cases';
    let counties = [];
    const $ = await fetch.page(this, this.url, 'default');
    let $table;
    if (datetime.scrapeDateIsBefore('2020-03-17')) {
      $table = $('#case_count_table');
    } else {
      $table = $('table').first();
    }
    const $trs = $table.find('tr:not(.total_row):not(:first-child)');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      let countyName = parse.string($tr.find('td:first-child').text()).replace(':', '');
      countyName = this._countyMap[countyName] || countyName;
      if (
        countyName !== 'New York State (Outside of NYC)' &&
        countyName !== 'Total Positive Cases (Statewide)' &&
        countyName !== 'Total Number of Positive Cases'
      ) {
        const countyObj = {
          cases: parse.number($tr.find('td:last-child').text())
        };

        if (countyName === 'New York City') {
          countyObj.city = countyName;
          countyObj.feature = geography.generateMultiCountyFeature(
            ['Bronx County, NY', 'Kings County, NY', 'New York County, NY', 'Queens County, NY', 'Richmond County, NY'],
            {
              state: 'iso2:US-NY',
              country: 'iso1:US'
            }
          );
        } else {
          countyObj.county = geography.addCounty(countyName);
        }
        counties.push(countyObj);
      }
    });

    counties.push(transform.sumData(counties));

    try {
      const pdfScrape = await fetch.pdf(this, this._boroughURL, 'default');
      Object.keys(this._boroughs).forEach(name => {
        const valIndex = pdfScrape.findIndex(ele => ele.text === name);

        counties.push({
          county: this._boroughs[name],
          cases: parse.number(pdfScrape[valIndex + 1].text.match(/(\d*)/)[1])
        });
      });
    } catch (err) {
      console.error('  📃 Cannot get county-level PDF data for NYC boroughs on %s, skipping!', process.env.SCRAPE_DATE);
    }

    counties = geography.addEmptyRegions(counties, this._counties, 'county');

    return counties;
  },
  */
