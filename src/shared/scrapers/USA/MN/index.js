import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import * as datetime from '../../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'MN', // Minnesota!
  country: 'USA',
  sources: [
    {
      url: 'https://www.health.state.mn.us/',
      name: 'Minnesota Department of Health'
    },
    {
      url: 'https://www.health.state.mn.us/diseases/coronavirus/situation.html',
      name: 'Minnesota Department of Health'
    }
  ],
  aggregate: 'county',

  _counties: [
    'Aitkin County',
    'Anoka County',
    'Becker County',
    'Beltrami County',
    'Benton County',
    'Big Stone County',
    'Blue Earth County',
    'Brown County',
    'Carlton County',
    'Carver County',
    'Cass County',
    'Chippewa County',
    'Chisago County',
    'Clay County',
    'Clearwater County',
    'Cook County',
    'Cottonwood County',
    'Crow Wing County',
    'Dakota County',
    'Dodge County',
    'Douglas County',
    'Faribault County',
    'Fillmore County',
    'Freeborn County',
    'Goodhue County',
    'Grant County',
    'Hennepin County',
    'Houston County',
    'Hubbard County',
    'Isanti County',
    'Itasca County',
    'Jackson County',
    'Kanabec County',
    'Kandiyohi County',
    'Kittson County',
    'Koochiching County',
    'Lac qui Parle County',
    'Lake County',
    'Lake of the Woods County',
    'Le Sueur County',
    'Lincoln County',
    'Lyon County',
    'McLeod County',
    'Mahnomen County',
    'Marshall County',
    'Martin County',
    'Meeker County',
    'Mille Lacs County',
    'Morrison County',
    'Mower County',
    'Murray County',
    'Nicollet County',
    'Nobles County',
    'Norman County',
    'Olmsted County',
    'Otter Tail County',
    'Pennington County',
    'Pine County',
    'Pipestone County',
    'Polk County',
    'Pope County',
    'Ramsey County',
    'Red Lake County',
    'Redwood County',
    'Renville County',
    'Rice County',
    'Rock County',
    'Roseau County',
    'St. Louis County',
    'Scott County',
    'Sherburne County',
    'Sibley County',
    'Stearns County',
    'Steele County',
    'Stevens County',
    'Swift County',
    'Todd County',
    'Traverse County',
    'Wabasha County',
    'Wadena County',
    'Waseca County',
    'Washington County',
    'Watonwan County',
    'Wilkin County',
    'Winona County',
    'Wright County',
    'Yellow Medicine County'
  ],

  scraper: {
    '0': async function() {
      this.url = 'https://www.health.state.mn.us/diseases/coronavirus/situation.html';
      this.type = 'table';
      const $ = await fetch.page(this.url);

      const $th = $('th:contains("County")');
      const $table = $th.closest('table');
      const $trs = $table.find('tbody > tr');

      let counties = [];

      $trs.each((index, tr) => {
        const $tr = $(tr);

        const cases = parse.number(parse.string($tr.find('> *:last-child').text()) || 0);
        const county = geography.addCounty(parse.string($tr.find('> *:first-child').text()));

        if (index < 1 || index > $trs.get().length - 1) {
          return;
        }

        counties.push({
          county,
          cases
        });
      });

      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-3-30': async function() {
      const counties = [];
      this.url =
        'https://services1.arcgis.com/RQG3sksSXcoDoIfj/arcgis/rest/services/MN_COVID19_County_Tracking_Public_View/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&outFields=*';
      this.type = 'json';
      const data = await fetch.json(this.url);

      data.features.forEach(item => {
        const cases = item.attributes.COVID19POS || 0;
        const county = geography.addCounty(item.attributes.CTY_NAME);

        if (datetime.scrapeDateIsAfter(item.attributes.CV_Updated)) {
          throw new Error(`Data only available until ${new Date(item.attributes.CV_Updated).toLocaleString()}`);
        }

        counties.push({
          county,
          cases
        });
      });

      counties.push(transform.sumData(counties));
      return geography.addEmptyRegions(counties, this._counties, 'county');
    }
  }
};

export default scraper;
