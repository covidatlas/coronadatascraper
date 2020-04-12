import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'ID',
  country: 'iso1:US',
  sources: [
    {
      name: 'IDHW',
      description: 'Idaho State Government'
    }
  ],
  type: 'table',
  aggregate: 'county',

  _counties: [
    'Ada County',
    'Adams County',
    'Bannock County',
    'Bear Lake County',
    'Benewah County',
    'Bingham County',
    'Blaine County',
    'Boise County',
    'Bonner County',
    'Bonneville County',
    'Boundary County',
    'Butte County',
    'Camas County',
    'Canyon County',
    'Caribou County',
    'Cassia County',
    'Clark County',
    'Clearwater County',
    'Custer County',
    'Elmore County',
    'Franklin County',
    'Fremont County',
    'Gem County',
    'Gooding County',
    'Idaho County',
    'Jefferson County',
    'Jerome County',
    'Kootenai County',
    'Latah County',
    'Lemhi County',
    'Lewis County',
    'Lincoln County',
    'Madison County',
    'Minidoka County',
    'Nez Perce County',
    'Oneida County',
    'Owyhee County',
    'Payette County',
    'Power County',
    'Shoshone County',
    'Teton County',
    'Twin Falls County',
    'Valley County',
    'Washington County'
  ],

  scraper: {
    '0': async function() {
      this.url = 'https://coronavirus.idaho.gov';
      const $ = await fetch.page(this.url);

      const $th = $('th:contains("Public Health District")');
      const $table = $th.closest('table');
      const $tds = $table.find('td');

      let counties = [];

      let county = null;
      let cases = 0;
      let deaths = 0;

      $tds.each((index, td) => {
        const $td = $(td);
        const columnNum = parse.number($td.attr('class').slice(-1));

        if (columnNum === 2) {
          county = geography.addCounty(parse.string($td.text()));
        } else if (columnNum === 3) {
          cases = parse.number($td.text());
        } else if (columnNum === 4) {
          deaths = parse.number($td.text());

          // There is no Placer County in Idaho?!
          if (county !== 'TOTAL County' && county !== 'Placer County') {
            counties.push({
              county,
              cases,
              deaths
            });
          }

          county = null;
          cases = 0;
          deaths = 0;
        }
      });

      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));

      return counties;
    },
    '2020-04-05': async function() {
      this.url =
        'https://public.tableau.com/views/DPHIdahoCOVID-19Dashboard_V2/DPHCOVID19Dashboard2?%3Aembed=y&%3AshowVizHome=no&%3Adisplay_count=y&%3Adisplay_static_image=y&%3AbootstrapWhenNotified=true';

      // Get the Tableau chart
      const $ = await fetch.page(this.url);

      // Pull out our session id from the json stuffed inside the textarea
      const textArea = $('textarea#tsConfigContainer').text();
      const j = JSON.parse(textArea);
      const sessionId = j.sessionid;

      // Get the blob of psuedo-json using our session ID
      const url = `https://public.tableau.com/vizql/w/DPHIdahoCOVID-19Dashboard_V2/v/DPHCOVID19Dashboard2/bootstrapSession/sessions/${sessionId}`;
      // For the specific sheet we need
      const sheet = 'County%20Case%20Map';

      // POST
      const options = { method: 'post', args: { sheet_id: sheet } };
      let data = await fetch.raw(url, undefined, options);

      // Now regex out the chunk of json we need
      const re = /^\d+;({.*})\d+;({.*})$/;
      data = data.match(re);
      data = JSON.parse(data[2]);

      // Grovel through it to find...
      const pmm = data.secondaryInfo.presModelMap;

      // ... the arrays which hold integer and string values
      const values = pmm.dataDictionary.presModelHolder.genDataDictionaryPresModel.dataSegments['0'].dataColumns;

      let integers;
      let strings;
      for (const kind of values) {
        if (kind.dataType === 'integer') {
          integers = kind.dataValues;
        }
        if (kind.dataType === 'cstring') {
          strings = kind.dataValues;
        }
      }
      integers.push(0); // stick a 0 on the end of the integer list

      // console.log(integers);
      // console.log(strings);

      // ... the indicies into those arrays for list of counties and cases
      const columns =
        pmm.vizData.presModelHolder.genPresModelMapPresModel.presModelMap['County Case Map'].presModelHolder
          .genVizDataPresModel.paneColumnsData.paneColumnsList[0].vizPaneColumns;

      const countyIdx = columns[1].aliasIndices;
      // Negative indicies are meant to specify the value 0, so change the index
      // to be the 0 we stuck on the end of the integer list
      const countIdx = columns[2].aliasIndices.map(x => (x < 0 ? integers.length - 1 : x));

      // console.log(countyIdx);
      // console.log(countIdx);

      // Ok, easy now. Just rip through the list indexing into the strings & integers
      let counties = [];
      for (let i = 0; i < countyIdx.length; i += 1) {
        const county = geography.addCounty(strings[countyIdx[i]]);
        const cases = integers[countIdx[i]];
        counties.push({
          county,
          cases
        });
      }

      counties = geography.addEmptyRegions(counties, this._counties, 'county');
      counties.push(transform.sumData(counties));
      return counties;
    },
    '2020-4-11': async function() {
      this.url =
        'https://services1.arcgis.com/CNPdEkvnGl65jCX8/arcgis/rest/services/iyptX/FeatureServer/0/query?f=json&where=1=1&returnGeometry=false&outFields=*';
      this.type = 'json';

      const data = await fetch.json(this.url);

      const counties = data.features.map(item => {
        return {
          county: geography.addCounty(item.attributes.f1),
          cases: item.attributes.f3 || 0,
          deaths: item.attributes.f4 || 0,
          recoverd: item.attributes.f5 || 0
        };
      });

      counties.push(transform.sumData(counties));
      return geography.addEmptyRegions(counties, this._counties, 'county');
    }
  }
};

export default scraper;
