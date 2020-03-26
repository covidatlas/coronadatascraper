import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'VA',
  country: 'USA',
  url: 'https://public.tableau.com/views/VirginiaCOVID-19Dashboard/VirginiaCOVID-19Dashboard',
  type: 'pdf',
  aggregate: 'county',
  maintainers: [maintainers.aed3],

  _counties: [
    'Accomack County',
    'Albemarle County',
    'Alexandria County',
    'Alleghany County',
    'Amelia County',
    'Amherst County',
    'Appomattox County',
    'Arlington County',
    'Augusta County',
    'Bath County',
    'Bedford County',
    'Bland County',
    'Botetourt County',
    'Bristol County',
    'Brunswick County',
    'Buchanan County',
    'Buckingham County',
    'Buena Vista city',
    'Campbell County',
    'Caroline County',
    'Carroll County',
    'Charles City County',
    'Charlotte County',
    'Charlottesville County',
    'Chesapeake County',
    'Chesterfield County',
    'Clarke County',
    'Colonial Heights County',
    'Covington County',
    'Craig County',
    'Culpeper County',
    'Cumberland County',
    'Danville County',
    'Dickenson County',
    'Dinwiddie County',
    'Emporia County',
    'Essex County',
    'Fairfax city',
    'Fairfax County',
    'Falls Church County',
    'Fauquier County',
    'Floyd County',
    'Fluvanna County',
    'Franklin city',
    'Franklin County',
    'Frederick County',
    'Fredericksburg County',
    'Galax County',
    'Giles County',
    'Gloucester County',
    'Goochland County',
    'Grayson County',
    'Greene County',
    'Greensville County',
    'Halifax County',
    'Hampton County',
    'Hanover County',
    'Harrisonburg County',
    'Henrico County',
    'Henry County',
    'Highland County',
    'Hopewell County',
    'Isle of Wight County',
    'James City County',
    'King and Queen County',
    'King George County',
    'King William County',
    'Lancaster County',
    'Lee County',
    'Lexington County',
    'Loudoun County',
    'Louisa County',
    'Lunenburg County',
    'Madison County',
    'Manassas city',
    'Manassas Park County',
    'Martinsville County',
    'Mathews County',
    'Mecklenburg County',
    'Middlesex County',
    'Montgomery County',
    'Nelson County',
    'New Kent County',
    'Newport News County',
    'Norfolk County',
    'Northampton County',
    'Northumberland County',
    'Norton County',
    'Nottoway County',
    'Orange County',
    'Page County',
    'Patrick County',
    'Petersburg County',
    'Pittsylvania County',
    'Poquoson County',
    'Portsmouth County',
    'Powhatan County',
    'Prince Edward County',
    'Prince George County',
    'Prince William County',
    'Pulaski County',
    'Radford County',
    'Rappahannock County',
    'Richmond city',
    'Richmond County',
    'Roanoke city',
    'Roanoke County',
    'Rockbridge County',
    'Rockingham County',
    'Russell County',
    'Salem County',
    'Scott County',
    'Shenandoah County',
    'Smyth County',
    'Southampton County',
    'Spotsylvania County',
    'Stafford County',
    'Staunton County',
    'Suffolk County',
    'Surry County',
    'Sussex County',
    'Tazewell County',
    'Virginia Beach County',
    'Warren County',
    'Washington County',
    'Waynesboro County',
    'Westmoreland County',
    'Williamsburg County',
    'Winchester County',
    'Wise County',
    'Wythe County',
    'York County'
  ],

  async scraper() {
    const pdfBaseURL = `${this.url}.pdf?:showVizHome=no&Locality=`;
    const fullNameCounties = [
      'Buena Vista city',
      'Fairfax city',
      'Franklin city',
      'Franklin County',
      'Manassas city',
      'Richmond city',
      'Richmond County',
      'Roanoke city',
      'Roanoke County'
    ];
    const city2County = ['Buena Vista city', 'Manassas city'];
    const counties = [];

    for (let name of this._counties) {
      const endURL = fullNameCounties.includes(name) ? name : name.slice(0, name.lastIndexOf(' '));
      const pdfUrl = pdfBaseURL + endURL;
      const pdfScrape = await fetch.pdf(pdfUrl);

      if (city2County.includes(name)) {
        name = name.replace('city', 'County');
      }

      if (pdfScrape) {
        let pdfText = '';
        for (const item of pdfScrape) {
          if (item.text === '©') {
            break;
          }
          pdfText += item.text;
        }

        counties.push({
          county: name,
          cases: parse.number(pdfText.match(/(\d*)Cases/)[1]),
          deaths: parse.number(pdfText.match(/(\d*)Deaths/)[1])
        });
      } else {
        counties.push({
          county: name,
          cases: 0
        });
      }
    }

    counties.push(transform.sumData(counties));

    return counties;
  }
};

export default scraper;
