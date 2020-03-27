import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';
import * as geography from '../../../lib/geography.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'VA',
  country: 'USA',
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
    'Buena Vista County',
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
    'Lynchburg County',
    'Madison County',
    'Manassas County',
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
    const usePDFs = datetime.scrapeDateIsBefore('2020-3-26');
    this.url = usePDFs
      ? 'https://public.tableau.com/views/VirginiaCOVID-19Dashboard/VirginiaCOVID-19Dashboard'
      : 'http://www.vdh.virginia.gov/content/uploads/sites/182/2020/03/VDH-COVID-19-PublicUseDataset-Cases.csv';
    let counties = [];

    if (usePDFs) {
      const pdfBaseURL = `${this.url}.pdf?:showVizHome=no&Locality=`;
      const fullNameCounties = [
        'Buena Vista County',
        'Fairfax city',
        'Franklin city',
        'Franklin County',
        'Manassas County',
        'Richmond city',
        'Richmond County',
        'Roanoke city',
        'Roanoke County'
      ];
      const county2City = ['Buena Vista County', 'Manassas County'];
      this.type = 'pdf';

      for (const name of this._counties) {
        let endURL = name;
        if (county2City.includes(name)) {
          endURL = endURL.replace('County', 'City');
        }
        if (!fullNameCounties.includes(name)) {
          endURL = endURL.slice(0, name.lastIndexOf(' '));
        }
        const pdfUrl = pdfBaseURL + endURL;
        const pdfScrape = await fetch.pdf(pdfUrl);

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
    } else {
      const cites = ['Fairfax City', 'Franklin City', 'Richmond City', 'Roanoke City'];
      const city2County = ['Buena Vista City', 'Manassas City'];
      const data = await fetch.csv(this.url);
      this.type = 'csv';

      data.forEach(location => {
        let name = parse.string(geography.addCounty(location.Locality));
        if (cites.includes(location.Locality)) {
          name = parse.string(location.Locality.replace('City', 'city'));
        } else if (city2County.includes(location.Locality)) {
          name = parse.string(location.Locality.replace('City', 'County'));
        }

        counties.push({
          county: name,
          cases: parse.number(location['Total Cases'])
        });
      });

      counties = geography.addEmptyRegions(counties, this._counties, 'county');
    }

    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
