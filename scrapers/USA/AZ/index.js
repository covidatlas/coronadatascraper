// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'AZ',
  country: 'USA',
  url: 'https://tableau.azdhs.gov/views/COVID-19Dashboard/COVID-19table?:isGuestRedirectFromVizportal=y&:embed=y',
  async _scraper() {
    const counties = [];
    return counties;
  }
};

export default scraper;
