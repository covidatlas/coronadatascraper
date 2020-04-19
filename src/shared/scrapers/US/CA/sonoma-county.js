import { DeprecatedError } from '../../../lib/errors.js';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Sonoma County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'https://socoemergency.org/emergency/novel-coronavirus/novel-coronavirus-in-sonoma-county/',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const $th = $('th:contains("Total in Sonoma County")');
      const $table = $th.closest('table');
      const $td = $table.find('td:last-child');
      const cases = parse.number($td.text());
      return { cases };
    },
    '2020-03-28': async function() {
      await fetch.page(this, this.url, 'default');
      throw new DeprecatedError('Sonoma switched to ArcGIS, which is handled by another scraper');
    }
  }
};

export default scraper;
