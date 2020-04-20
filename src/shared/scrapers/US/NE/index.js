import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-NE',
  country: 'iso1:US',
  url: 'https://www.lincoln.ne.gov/city/covid19/',
  type: 'list',
  aggregate: 'county',
  maintainers: [maintainers.aed3],
  priority: 1,
  source: {
    name: 'City of Lincoln, Nebraska COVID-19 Response'
  },
  _counties: [
    'Adams County',
    'Antelope County',
    'Arthur County',
    'Banner County',
    'Blaine County',
    'Boone County',
    'Box Butte County',
    'Boyd County',
    'Brown County',
    'Buffalo County',
    'Burt County',
    'Butler County',
    'Cass County',
    'Cedar County',
    'Chase County',
    'Cherry County',
    'Cheyenne County',
    'Clay County',
    'Colfax County',
    'Cuming County',
    'Custer County',
    'Dakota County',
    'Dawes County',
    'Dawson County',
    'Deuel County',
    'Dixon County',
    'Dodge County',
    'Douglas County',
    'Dundy County',
    'Fillmore County',
    'Franklin County',
    'Frontier County',
    'Furnas County',
    'Gage County',
    'Garden County',
    'Garfield County',
    'Gosper County',
    'Grant County',
    'Greeley County',
    'Hall County',
    'Hamilton County',
    'Harlan County',
    'Hayes County',
    'Hitchcock County',
    'Holt County',
    'Hooker County',
    'Howard County',
    'Jefferson County',
    'Johnson County',
    'Kearney County',
    'Keith County',
    'Keya Paha County',
    'Kimball County',
    'Knox County',
    'Lancaster County',
    'Lincoln County',
    'Logan County',
    'Loup County',
    'Madison County',
    'McPherson County',
    'Merrick County',
    'Morrill County',
    'Nance County',
    'Nemaha County',
    'Nuckolls County',
    'Otoe County',
    'Pawnee County',
    'Perkins County',
    'Phelps County',
    'Pierce County',
    'Platte County',
    'Polk County',
    'Red Willow County',
    'Richardson County',
    'Rock County',
    'Saline County',
    'Sarpy County',
    'Saunders County',
    'Scotts Bluff County',
    'Seward County',
    'Sheridan County',
    'Sherman County',
    'Sioux County',
    'Stanton County',
    'Thayer County',
    'Thomas County',
    'Thurston County',
    'Valley County',
    'Washington County',
    'Wayne County',
    'Webster County',
    'Wheeler County',
    'York County'
  ],
  async scraper() {
    let counties = [];
    const $ = await fetch.page(this, this.url, 'default');

    const listItems = $('ul:contains("Lab-confirmed cases in Nebraska")').find('li');

    listItems.each((index, li) => {
      const text = $(li).text();

      const cases = parse.number(text.match(/: (\d*)/)[1]);
      let county = geography.addCounty(text.slice(0, text.search(/[^\w\s]/)));
      if (county === 'Douglas County/Omaha County') {
        county = 'Douglas County';
      }

      if (this._counties.includes(county)) {
        counties.push({
          county,
          cases
        });
      }
    });
    counties.push(transform.sumData(counties));

    counties = geography.addEmptyRegions(counties, this._counties, 'county');
    return counties;
  }
};

export default scraper;
