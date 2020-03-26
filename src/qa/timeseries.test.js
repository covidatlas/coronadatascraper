import entries from './utils/qaFetch.js';
import { eachLocation } from './utils/qaUtils.js';

export default t => {
  eachLocation(t, entries, (t, _, location) => {
    t.test('no missing dates', t => {
      let lastDateStr = '';
      let lastDate;
      for (const date of Object.keys(location.dates)) {
        if (lastDate !== undefined) {
          const diff = new Date(date).getTime() - lastDate.getTime();
          const diffInDays = Math.round(diff / (1000 * 3600 * 24));

          if (diffInDays !== 1) {
            t.fail(`skip of ${diffInDays} between ${lastDateStr} and ${date}`);
          }
        }
        lastDateStr = date;
        lastDate = new Date(date);
      }
    });

    t.test('data is monotically increasing', t => {
      let lastData;
      for (const entry of Object.entries(location.dates)) {
        if (lastData !== undefined) {
          for (const key of ['cases', 'deaths', 'recovered', 'tested']) {
            if (entry[1][key] !== undefined && lastData[1][key] !== undefined) {
              t.ok(
                entry[1][key] >= lastData[1][key],
                `${key} went from ${lastData[1][key]} to ${entry[1][key]} between ${lastData[0]} and ${entry[0]}`
              );
            }
          }
        }
        lastData = entry;
      }
    });
  });
};
