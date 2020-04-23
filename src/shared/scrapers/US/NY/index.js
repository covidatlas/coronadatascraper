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

    const dateField = 'Test Date';

    // FIXME when we roll out new TZ support!
    const fallback = process.env.USE_ISO_DATETIME ? new Date(datetime.now.at('America/New_York')) : datetime.getDate();
    let scrapeDate = process.env.SCRAPE_DATE ? new Date(`${process.env.SCRAPE_DATE} 12:00:00`) : fallback;
    let scrapeDateString = datetime.getYYYYMD(scrapeDate);
    const firstDateInTimeseries = new Date(`${data[data.length - 1][dateField]} 12:00:00`);
    const lastDateInTimeseries = new Date(`${data[0][dateField]} 12:00:00`);

    if (scrapeDate > lastDateInTimeseries) {
      console.error(
        `  🚨 timeseries for ${geography.getName(
          this
        )}: SCRAPE_DATE ${scrapeDateString} is newer than last sample time ${datetime.getYYYYMD(
          lastDateInTimeseries
        )}. Using last sample anyway`
      );
      scrapeDate = lastDateInTimeseries;
      scrapeDateString = datetime.getYYYYMD(scrapeDate);
    }

    if (scrapeDate < firstDateInTimeseries) {
      throw new Error(`Timeseries starts later than SCRAPE_DATE ${scrapeDateString}`);
    }

    let counties = [];
    for (const row of data) {
      if (datetime.getYYYYMD(`${row[dateField]} 12:00:00`) !== scrapeDateString) {
        continue;
      }
      counties.push({
        county: geography.addCounty(parse.string(row.County)),
        cases: parse.number(row['Cumulative Number of Positives']),
        tested: parse.number(row['Cumulative Number of Tests Performed'])
      });
    }

    if (counties.length === 0) {
      throw new Error(`Timeseries does not contain a sample for SCRAPE_DATE ${scrapeDateString}`);
    }
    counties = geography.addEmptyRegions(counties, this._counties, 'county');
    counties.push(transform.sumData(counties));
    return counties;
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
