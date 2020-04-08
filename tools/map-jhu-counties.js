import * as turf from '../src/shared/lib/geography/turf.js';
import * as fs from '../src/shared/lib/fs.js';

const LAT = 'Lat';
const LONG = 'Long';
const STATE = 'Province/State';

async function findNameMapping() {
  const jhuData = await fs.readCSV('cache/e20883430a9a4c7502d0a9618e49c1a9.csv');
  const usCountyData = await fs.readJSON('./coronavirus-data-sources/geojson/usa-counties.json');

  const countyMap = {};

  // eslint-disable-next-line no-labels
  locationLoop: for (const location of jhuData) {
    if (!location[STATE] || !location[STATE].includes(',')) {
      continue;
    }

    let point;
    if (location[LAT] !== undefined && location[LONG] !== undefined) {
      point = turf.point([location[LONG], location[LAT]]);
    }

    if (point) {
      // Search within features
      for (const feature of usCountyData.features) {
        if (feature.geometry) {
          const poly = turf.feature(feature.geometry);
          if (turf.booleanPointInPolygon(point, poly)) {
            countyMap[location[STATE]] = feature.properties.name;
            // eslint-disable-next-line no-labels
            continue locationLoop;
          }
        }
      }
    } else {
      console.log('⚠️ Fuck, no coordinates for %s', location[STATE]);
    }
  }

  fs.writeJSON('./dist/jhuUSCountyMap.json', countyMap);
}

findNameMapping();
