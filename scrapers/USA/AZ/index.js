import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'AZ',
  country: 'USA',
  url: 'https://tableau.azdhs.gov/views/COVID-19Dashboard/COVID-19table?%3AisGuestRedirectFromVizportal=y&%3Aembed=y',
  type: 'csv',
  aggregate: 'county',
  async scraper() {
    // Get the Tableau chart
    const $ = await fetch.headless(this.url);

    // Pull out our session id from the json stuffed inside the textarea
    const textArea = $('textarea#tsConfigContainer').text();
    const j = JSON.parse(textArea);
    const sessionId = j.sessionid;

    // Fetch the magic URL with our current session ID
    const url = `https://tableau.azdhs.gov/vizql/w/COVID-19Dashboard/v/COVID-19table/vud/sessions/${sessionId}/views/8275719771277684273_9753144220671897612?csv=true&summary=true`;

    // Parse the tab separated values file that comes back
    const data = await fetch.tsv(url);

    const counties = [];

    for (const row of data) {
      const county = geography.addCounty(row.County);
      const cases = parse.number(row.Count);

      counties.push({
        county,
        cases
      });
    }

    counties.push(transform.sumData(counties));
    return counties;
  }
};

export default scraper;
