import * as parse from '../../../lib/parse.js';
import * as fetch from '../../../lib/fetch.js';

const scraper = {
  country: 'AUS',
  state: 'South Australia',
  url:
    'https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/health+topics/health+topics+a+-+z/covid+2019/latest+updates/confirmed+and+suspected+cases+of+covid-19+in+south+australia',
  type: 'paragraph',
  priority: 1,
  async scraper() {
    const $ = await fetch.page(this.url);
    const paragraph = $('.middle-column p:first-of-type').text();
    const { casesString } = paragraph.match(/been (?<casesString>\d+) confirmed cases/).groups;
    const cases = parse.number(casesString);
    return { state: scraper.state, cases };
  }
};

export default scraper;
