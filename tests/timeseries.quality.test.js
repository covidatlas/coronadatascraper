import { locationData, isMonotonicallyIncreasing, timeSeriesToArray } from './dataQualityHelpers.js';

test.each(locationData)('%s: deaths <= cases <= tested', (locName, locObj, tsObj) => {
  for (const date in tsObj.dates) {
    if (tsObj.dates[date]) {
      const data = tsObj.dates[date];
      if (data.deaths) {
        expect(data.deaths).toBeLessThanOrEqual(data.cases);
      }
      if (data.tested) {
        expect(data.cases).toBeLessThanOrEqual(data.tested);
      }
    }
  }
});

test.each(locationData)('%s: cases should monotonically increase', (locName, locObj, tsObj) => {
  const cases = timeSeriesToArray(tsObj, 'cases');
  const isMonotonic = isMonotonicallyIncreasing(cases);
  expect(isMonotonic).toBeTruthy();
});

test.each(locationData)('%s: deaths should monotonically increase', (locName, locObj, tsObj) => {
  const deaths = timeSeriesToArray(tsObj, 'deaths');
  const isMonotonic = isMonotonicallyIncreasing(deaths);
  expect(isMonotonic).toBeTruthy();
});
