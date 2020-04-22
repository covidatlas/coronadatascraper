import template from '../nyt-counties.js';

const scraper = {
  ...template,
  state: 'iso2:US-NY',
  priority: 1
};

export default scraper;
