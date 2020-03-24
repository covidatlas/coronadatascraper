/* eslint-disable global-require */
let locations = [];
let timeseries = [];
try {
  locations = require('../dist/locations.json');
  timeseries = require('../dist/timeseries-byLocation.json');
} catch (err) {
  console.error('Error loading location and timeseries data');
}
/* eslint-enable global-require */

// returns [[locName, locObject, tsObject]]
const buildLocationDataset = () => {
  const testData = [];
  locations.forEach(location => {
    testData.push([location.name, location, timeseries[location.name]]);
  });
  if (testData.length === 0) {
    testData.push(['locName', {}, {}]);
  }
  return testData;
};

const isMonotonicallyIncreasing = arr => {
  return arr.every((element, idx, array) => {
    if (element && array[idx - 1]) {
      return element >= array[idx - 1];
    }
    return true;
  });
};

const timeSeriesToArray = (tsObj, key) => {
  const arr = [];
  if (tsObj && tsObj.dates) {
    for (const date in tsObj.dates) {
      if (tsObj.dates[date]) {
        const data = tsObj.dates[date];
        arr.push(data[key]);
      }
    }
  }
  return arr;
};

const locationData = buildLocationDataset();

export { locationData, isMonotonicallyIncreasing, timeSeriesToArray };
