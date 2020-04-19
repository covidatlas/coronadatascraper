import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import getKey from '../../../utils/get-key.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';
const DetroitCity = 'Detroit City';
const WayneCounty = 'Wayne County';

const labelFragmentsByKey = [
  { deaths: 'deaths' },
  { cases: 'confirmed cases' },
  { discard: 'rate' },
  { county: 'county' }
];

const getValue = (key, text) => {
  if (key === 'county') {
    return geography.getCounty(text, 'iso2:US-MI');
  }
  // Empty cells means 0 for deaths. Ugh.
  if (key === 'deaths' && Number.isNaN(parse.number(text))) {
    return 0;
  }
  return parse.number(text);
};

const scraper = {
  state: 'iso2:US-MI',
  country: 'iso1:US',
  sources: [
    {
      name: 'Michigan Department of Health & Human Services'
    }
  ],
  url: 'https://www.michigan.gov/coronavirus/0,9753,7-406-98163-520743--,00.html',
  type: 'table',
  aggregate: 'county',

  _counties: [
    'Alcona County',
    'Alger County',
    'Allegan County',
    'Alpena County',
    'Antrim County',
    'Arenac County',
    'Baraga County',
    'Barry County',
    'Bay County',
    'Benzie County',
    'Berrien County',
    'Branch County',
    'Calhoun County',
    'Cass County',
    'Charlevoix County',
    'Cheboygan County',
    'Chippewa County',
    'Clare County',
    'Clinton County',
    'Crawford County',
    'Delta County',
    'Dickinson County',
    'Eaton County',
    'Emmet County',
    'Genesee County',
    'Gladwin County',
    'Gogebic County',
    'Grand Traverse County',
    'Gratiot County',
    'Hillsdale County',
    'Houghton County',
    'Huron County',
    'Ingham County',
    'Ionia County',
    'Iosco County',
    'Iron County',
    'Isabella County',
    'Jackson County',
    'Kalamazoo County',
    'Kalkaska County',
    'Kent County',
    'Keweenaw County',
    'Lake County',
    'Lapeer County',
    'Leelanau County',
    'Lenawee County',
    'Livingston County',
    'Luce County',
    'Mackinac County',
    'Macomb County',
    'Manistee County',
    'Marquette County',
    'Mason County',
    'Mecosta County',
    'Menominee County',
    'Midland County',
    'Missaukee County',
    'Monroe County',
    'Montcalm County',
    'Montmorency County',
    'Muskegon County',
    'Newaygo County',
    'Oakland County',
    'Oceana County',
    'Ogemaw County',
    'Ontonagon County',
    'Osceola County',
    'Oscoda County',
    'Otsego County',
    'Ottawa County',
    'Presque Isle County',
    'Roscommon County',
    'Saginaw County',
    'St. Clair County',
    'St. Joseph County',
    'Sanilac County',
    'Schoolcraft County',
    'Shiawassee County',
    'Tuscola County',
    'Van Buren County',
    'Washtenaw County',
    'Wayne County',
    'Wexford County'
  ],

  async scraper() {
    // The webpage breaks out Detroit, which is in Wayne County.
    // The table does not include Detroit's numbers in the Wayne County totals.
    // So we have to roll that up ourselves.
    let detroitCases = 0;
    let detroitDeaths = 0;

    const $ = await fetch.page(this, this.url, 'default');

    const $cap = $('caption:contains("Confirmed COVID-19 Cases")');
    const $table = $cap.closest('table');

    const $headings = $table.find('thead > tr > th');
    assert($headings.length, 'no headings found');
    const dataKeysByColumnIndex = [];
    $headings.each((index, heading) => {
      const $heading = $(heading);
      dataKeysByColumnIndex[index] = getKey({ label: $heading.text(), labelFragmentsByKey });
    });

    let counties = [];

    const unassignedObj = {
      county: UNASSIGNED,
      deaths: 0,
      cases: 0
    };

    const $trs = $table.find('tbody > tr');
    $trs.each((index, tr) => {
      const $tr = $(tr);
      const rowData = {};

      $tr.find('td').each((columnIndex, td) => {
        const $td = $(td);

        const key = dataKeysByColumnIndex[columnIndex];
        rowData[key] = getValue(key, $td.text());
      });

      // Remember these to add them to Wayne County instead
      // TODO: Handling of Detroit seems brittle.
      if (rowData.county === DetroitCity) {
        detroitCases = rowData.cases;
        detroitDeaths = rowData.deaths;
      }

      if (rowData.county === WayneCounty) {
        rowData.cases += detroitCases;
        rowData.deaths += detroitDeaths;
      }

      if (['Out of State', 'Other', 'Not Reported', 'Unknown'].includes(rowData.county)) {
        unassignedObj.cases += rowData.cases;
        unassignedObj.deaths += rowData.deaths;
        return;
      }

      // TODO: What is this doing and is it legitimate?
      if (index < 1 || index > $trs.get().length - 2) {
        return;
      }

      if (rowData.county === DetroitCity) {
        counties.push({
          city: rowData.county,
          county: WayneCounty,
          cases: rowData.cases,
          deaths: rowData.deaths
        });
        return;
      }

      counties.push({
        county: rowData.county,
        cases: rowData.cases,
        deaths: rowData.deaths
      });
    });

    counties.push(unassignedObj);

    counties = geography.addEmptyRegions(counties, this._counties, 'county');
    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
