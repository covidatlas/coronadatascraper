import { join, resolve } from 'path';
import * as fs from '../../../shared/lib/fs.js';
import * as geography from '../../../shared/lib/geography/index.js';

const dataPath = join('./src/shared/vendor/');
const DC = {state: "DC", fips: "11001"};
/*
  Read FIPS codes from a CSV with correct datatypes
*/
async function readFipsFromJSON(csvPath) {
  return fs.readJSON(resolve(dataPath, csvPath));
}

async function readFipsData() {
  const fips = {
    byCity: {},
    byCounty: {
      //County FIPS taken from: https://raw.githubusercontent.com/kjhealy/fips-codes/master/county_fips_master.csv
      USA: await readFipsFromJSON('usa-county-fips.json'),
    },
    byState: {},
    byCountry: {}
  };

  return fips;
}

function expectsFipsData(location){
  return location.country === "USA" && (location.county || location.state === DC["state"]);
}

const findFips = async ({locations, featureCollection, report, options, sourceRatings}) => {
  console.log('⏳ Getting FIPS data...');

  const fips = await readFipsData();

  function getFips(location) {
    let fipsCode;
    if (location.county) {
      if (fips.byCounty[location.country]) {
        const fipsSource = fips.byCounty[location.country];
        const countyNameReplaced = location.county.replace('Parish', 'County');
        const countyNameJoined = `${location.county}, ${location.state}`;
        const countyNameReplacedJoined = `${countyNameReplaced}, ${location.state}`;
        fipsCode =
          fipsSource[location.county] ||
          fipsSource[countyNameReplaced] ||
          fipsSource[countyNameJoined] ||
          fipsSource[countyNameReplacedJoined];
      }
    }else if(location.state === DC["state"]){
      return DC["fips"];
    }

    return fipsCode;
  }

  const errors = [];

  let fipsFound = 0;
  for (const location of locations) {
    if (location["fips"] || !expectsFipsData(location)) {
      continue;
    }

    const fips = getFips(location);

    if (fips) {
      location["fips"] = fips;
      fipsFound++;
    } else {
      console.error('  ❌ %s: ?', geography.getName(location));
      errors.push(geography.getName(location));
    }
  }
  console.log('✅ Found fips data for %d out of %d locations', fipsFound, Object.keys(locations).length);

  report.findFips = {
    numLocationsWithFips: fipsFound,
    missingFips: errors
  };

  return {locations, featureCollection, report, options, sourceRatings};
};

export default findFips;
