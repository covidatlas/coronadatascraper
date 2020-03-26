import entries from './utils/qaFetch.js';
import { eachLocation, eachDate } from './utils/qaUtils.js';

export default t => {
  eachLocation(t, entries, (t, _, location) => {
    eachDate(t, location, (t, _, data) => {
      t.test('data is in the correct range', t => {
        for (const key of ['cases', 'deaths', 'recovered', 'tested', 'active']) {
          if (data[key] !== undefined) {
            t.notOk(Number.isNaN(data[key]));
            t.ok(Number.isInteger(data[key]));
            t.ok(data[key] >= 0);
          }
        }
      });
      t.test('deaths <= cases <= tested', t => {
        if (data.deaths) {
          t.ok(data.deaths <= data.cases);
        }
        if (data.tested) {
          t.ok(data.cases <= data.tested);
        }
      });
    });
  });
};
