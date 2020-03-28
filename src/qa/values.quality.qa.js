import entries from './utils/qa-fetch.js';
import { eachLocation, eachDate } from './utils/qa-utils.js';

export default t => {
  eachLocation(t, entries, (t, _, location) => {
    eachDate(t, location, (t, _, data) => {
      t.test('data is in the correct range', t => {
        for (const key of ['cases', 'deaths', 'recovered', 'tested', 'active']) {
          if (data[key] !== undefined) {
            t.notOk(Number.isNaN(data[key]), `${key} is NaN`);
            t.ok(Number.isInteger(data[key]), `${key} is not an integer`);
            t.ok(data[key] >= 0, `${key} is negative`);
          }
        }
      });
      t.test('(deaths | recovered) <= cases <= tested', t => {
        if (data.cases !== undefined) {
          if (data.deaths) {
            t.ok(data.deaths <= data.cases, `death: ${data.deaths} > cases: ${data.cases}`);
          }
          if (data.recovered !== undefined) {
            t.ok(data.recovered <= data.cases, `recovered: ${data.recovered} > cases: ${data.cases}`);
          }
          if (data.tested !== undefined) {
            t.ok(data.cases <= data.tested, `cases: ${data.cases} > tested: ${data.tested}`);
          }
        }
      });
    });
  });
};
