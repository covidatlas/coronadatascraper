import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import * as pdfUtils from '../../../lib/pdf.js';
import * as datetime from '../../../lib/datetime.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'CT',
  country: 'USA',
  sources: [
    {
      url: 'https://portal.ct.gov/dph',
      name: 'Connecticut State DPH',
      description: 'Connecticut State Department of Public Health'
    }
  ],
  url: 'https://portal.ct.gov/Coronavirus',
  type: 'pdf',
  aggregate: 'county',
  maintainers: [maintainers.qgolsteyn],
  scraper: {
    '0': async function() {
      this.type = 'list';
      const counties = [];
      const $ = await fetch.page(this.url);
      const $lis = $('span:contains("Latest COVID-19 Testing Data in Connecticut")')
        .nextAll('ul')
        .first()
        .find('li');
      $lis.each((index, li) => {
        if (index < 1) {
          return;
        }
        const countyData = $(li)
          .text()
          .split(/:\s*/);
        counties.push({
          county: parse.string(countyData[0]),
          cases: parse.number(countyData[1])
        });
      });
      return counties;
    },
    '2020-3-18': async function() {
      this.type = 'paragraph';
      const counties = [];
      const $ = await fetch.page(this.url);
      const p = $(':contains("Fairfield County:")')
        .last()
        .text();
      const items = p.split('\n');
      for (const item of items) {
        const elements = item.split(':');
        const countyName = parse.string(elements[0]);
        const cases = parse.number(elements[1]);
        counties.push({
          county: countyName,
          cases
        });
      }
      return counties;
    },
    '2020-3-19': async function() {
      this.type = 'table';
      const counties = [];
      const $ = await fetch.page(this.url);

      const $table = $('td:contains("Fairfield County")').closest('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        if (index < 2) {
          return;
        }
        const $tr = $(tr);
        const countyName = geography.addCounty(parse.string($tr.find('td:first-child').text()));
        counties.push({
          county: countyName,
          cases: parse.number($tr.find('td:last-child').text())
        });
      });
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-3-21': async function() {
      const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();

      this.url = `https://portal.ct.gov/-/media/Coronavirus/CTDPHCOVID19summary${new Date(date).getMonth() +
        1}${new Date(date).getUTCDate()}2020.pdf`;

      let body;
      try {
        body = await fetch.pdf(this.url);
      } catch (err) {
        // The CT website does a 302 to a 404.html page if the PDF isn't yet available
        // This manifests as a PDF parsing error
        if (err.parserError !== undefined) {
          throw new Error(`PDF parsing error. Likely no PDF available for ${date}`);
        } else {
          throw new Error(`Error: ${err}`);
        }
      }

      const rows = pdfUtils.asWords(body, 0, 1).map(row => row.map(col => col.text));

      const counties = [];
      const startIndex =
        rows.findIndex(row => row.length > 0 && row[0] === 'County' && row[1] === 'Confirmed Cases') + 1;

      for (let i = startIndex; rows.length > 0 && rows[i][0] !== 'Total'; i++) {
        // Some stray numbers in the PDF, ignore
        if (!Number.isNaN(parse.number(rows[i][0]))) continue;

        const countyName = geography.addCounty(rows[i][0]);

        let cases;
        let deaths;

        if (rows[i].length === 4) {
          cases = parse.number(rows[i][1]);
          deaths = parse.number(rows[i][3]);
        } else if (rows[i].length === 5) {
          // sometimes Foo County gets split across columns 1+2
          cases = parse.number(rows[i][2]);
          deaths = parse.number(rows[i][4]);
        } else {
          throw new Error('Badly formatted row in PDF');
        }

        counties.push({
          county: countyName,
          cases,
          deaths
        });
      }

      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-3-30': async function() {
      this.url =
        'https://maps.ct.gov/arcgis/rest/services/CT_DPH_COVID_19_PROD_Layers/FeatureServer/1/query?f=json&where=1%3D1&returnGeometry=false&outFields=*';
      this.type = 'json';

      const data = await fetch.json(this.url);
      const counties = [];

      data.features.forEach(item => {
        const cases = item.attributes.ConfirmedCases;
        const deaths = item.attributes.Deaths;
        const county = geography.addCounty(item.attributes.COUNTY);

        if (datetime.scrapeDateIsAfter(item.attributes.DateLastUpdated)) {
          throw new Error(`Data only available until ${new Date(item.attributes.DateLastUpdated).toLocaleString()}`);
        }

        counties.push({
          county,
          cases,
          deaths
        });
      });

      counties.push(transform.sumData(counties));
      return counties;
    }
  }
};

export default scraper;
