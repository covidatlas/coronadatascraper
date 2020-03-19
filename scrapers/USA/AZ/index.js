/*
  Each scraper must return the following object or an array of the following objects:

  {
    city: String†,
    county: String†,   // County or region name, complete with "County" or "Parish" at the end
    country: String†,  // ISO 3166-1 alpha-3 country code
    cases: Integer,    // Confirmed cases (including presumptive)
    deaths: Integer,
    recovered: Integer,
    tested: Integer
  }

  † Optional, not required if provided in the main scraper definition
*/

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
