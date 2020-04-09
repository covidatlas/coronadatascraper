import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import datetime from '../../../lib/datetime/index.js';
import * as pdfUtils from '../../../lib/pdf.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'MA',
  country: 'iso1:US',
  aggregate: 'county',

  sources: [
    {
      url: 'https://www.mass.gov/orgs/department-of-public-health',
      name: 'Massachusetts DPH',
      description: 'Massachusetts Department of Public Health'
    },
    {
      url: 'http://memamaps.maps.arcgis.com/apps/MapSeries/index.html?appid=9ef7ef55e4644af29e9ca07bfe6a509f',
      name: 'Massachusetts Emergency Management Agency'
    }
  ],
  maintainers: [maintainers.qgolsteyn, maintainers.aed3],
  _counties: [
    'Barnstable County',
    'Berkshire County',
    'Bristol County',
    // 'Dukes County',
    'Essex County',
    'Franklin County',
    'Hampden County',
    'Hampshire County',
    'Middlesex County',
    // 'Nantucket County',
    'Norfolk County',
    'Plymouth County',
    'Suffolk County',
    'Worcester County'
  ],
  scraper: {
    '0': async function() {
      const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD();
      this.type = 'pdf';

      this.url = `https://www.mass.gov/doc/covid-19-cases-in-massachusetts-as-of-march-${new Date(
        date
      ).getUTCDate()}-2020/download`;

      const body = await fetch.pdf(this.url);

      if (body === null) {
        throw new Error(`No data for ${date}`);
      }

      const rows = pdfUtils.asRows(body).map(row => row.map(col => col.text));

      const counties = [];

      const startIndex = rows.findIndex(cols => cols[0] && cols[0].includes('County')) + 1;

      for (let i = startIndex; !rows[i][0].includes('Sex'); i++) {
        const data = rows[i];
        const countyName = data[0];
        const cases = data[1];

        const countyObj = {
          county: geography.addCounty(countyName),
          cases: parse.number(cases)
        };

        if (countyName === 'Dukes and') {
          countyObj.county = geography.addCounty(`Dukes and ${data[1]}`);
          countyObj.cases = parse.number(data[2]);
        }

        if (
          countyName === 'Dukes and' ||
          (countyName.toLowerCase().includes('nantucket') && countyName.toLowerCase().includes('dukes'))
        ) {
          countyObj.county = ['Dukes County', 'Nantucket County'];
        }

        if (countyName === 'Unknown') {
          countyObj.county = UNASSIGNED;
        }

        // Sometimes, numbers end up in two objects
        if (data.length > 2) {
          // Find all number parts
          let caseString = '';
          for (const part of data.slice(1)) {
            if (Number.isNaN(parseInt(part, 10))) {
              break;
            }
            caseString += part;
          }
          countyObj.cases = parse.number(caseString);
        }
        counties.push(countyObj);
      }

      const summedData = transform.sumData(counties);

      // MA provides an unknown category, we sum it into the state total
      const unknownIndex = rows.findIndex(cols => cols[0] && cols[0].includes('Unknown'));
      if (unknownIndex > 0) summedData.cases += parse.number(rows[unknownIndex][1]);

      // MA has death as a total for the state
      const deathIndex = rows.findIndex(cols => cols[0] && cols[0].includes('Death')) + 1;
      if (deathIndex > 0) {
        const deathData = rows[deathIndex];
        summedData.deaths = parse.number(deathData[deathData.length - 1]);
      }

      counties.push(summedData);

      return geography.addEmptyRegions(counties, this._counties, 'county');
    },
    '2020-03-30': async function() {
      this.type = 'json';
      this.url =
        'https://services1.arcgis.com/TXaY625xGc0yvAuQ/arcgis/rest/services/COVID_CASES_MA/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&outFields=*';
      const counties = [];
      const data = await fetch.json(this.url);

      let onlySumDeaths = true;
      let onlySumTested = true;
      let sumDeaths = 0;
      let sumTested = 0;

      data.features.forEach(item => {
        const countyLC = item.attributes.County.toLowerCase();
        if (item.attributes.County && countyLC.includes('total')) {
          sumDeaths = item.attributes.DEATHS;
          sumTested = item.attributes.TESTED;
          return;
        }

        const cases = item.attributes.CASES || 0;
        const deaths = item.attributes.DEATHS || 0;
        const tested = item.attributes.TESTED || 0;
        const county = geography.addCounty(item.attributes.County.charAt(0) + countyLC.slice(1));

        const countyObj = {
          county,
          cases,
          deaths,
          tested
        };

        if (countyLC.includes('nantucket') && countyLC.includes('dukes')) {
          countyObj.county = ['Dukes County', 'Nantucket County'];
        }

        if (county.includes('Unknown')) {
          countyObj.county = UNASSIGNED;
        }

        onlySumDeaths = onlySumDeaths && !item.attributes.DEATHS;
        onlySumTested = onlySumTested && !item.attributes.TESTED;

        counties.push(countyObj);
      });

      const summedData = transform.sumData(counties);
      if (onlySumDeaths) {
        summedData.deaths = sumDeaths;
      }
      if (onlySumTested) {
        summedData.tested = sumTested;
      }
      counties.push(summedData);
      return geography.addEmptyRegions(counties, this._counties, 'county');
    }
  }
};

export default scraper;
