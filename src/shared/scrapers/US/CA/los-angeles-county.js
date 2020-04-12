import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

const scraper = {
  country: 'iso1:US',
  county: 'Los Angeles County',
  maintainers: [maintainers.jbencina, maintainers.camjc],
  sources: [
    {
      description: 'County of Los Angeles Public Health',
      name: 'County of Los Angeles Public Health',
      url: 'http://www.publichealth.lacounty.gov'
    }
  ],
  state: 'CA',
  type: 'table',
  url: 'http://www.publichealth.lacounty.gov/media/Coronavirus/js/casecounter.js',
  scraper: {
    '0': async function() {
      const $ = await fetch.page('http://www.publichealth.lacounty.gov/media/Coronavirus/');
      return {
        cases: parse.number(
          $('.counter')
            .first()
            .text()
        ),
        deaths: parse.number(
          $('.counter')
            .last()
            .text()
        )
      };
    },
    '2020-03-27': async function() {
      const $ = await fetch.page(this.url);
      const { content } = JSON.parse($.text().match(/data = (?<json>[\S\s]+?);/).groups.json);
      return {
        cases: parse.number(content.count),
        deaths: parse.number(content.death)
      };
    }
  }
};

export default scraper;
