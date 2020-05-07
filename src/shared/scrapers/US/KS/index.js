import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import datetime from '../../../lib/datetime/index.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import * as pdfUtils from '../../../lib/pdf.js';

const assert = require('assert');

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

// Based on the MO scraper, which was based on NY

const scraper = {
  state: 'iso2:US-KS',
  country: 'iso1:US',
  aggregate: 'county',
  _baseUrl: 'https://khap2.kdhe.state.ks.us/NewsRelease/COVID19/',
  sources: [
    {
      name: 'Kansas Department of Health and Environment',
      url: 'https://govstatus.egov.com/coronavirus'
    },
    {
      name: 'Kansas Department of Health and Environment',
      url: 'http://www.kdheks.gov/coronavirus/COVID-19_Resource_Center.htm'
    }
  ],
  maintainers: [maintainers.paulboal, maintainers.aed3],
  _countyMap: {},
  _counties: [
    'Allen County',
    'Anderson County',
    'Atchison County',
    'Barber County',
    'Barton County',
    'Bourbon County',
    'Brown County',
    'Butler County',
    'Chase County',
    'Chautauqua County',
    'Cherokee County',
    'Cheyenne County',
    'Clark County',
    'Clay County',
    'Cloud County',
    'Coffey County',
    'Comanche County',
    'Cowley County',
    'Crawford County',
    'Decatur County',
    'Dickinson County',
    'Doniphan County',
    'Douglas County',
    'Edwards County',
    'Elk County',
    'Ellis County',
    'Ellsworth County',
    'Finney County',
    'Ford County',
    'Franklin County',
    'Geary County',
    'Gove County',
    'Graham County',
    'Grant County',
    'Gray County',
    'Greeley County',
    'Greenwood County',
    'Hamilton County',
    'Harper County',
    'Harvey County',
    'Haskell County',
    'Hodgeman County',
    'Jackson County',
    'Jefferson County',
    'Jewell County',
    'Johnson County',
    'Kearny County',
    'Kingman County',
    'Kiowa County',
    'Labette County',
    'Lane County',
    'Leavenworth County',
    'Lincoln County',
    'Linn County',
    'Logan County',
    'Lyon County',
    'Marion County',
    'Marshall County',
    'McPherson County',
    'Meade County',
    'Miami County',
    'Mitchell County',
    'Montgomery County',
    'Morris County',
    'Morton County',
    'Nemaha County',
    'Neosho County',
    'Ness County',
    'Norton County',
    'Osage County',
    'Osborne County',
    'Ottawa County',
    'Pawnee County',
    'Phillips County',
    'Pottawatomie County',
    'Pratt County',
    'Rawlins County',
    'Reno County',
    'Republic County',
    'Rice County',
    'Riley County',
    'Rooks County',
    'Rush County',
    'Russell County',
    'Saline County',
    'Scott County',
    'Sedgwick County',
    'Seward County',
    'Shawnee County',
    'Sheridan County',
    'Sherman County',
    'Smith County',
    'Stafford County',
    'Stanton County',
    'Stevens County',
    'Sumner County',
    'Thomas County',
    'Trego County',
    'Wabaunsee County',
    'Wallace County',
    'Washington County',
    'Wichita County',
    'Wilson County',
    'Woodson County',
    'Wyandotte County'
  ],
  /** Returns 2D array of sentences from PDF data.
   *
   * The y-axis values of each element must be _identical_.
   * Spaces per xdiff of elements was determined by trial-and-error.
   *
   * Sample output from a KS PDF:
   * [
   *   '• There were 3738 cases from 78 counties with 125 deaths reported as of 9 a.m.',
   *   '• There have been 515 of 2877 cases that have been hospitalized.',
   *   '• There have been 25720 negative tests conducted at KDHE and private labs.',
   *   ... etc.
   * ]
   */
  _extractPdfSentences(data, pages = [1, 2, 3]) {
    const items = [];
    // Remove nulls.
    for (const item of data) {
      if (item) items.push(item);
    }

    const textitems = items
      .filter(i => {
        return i.page && i.x && i.y && i.text;
      })
      .filter(i => pages.includes(i.page));

    const pageYs = {};
    textitems.forEach(i => {
      const key = `${i.page}/${i.y}`;
      if (!pageYs[key]) pageYs[key] = [];
      pageYs[key].push(i);
    });
    // console.log(pageYs);

    /** Join text in order of x, joining things with spaces or not
     * depending on the xdiff. */
    function joinLineGroup(items) {
      const itemsOrderByX = items.sort((a, b) => (a.x < b.x ? -1 : 1));
      // console.log(itemsOrderByX);
      let lastX = 0;
      let line = itemsOrderByX.reduce((s, i) => {
        // console.log(i);
        // eyeballing spaces from the data!
        const xdiff = i.x - lastX;
        // console.log(`xdiff: ${xdiff}`);
        const separator = xdiff < 1 ? '' : ' ';
        lastX = i.x;

        return s + separator + i.text;
      }, '');

      // Comma separator.
      line = line.replace(/%2C/g, ',');

      // PDF xdiff seems to be off when separating numbers from text.
      line = line.replace(/(\d)([a-zA-Z])/g, function(m, a, b) {
        return `${a} ${b}`;
      });
      line = line.replace(/([a-zA-Z])(\d)/g, function(m, a, b) {
        return `${a} ${b}`;
      });

      // Remove comma separator between numbers.
      line = line.replace(/(\d),(\d)/g, function(m, a, b) {
        return `${a}${b}`;
      });

      return line;
    }

    const lineGroups = Object.values(pageYs);
    return lineGroups.map(joinLineGroup);
  },
  /** Returns case data parsed from summary pdf. */
  _parseDailySummary(body) {
    const sentences = this._extractPdfSentences(body);
    // console.log(sentences);

    // Regex the items we want from the sentences.
    const stateDataREs = {
      cases: /were (\d+) cases/,
      deaths: /with (\d+) deaths/,
      hospitalized: /been (\d+) of .* cases that have been hospitalized/,
      testedNeg: /(\d+) negative tests/
    };

    const rawStateData = Object.keys(stateDataREs).reduce((hsh, key) => {
      const re = stateDataREs[key];
      const text = sentences.filter(s => {
        return re.test(s);
      });
      if (text.length === 0) console.log(`No match for ${key} re ${re}`);
      if (text.length > 1) console.log(`Ambiguous match for ${key} re ${re} (${text.join(';')})`);
      const m = text[0].match(re);

      return {
        ...hsh,
        [key]: parse.number(m[1])
      };
    }, {});

    rawStateData.tested = rawStateData.cases + rawStateData.testedNeg;
    delete rawStateData.testedNeg;

    const data = [];

    const countyRE = /^(.*) County (\d+)$/;
    const countyData = sentences.filter(s => {
      return countyRE.test(s);
    });
    countyData.forEach(lin => {
      const cm = lin.trim().match(countyRE);
      // console.log(cm);
      const rawName = `${cm[1]} County`;
      const countyName = geography.addCounty(rawName);
      const cases = cm[2];
      if (this._counties.includes(countyName)) {
        data.push({
          county: countyName,
          cases: parse.number(cases)
        });
      }
    });

    const summedData = transform.sumData(data);
    data.push(summedData);

    data.push({ ...rawStateData, aggregate: 'county' });

    const result = geography.addEmptyRegions(data, this._counties, 'county');
    // no sum because we explicitly add it above

    return result;
  },
  scraper: {
    '0': async function() {
      const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();
      const datePart = datetime.getMonthDYYYY(date);
      this.url = `${this._baseUrl}COVID-19_${datePart}_.pdf`;
      this.type = 'pdf';

      const body = await fetch.pdf(this, this.url, 'default');

      if (body === null) {
        throw new Error(`No data for ${date}`);
      }

      const rows = pdfUtils.asRows(body).map(row => row.map(col => col.text));

      const counties = [];
      const startIndex = rows.findIndex(cols => cols[0] && cols[0].includes('Positive Case Information')) + 2;

      for (let i = startIndex; i < rows.length; i++) {
        const data = rows[i];

        // First set of columns
        const countyName1 = geography.addCounty(data[0]);

        const cases1 = data[1];

        if (this._counties.includes(countyName1)) {
          counties.push({
            county: countyName1,
            cases: parse.number(cases1)
          });
        }

        // Optional second set of columns
        if (data.length === 4) {
          const countyName2 = geography.addCounty(data[2]);
          const cases2 = data[3];

          if (this._counties.includes(countyName2)) {
            counties.push({
              county: countyName2,
              cases: parse.number(cases2)
            });
          }
        }
      }

      const summedData = transform.sumData(counties);
      counties.push(summedData);

      return geography.addEmptyRegions(counties, this._counties, 'county');
    },
    '2020-03-28': async function() {
      this.type = 'json';
      this.url =
        'https://services9.arcgis.com/Q6wTdPdCh608iNrJ/arcgis/rest/services/COVID19_CountyStatus_KDHE/FeatureServer/0/query?f=json&where=Covid_Case%3D%27Yes%27&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=COUNTY%20asc&resultOffset=0&resultRecordCount=105&cacheHint=true';
      const data = await fetch.json(this, this.url, 'default');
      const counties = [];

      data.features.forEach(item => {
        counties.push({
          county: geography.addCounty(item.attributes.COUNTY.replace(/\W/g, '')),
          cases: item.attributes.Covid_Conf,
          deaths: item.attributes.Covid_Deat,
          recovered: item.attributes.Covid_Reco
        });
      });

      counties.push(transform.sumData(counties));
      return geography.addEmptyRegions(counties, this._counties, 'county');
    },
    '2020-04-01': async function() {
      this.type = 'image';
      this.url =
        'https://public.tableau.com/profile/kdhe.epidemiology#!/vizhome/COVID-19Data_15851817634470/KSCOVID-19CaseData';

      return Object.entries({
        'Atchison County': 1,
        'Barton County': 2,
        'Bourbon County': 3,
        'Butler County': 5,
        'Chautauqua County': 1,
        'Cherokee County': 3,
        'Clay County': 1,
        'Coffey County': 16,
        'Crawford County': 3,
        'Doniphan County': 1,
        'Douglas County': 30,
        'Finney County': 1,
        'Franklin County': 7,
        'Gove County': 1,
        'Harvey County': 2,
        'Jackson County': 1,
        'Jefferson County': 1,
        'Johnson County': 143,
        'Labette County': 25,
        'Linn County': 5,
        'Lyon County': 12,
        'McPherson County': 5,
        'Mitchell County': 2,
        'Montgomery County': 6,
        'Morris County': 2,
        'Neosho County': 1,
        'Osage County': 3,
        'Ottawa County': 1,
        'Pottawatomie County': 2,
        'Pratt County': 1,
        'Reno County': 8,
        'Riley County': 4,
        'Saline County': 1,
        'Sedgwick County': 64,
        'Shawnee County': 18,
        'Stafford County': 1,
        'Stevens County': 1,
        'Sumner County': 1,
        'Woodson County': 3,
        'Wyandotte County': 93
      }).map(([name, value]) => {
        return { county: name, cases: value };
      });
    },
    '2020-04-02': async function() {
      this.type = 'pdf';
      this.url = 'https://public.tableau.com/views/COVID-19Data_15851817634470/CountyCounts.pdf?:showVizHome=no';
      const pdfScrape = await fetch.pdf(this, this.url, 'cases');

      const data = pdfScrape
        .filter(item => item && item.y > 6 && item.y < 46)
        .sort((a, b) => {
          const yDiff = a.y - b.y;
          const xDiff = a.x - b.x;
          const pageDiff = a.page - b.page;
          return pageDiff || yDiff || xDiff;
        });

      let name = '';
      let caseNum = '';
      const counties = [];
      data.forEach((item, i) => {
        const c = item.text;
        if (data[i - 1] && data[i - 1].y !== item.y) {
          counties.push({
            county: name.replace(/(?<!\s)County/, ' County'),
            cases: parse.number(caseNum)
          });
          name = '';
          caseNum = '';
        }

        if (c.match(/[0-9]/)) {
          caseNum += c;
        } else {
          name += c.replace('ﬀ', 'ff');
        }
      });

      counties.push({
        county: name.replace(/(?<!\s)County/, ' County'),
        cases: parse.number(caseNum)
      });

      const pdfUrl = 'https://public.tableau.com/views/COVID-19Data_15851817634470/Mortality.pdf?:showVizHome=no';
      const deathData = await fetch.pdf(this, pdfUrl, 'deaths');
      let totalDeaths = '';
      deathData.forEach(item => {
        if (item && item.text.match(/[0-9]/)) {
          totalDeaths += item.text;
        }
      });

      const totalRow = transform.sumData(counties);
      totalRow.deaths = parse.number(totalDeaths);

      counties.push(totalRow);
      return geography.addEmptyRegions(counties, this._counties, 'county');
    },
    '2020-04-30': async function() {
      // The main page has an href that downloads a PDF.  Link:
      // <a href="/DocumentCenter/View/984/4-29-20-update-numbers" ...>
      const entryUrl = 'https://www.coronavirus.kdheks.gov/';
      const $ = await fetch.page(this, entryUrl, 'tmpindex');
      const linkRE = /DocumentCenter.*update-numbers/;
      const href = $('a')
        .toArray()
        .map(h => $(h))
        .filter(h => {
          return linkRE.test(h.attr('href'));
        });
      assert.equal(1, href.length, `Single link to DocumentCenter matching ${linkRE}`);

      this.type = 'pdf';
      this.url = entryUrl + href[0].attr('href');
      console.log(`Fetching pdf from ${this.url}`);
      const body = await fetch.pdf(this, this.url, 'default');

      if (body === null) {
        throw new Error(`No pdf at ${this.url}`);
      }
      return this._parseDailySummary(body);
    },
    '2020-05-06': async function() {
      // The first page has an href that downloads a PDF.
      const entryUrl = 'https://www.coronavirus.kdheks.gov/160/COVID-19-in-Kansas';
      const $ = await fetch.page(this, entryUrl, 'tmpindex');
      const linkRE = /gcc01.safelinks.protection.outlook.com.*url=(.*?)&.*/;
      const href = $('a')
        .toArray()
        .map(h => $(h))
        .filter(h => {
          return linkRE.test(h.attr('href'));
        });
      assert.equal(1, href.length, `Expect one link on ${entryUrl} matching ${linkRE}`);
      const m = href[0].attr('href').match(linkRE);
      let url = m[1];
      url = url.replace(/%3A/g, ':').replace(/%2F/g, '/');
      this.url = url;

      this.type = 'pdf';
      console.log(`Fetching pdf from ${this.url}`);
      const body = await fetch.pdf(this, this.url, 'default');

      if (body === null) {
        throw new Error(`No pdf at ${this.url}`);
      }
      return this._parseDailySummary(body);
    }
  }
};

export default scraper;
