import usStates from '../../vendor/usa-states.json';
import iso2Codes from 'country-levels/iso2.json';
import assert from 'assert';

// eslint-disable-next-line import/prefer-default-export
export const calculateScraperTz = async location => {
  //  calculate a location's timezone, before scraping
  //  this means it can only use static values, like location.country and location.state

  if (location.scraperTz) {
    return location.scraperTz;
  }

  const { country, state } = location;

  if (country === 'USA') {
    assert(!usStates[state], `Long form of state name used: ${state}, ${location._path}`);
    const stateCode = `US-${state}`;
    const stateData = iso2Codes[stateCode];
    assert(stateData, `State data not found for ${state}, ${location._path}`);
    console.log(stateData);
  }
};
