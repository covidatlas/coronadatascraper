import * as geography from '../../../shared/lib/geography/index.js';
import log from '../../../shared/lib/log.js';

const generateMultivalent = async ({ locations, featureCollection, report, options, sourceRatings }) => {
  log('⏳ Generating multivalent data...');

  const multivalentLocations = [];
  const caseFields = ['cases', 'tested', 'recovered', 'deaths', 'active', 'hospitalized', 'discharged'];
  const sourceFields = [
    'url',
    'sources',
    'maintainers',
    'curators',
    'timeseries',
    'aggregate',
    'rating',
    'priority',
    'type'
  ];
  const locationFields = ['name', 'city', 'county', 'state', 'country', 'countyId', 'stateId', 'countyId'];

  let multivalentSources = 0;
  for (const location of locations) {
    // Start with just location data
    const multivalentLocation = {};
    for (const field of locationFields) {
      if (location[field] !== undefined) {
        multivalentLocation[field] = location[field];
      }
    }

    // Everyone gets treated the same
    if (location._sources) {
      console.log(`  👥 ${geography.getName(location)} is multivalent with ${location._sources.length} sources`);
      multivalentSources++;
    } else {
      location._sources = [location];
    }

    // Slap on the real data for each source
    for (const field of caseFields) {
      multivalentLocation[field] = location._sources.map(s => s[field]);
    }

    // Slap in the sources
    delete multivalentLocation._sources;
    multivalentLocation.sources = location._sources.map(source => {
      const sourceObj = {};
      // Take only relevant fields
      for (const field of sourceFields) {
        if (source[field] !== undefined) {
          sourceObj[field] = source[field];
        }
      }
      return sourceObj;
    });

    // Strip out empty fields
    for (const field of caseFields) {
      if (multivalentLocation[field].every(a => a === undefined)) {
        delete multivalentLocation[field];
      }
    }

    multivalentLocations.push(multivalentLocation);
  }
  log('✅ Generating multivalent data %d out of %d locations', multivalentSources, Object.keys(locations).length);

  report.findPopulation = {
    numMultivalentSources: multivalentSources
  };

  return { locations, featureCollection, report, options, sourceRatings, multivalentLocations };
};

export default generateMultivalent;
