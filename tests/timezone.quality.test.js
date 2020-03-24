import { locationData } from './dataQualityHelpers.js';

// simple test for demonstration purposes
test.each(locationData)('%s: location tz is defined', (locName, locObj) => {
  if ('tz' in locObj) {
    expect(locObj.tz[0]).toBeDefined();
  }
});
