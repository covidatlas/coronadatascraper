import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch.js';
import maintainers from '../../../lib/maintainers.js';

const scraper = {
  country: 'AUS',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'SA Government Health Department',
      name: 'SA Health',
      url: 'https://www.sahealth.sa.gov.au'
    }
  ],
  state: 'South Australia',
  type: 'paragraph',
  url:
    'https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/health+topics/health+topics+a+-+z/covid+2019/latest+updates/confirmed+and+suspected+cases+of+covid-19+in+south+australia',
  async scraper() {
    const $ = await fetch.page(this.url);
    const paragraph = $('.middle-column p:first-of-type').text();
    const { casesString } = paragraph.match(/been (?<casesString>\d+) confirmed cases/).groups;
    return {
      state: scraper.state,
      cases: parse.number(casesString)
    };
  }
};

export default scraper;
