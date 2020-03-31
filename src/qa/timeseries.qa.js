import entries from './utils/qa-fetch.js';
import { eachLocation } from './utils/qa-utils.js';

import * as datetime from '../shared/lib/datetime.js';

export default t => {
  eachLocation(t, entries, (t, _, location) => {
    t.test('no missing dates', t => {
      let lastDateStr = '';
      let lastDate;

      for (const date of Object.keys(location.dates).filter(
        date => !datetime.dateIsBeforeOrEqualTo(date, '2020-03-20')
      )) {
        if (lastDate !== undefined) {
          t.test(`d>${lastDateStr}`, t => {
            const diff = new Date(date).getTime() - lastDate.getTime();
            const diffInDays = Math.round(diff / (1000 * 3600 * 24));

            if (diffInDays !== 1) {
              t.fail(`skip of ${diffInDays} between ${lastDateStr} and ${date}`);
            }
          });
        }
        lastDateStr = date;
        lastDate = new Date(date);
      }
    });

    // Once we have >50 cases, they better keep changing every day or else
    // we are probably reading from a stale data source. With 1.2 growth factor,
    // we would expect ~10 new cases per day.
    t.test('numbers should change each day', t => {
      let lastData;
      for (const entry of Object.entries(location.dates)) {
        if (lastData !== undefined) {
          t.test(`d>${lastData[0]}`, t => {
            if (entry[1].cases > 100 && entry[1].cases === lastData[1].cases) {
              t.fail(`${entry[1].cases} cases did not change between ${lastData[0]} and ${entry[0]}`);
            }
          });
        }
        lastData = entry;
      }
    });

    t.test('data is monotically increasing', t => {
      let lastData;
      for (const entry of Object.entries(location.dates)) {
        if (lastData !== undefined) {
          for (const key of ['cases', 'deaths', 'recovered', 'tested']) {
            if (entry[1][key] !== undefined && lastData[1][key] !== undefined) {
              t.test(`d>${lastData[0]}`, t => {
                t.ok(
                  lastData[1][key] - entry[1][key] < 3,
                  `${key} went from ${lastData[1][key]} to ${entry[1][key]} between ${lastData[0]} and ${entry[0]}`
                );
              });
            }
          }
        }
        lastData = entry;
      }
    });

    t.test('data does not drop to zero', t => {
      let lastData;
      for (const entry of Object.entries(location.dates)) {
        if (lastData !== undefined) {
          for (const key of ['cases', 'deaths', 'recovered', 'tested']) {
            if (lastData[1][key] > 0) {
              t.test(`d>${lastData[0]}`, t => {
                t.ok(
                  entry[1][key] !== 0,
                  `${key} went from ${lastData[1][key]} to ${entry[1][key]} between ${lastData[0]} and ${entry[0]}`
                );
              });
            }
          }
        }
        lastData = entry;
      }
    });
  });
};
