import assert from 'assert';
import iso2Codes from 'country-levels/iso2.json';
import usStates from '../../vendor/usa-states.json';

// eslint-disable-next-line import/prefer-default-export
export const calculateScraperTz = async location => {
  //  calculate a location's timezone, before scraping
  //  this means it can only use static values, like location.country and location.state

  // some special locations like JHU and NYT have this specified so we pass it on
  if (location.scraperTz) {
    return location.scraperTz;
  }

  const { country, state } = location;

  if (country === 'iso1:US') {
    assert(!usStates[state], `calculateScraperTz: Long form of state name used: ${state}, ${location._path}`);
    const stateCode = `US-${state}`;
    const stateData = iso2Codes[stateCode];
    assert(stateData, `calculateScraperTz: State data not found for ${state}, ${location._path}`);
    assert(stateData.timezone, `calculateScraperTz: State missing timezone informatin ${state}`);
    return stateData.timezone;
  }

  return 'UTC';
};
