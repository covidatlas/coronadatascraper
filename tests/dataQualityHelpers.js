const locations = require('../dist/locations.json');
const timeseries = require('../dist/timeseries-byLocation.json');

// returns [[locName, locObject, tsObject]]g
const buildLocationDataset = () => {
  const testData = [];
  locations.forEach(location => {
    testData.push([location.name, location, timeseries[location.name]]);
  });
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
  for (const date in tsObj.dates) {
    if (tsObj.dates[date]) {
      const data = tsObj.dates[date];
      arr.push(data[key]);
    }
  }
  return arr;
};

const locationData = buildLocationDataset();

export { locationData, isMonotonicallyIncreasing, timeSeriesToArray };
