import path from 'path';
import * as fs from '../lib/fs.js';
import * as transform from '../lib/transform.js';
import turf from '@turf/turf';

let LAT = 'Lat';
let LONG = 'Long';
let STATE = 'Province/State';
let COUNTRY = 'Country/Region';

async function findNameMapping() {
  let jhuData = await fs.readCSV('cache/e20883430a9a4c7502d0a9618e49c1a9.csv');
  const usCountyData = await fs.readJSON('./coronavirus-data-sources/geojson/usa-counties.json');

  let countyMap = {};

  locationLoop: for (let location of jhuData) {
    if (!location[STATE] || location[STATE].indexOf(',') === -1) {
      continue;
    }

    let point;
    if (location[LAT] !== undefined && location[LONG] !== undefined) {
      point = turf.point([location[LONG], location[LAT]]);
    }

    if (point) {
      // Search within features
      for (let feature of usCountyData.features) {
        if (point && feature.geometry) {
          let poly = turf.feature(feature.geometry);
          if (turf.booleanPointInPolygon(point, poly)) {
            countyMap[location[STATE]] = feature.properties.name;
            continue locationLoop;
          }
        }
      }
    }
    else {
      console.log('⚠️ Fuck, no coordinates for %s', location[STATE]);
    }
  }

  fs.writeJSON('./dist/jhuUSCountyMap.json', countyMap);
}

findNameMapping();
