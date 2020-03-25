import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as geography from '../../../lib/geography.js';
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
    'Alexandria city',
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
    'Bristol city',
    'Brunswick County',
    'Buchanan County',
    'Buckingham County',
    'Buena Vista city',
    'Campbell County',
    'Caroline County',
    'Carroll County',
    'Charles City County',
    'Charlotte County',
    'Charlottesville city',
    'Chesapeake city',
    'Chesterfield County',
    'Clarke County',
    'Colonial Heights city',
    'Covington city',
    'Craig County',
    'Culpeper County',
    'Cumberland County',
    'Danville city',
    'Dickenson County',
    'Dinwiddie County',
    'Emporia city',
    'Essex County',
    'Fairfax city',
    'Fairfax County',
    'Falls Church city',
    'Fauquier County',
    'Floyd County',
    'Fluvanna County',
    'Franklin city',
    'Franklin County',
    'Frederick County',
    'Fredericksburg city',
    'Galax city',
    'Giles County',
    'Gloucester County',
    'Goochland County',
    'Grayson County',
    'Greene County',
    'Greensville County',
    'Halifax County',
    'Hampton city',
    'Hanover County',
    'Harrisonburg city',
    'Henrico County',
    'Henry County',
    'Highland County',
    'Hopewell city',
    'Isle of Wight County',
    'James City County',
    'King and Queen County',
    'King George County',
    'King William County',
    'Lancaster County',
    'Lee County',
    'Lexington city',
    'Loudoun County',
    'Louisa County',
    'Lunenburg County',
    'Madison County',
    'Manassas city',
    'Manassas Park city',
    'Martinsville city',
    'Mathews County',
    'Mecklenburg County',
    'Middlesex County',
    'Montgomery County',
    'Nelson County',
    'New Kent County',
    'Newport News city',
    'Norfolk County',
    'Northampton County',
    'Northumberland County',
    'Norton city',
    'Nottoway County',
    'Orange County',
    'Page County',
    'Patrick County',
    'Petersburg city',
    'Pittsylvania County',
    'Poquoson city',
    'Portsmouth city',
    'Powhatan County',
    'Prince Edward County',
    'Prince George County',
    'Prince William County',
    'Pulaski County',
    'Radford city',
    'Rappahannock County',
    'Richmond city',
    'Richmond County',
    'Roanoke city',
    'Roanoke County',
    'Rockbridge County',
    'Rockingham County',
    'Russell County',
    'Salem city',
    'Scott County',
    'Shenandoah County',
    'Smyth County',
    'Southampton County',
    'Spotsylvania County',
    'Stafford County',
    'Staunton city',
    'Suffolk city',
    'Surry County',
    'Sussex County',
    'Tazewell County',
    'Virginia Beach city',
    'Warren County',
    'Washington County',
    'Waynesboro city',
    'Westmoreland County',
    'Williamsburg city',
    'Winchester city',
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
    let counties = [];

    for (const name of this._counties) {
      const endURL = fullNameCounties.includes(name) ? name : name.slice(0, name.lastIndexOf(' '));
      const pdfUrl = pdfBaseURL + endURL;
      const pdfScrape = await fetch.pdf(pdfUrl);
      if (pdfScrape == null) {
        continue; // try the next county, don't error out
      }

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
    }

    counties.push(transform.sumData(counties));
    counties = geography.addEmptyRegions(counties, this._counties, 'county');

    return counties;
  }
};

export default scraper;
