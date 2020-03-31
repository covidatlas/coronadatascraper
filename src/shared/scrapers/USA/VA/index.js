import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as datetime from '../../../lib/datetime.js';
import * as geography from '../../../lib/geography/index.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'VA',
  country: 'USA',
  aggregate: 'county',
  sources: [
    {
      url: 'http://www.vdh.virginia.gov/',
      name: 'VDH',
      description: 'Virginia Department of Health'
    }
  ],
  maintainers: [maintainers.aed3],

  _counties: [
    'Accomack County',
    'Albemarle County',
    'Alexandria City',
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
    'Bristol City',
    'Brunswick County',
    'Buchanan County',
    'Buckingham County',
    'Buena Vista City',
    'Campbell County',
    'Caroline County',
    'Carroll County',
    'Charles City County',
    'Charlotte County',
    'Charlottesville City',
    'Chesapeake City',
    'Chesterfield County',
    'Clarke County',
    'Colonial Heights City',
    'Covington City',
    'Craig County',
    'Culpeper County',
    'Cumberland County',
    'Danville City',
    'Dickenson County',
    'Dinwiddie County',
    'Emporia City',
    'Essex County',
    'Fairfax City',
    'Fairfax County',
    'Falls Church City',
    'Fauquier County',
    'Floyd County',
    'Fluvanna County',
    'Franklin City',
    'Franklin County',
    'Frederick County',
    'Fredericksburg City',
    'Galax City',
    'Giles County',
    'Gloucester County',
    'Goochland County',
    'Grayson County',
    'Greene County',
    'Greensville County',
    'Halifax County',
    'Hampton City',
    'Hanover County',
    'Harrisonburg City',
    'Henrico County',
    'Henry County',
    'Highland County',
    'Hopewell City',
    'Isle of Wight County',
    'James City County',
    'King and Queen County',
    'King George County',
    'King William County',
    'Lancaster County',
    'Lee County',
    'Lexington City',
    'Loudoun County',
    'Louisa County',
    'Lunenburg County',
    'Lynchburg City',
    'Madison County',
    'Manassas City',
    'Manassas Park City',
    'Martinsville City',
    'Mathews County',
    'Mecklenburg County',
    'Middlesex County',
    'Montgomery County',
    'Nelson County',
    'New Kent County',
    'Newport News City',
    'Norfolk City',
    'Northampton County',
    'Northumberland County',
    'Norton City',
    'Nottoway County',
    'Orange County',
    'Page County',
    'Patrick County',
    'Petersburg City',
    'Pittsylvania County',
    'Poquoson City',
    'Portsmouth City',
    'Powhatan County',
    'Prince Edward County',
    'Prince George County',
    'Prince William County',
    'Pulaski County',
    'Radford City',
    'Rappahannock County',
    'Richmond City',
    'Richmond County',
    'Roanoke City',
    'Roanoke County',
    'Rockbridge County',
    'Rockingham County',
    'Russell County',
    'Salem City',
    'Scott County',
    'Shenandoah County',
    'Smyth County',
    'Southampton County',
    'Spotsylvania County',
    'Stafford County',
    'Staunton City',
    'Suffolk City',
    'Surry County',
    'Sussex County',
    'Tazewell County',
    'Virginia Beach City',
    'Warren County',
    'Washington County',
    'Waynesboro City',
    'Westmoreland County',
    'Williamsburg City',
    'Winchester City',
    'Wise County',
    'Wythe County',
    'York County'
  ],

  _citiesAScounties: [
    'Alexandria',
    'Bristol',
    'Buena Vista',
    'Charlottesville',
    'Chesapeake',
    'Colonial Heights',
    'Covington',
    'Danville',
    'Emporia',
    'Fairfax',
    'Falls Church',
    'Franklin',
    'Fredericksburg',
    'Galax',
    'Hampton',
    'Harrisonburg',
    'Hopewell',
    'Lexington',
    'Lynchburg',
    'Manassas',
    'Manassas Park',
    'Martinsville',
    'Newport News',
    'Norfolk',
    'Norton',
    'Petersburg',
    'Poquoson',
    'Portsmouth',
    'Radford',
    'Richmond',
    'Roanoke',
    'Salem',
    'South Boston County',
    'Staunton',
    'Suffolk',
    'Virginia Beach',
    'Waynesboro',
    'Williamsburg',
    'Winchester'
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
        'Buena Vista City',
        'Fairfax City',
        'Franklin City',
        'Franklin County',
        'Manassas City',
        'Richmond City',
        'Richmond County',
        'Roanoke City',
        'Roanoke County'
      ];
      this.type = 'pdf';

      for (const name of this._counties) {
        let endURL = name;
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
      const data = await fetch.csv(this.url);
      this.type = 'csv';

      data.forEach(location => {
        const fullNameCounties = [
          'Buena Vista City',
          'Fairfax City',
          'Franklin City',
          'Franklin County',
          'Manassas City',
          'Richmond City',
          'Richmond County',
          'Roanoke City',
          'Roanoke County'
        ];

        if (fullNameCounties.includes(location.Locality)) {
          const name = location.Locality;
          counties.push({
            county: name,
            cases: parse.number(location['Total Cases'])
          });
        } else if (this._citiesAScounties.includes(location.Locality)) {
          location.Locality += ' City';
          const name = parse.string(location.Locality);
          counties.push({
            county: name,
            cases: parse.number(location['Total Cases'])
          });
        } else {
          const name = parse.string(geography.addCounty(location.Locality));
          counties.push({
            county: name,
            cases: parse.number(location['Total Cases'])
          });
        }
      });

      counties = geography.addEmptyRegions(counties, this._counties, 'county');
    }

    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
