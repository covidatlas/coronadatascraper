import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

// Based on the NY scraper

const scraper = {
  state: 'MO',
  country: 'USA',
  type: 'table',
  aggregate: 'county',
  url: 'https://health.mo.gov/living/healthcondiseases/communicable/novel-coronavirus/results.php',
  sources: [
    {
      name: 'Missouri Department of Health and Senior Services'
    }
  ],
  maintainers: [
    {
      name: 'Paul Boal',
      email: 'paul.boal@amitechsolutions.com',
      url: 'https://amitechsolutions.com',
      github: 'paulboal',
      country: 'USA',
      flag: '🇺🇸'
    }
  ],
  _countyMap: {
    // MO reporting KC as a county, which is really part of several counties.
    'Kansas City': 'Jackson County',
    // MO reporting St. Louis City, which is it's own county, but is being reported as missing.
    'St. Louis City': 'St. Louis County'
  },
  _counties: [
    'Adair County',
    'Andrew County',
    'Atchison County',
    'Audrain County',
    'Barry County',
    'Barton County',
    'Bates County',
    'Benton County',
    'Bollinger County',
    'Boone County',
    'Buchanan County',
    'Butler County',
    'Caldwell County',
    'Callaway County',
    'Camden County',
    'Cape Girardeau County',
    'Carroll County',
    'Carter County',
    'Cass County',
    'Cedar County',
    'Chariton County',
    'Christian County',
    'Clark County',
    'Clay County',
    'Clinton County',
    'Cole County',
    'Cooper County',
    'Crawford County',
    'Dade County',
    'Dallas County',
    'Daviess County',
    'DeKalb County',
    'Dent County',
    'Douglas County',
    'Dunklin County',
    'Franklin County',
    'Gasconade County',
    'Gentry County',
    'Greene County',
    'Grundy County',
    'Harrison County',
    'Henry County',
    'Hickory County',
    'Holt County',
    'Howard County',
    'Howell County',
    'Iron County',
    'Jackson County',
    'Jasper County',
    'Jefferson County',
    'Johnson County',
    'Knox County',
    'Laclede County',
    'Lafayette County',
    'Lawrence County',
    'Lewis County',
    'Lincoln County',
    'Linn County',
    'Livingston County',
    'Macon County',
    'Madison County',
    'Maries County',
    'Marion County',
    'McDonald County',
    'Mercer County',
    'Miller County',
    'Mississippi County',
    'Moniteau County',
    'Monroe County',
    'Montgomery County',
    'Morgan County',
    'New Madrid County',
    'Newton County',
    'Nodaway County',
    'Oregon County',
    'Osage County',
    'Ozark County',
    'Pemiscot County',
    'Perry County',
    'Pettis County',
    'Phelps County',
    'Pike County',
    'Platte County',
    'Polk County',
    'Pulaski County',
    'Putnam County',
    'Ralls County',
    'Randolph County',
    'Ray County',
    'Reynolds County',
    'Ripley County',
    'St. Charles County',
    'St. Clair County',
    'St. Francois County',
    'St. Louis County',
    'Ste. Genevieve County',
    'Saline County',
    'Schuyler County',
    'Scotland County',
    'Scott County',
    'Shannon County',
    'Shelby County',
    'Stoddard County',
    'Stone County',
    'Sullivan County',
    'Taney County',
    'Texas County',
    'Vernon County',
    'Warren County',
    'Washington County',
    'Wayne County',
    'Webster County',
    'Worth County',
    'Wright County'
  ],
  scraper: {
    '0': async function() {
      let counties = {};
      const $ = await fetch.page(this.url);
      const $table = $('table').first();

      const $trs = $table.find('tr');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        let countyName = parse.string($tr.find('td:nth-child(1)').text());
        countyName = this._countyMap[countyName] || countyName;

        const casesState = parse.number($tr.find('td:nth-child(2)').text()) || 0;
        const casesOther = parse.number($tr.find('td:nth-child(3)').text()) || 0;
        countyName = geography.addCounty(countyName);

        if (countyName === 'TBD County') {
          countyName = UNASSIGNED;
        }

        if (countyName !== ' County') {
          if (countyName in counties) {
            counties[countyName].cases += casesState + casesOther;
          } else {
            counties[countyName] = {
              cases: casesState + casesOther
            };
          }
        }
      });

      const countiesList = transform.objectToArray(counties);
      countiesList.push(transform.sumData(countiesList));
      counties = geography.addEmptyRegions(countiesList, this._counties, 'county');

      return counties;
    },
    '2020-02-22': async function() {
      let counties = {};
      const $ = await fetch.page(this.url);
      const $table = $('table').first();

      const $trs = $table.find('tr');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        let countyName = parse.string($tr.find('td:nth-child(1)').text());
        countyName = this._countyMap[countyName] || countyName;
        const casesTotal = parse.number($tr.find('td:nth-child(2)').text()) || 0;
        countyName = geography.addCounty(countyName);

        if (countyName === 'TBD County') {
          countyName = UNASSIGNED;
        }

        if (countyName !== ' County') {
          if (countyName in counties) {
            counties[countyName].cases += casesTotal;
          } else {
            counties[countyName] = {
              cases: casesTotal
            };
          }
        }
      });

      const countiesList = transform.objectToArray(counties);
      countiesList.push(transform.sumData(countiesList));
      counties = geography.addEmptyRegions(countiesList, this._counties, 'county');

      return counties;
    }
  }
};

export default scraper;
