import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import * as datetime from '../../../lib/datetime.js';
import * as pdfUtils from '../../../lib/pdf.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'MA',
  country: 'USA',
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

        if (countyName === 'Dukes and Nantucket') {
          countyObj.feature = geography.generateMultiCountyFeature(['Dukes County, MA', 'Nantucket County, MA'], {
            state: 'MA',
            country: 'USA'
          });
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
    '2020-3-30': async function() {
      this.type = 'json';
      this.url =
        'https://services1.arcgis.com/TXaY625xGc0yvAuQ/arcgis/rest/services/COVID_CASES_MA/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&outFields=*';
      const counties = [];
      const data = await fetch.json(this.url);

      let onlySumDeaths = true;
      let sumDeaths = 0;

      data.features.forEach(item => {
        const cases = item.attributes.CASES;
        const county = geography.addCounty(
          item.attributes.County.charAt(0) + item.attributes.County.slice(1).toLowerCase()
        );

        if (datetime.scrapeDateIsBefore(item.attributes.EditDate)) {
          throw new Error(`Data only available until ${new Date(item.attributes.EditDate).toLocaleString()}`);
        }

        const countyObj = {
          county,
          cases
        };

        if (county.includes('nantucket')) {
          countyObj.feature = geography.generateMultiCountyFeature(['Dukes County, MA', 'Nantucket County, MA'], {
            state: 'MA',
            country: 'USA'
          });
          countyObj.county = 'Dukes and Nantucket County';
        }

        if (county.includes('Unknown')) {
          countyObj.county = UNASSIGNED;
          sumDeaths = item.attributes.DEATHS;
        } else {
          onlySumDeaths = onlySumDeaths && !item.attributes.DEATHS;
        }

        counties.push(countyObj);
      });

      const summedData = transform.sumData(counties);
      if (onlySumDeaths) {
        summedData.deaths = sumDeaths;
      }
      counties.push(summedData);
      return geography.addEmptyRegions(counties, this._counties, 'county');
    }
  }
};

export default scraper;
