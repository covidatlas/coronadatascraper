import { dateIsBefore, dateIsBeforeOrEqualTo } from './compare.js';
import { getYYYYMD, getYYYYMMDD, getDDMMYYYY, getMDYY, getMDYYYY, getMonthDYYYY } from './format.js';
import { scrapeDate, scrapeDateIsBefore, scrapeDateIsAfter, scrapeDateIs } from './scrape-date.js';
import { getDate } from './today.js';

import iso from './iso/index.js';

const datetime = process.env.USE_ISO_DATETIME
  ? {
      ...iso,
      iso
    }
  : {
      getDate,
      getYYYYMD,
      getYYYYMMDD,
      getDDMMYYYY,
      getMDYY,
      getMDYYYY,
      getMonthDYYYY,
      dateIsBefore,
      dateIsBeforeOrEqualTo,
      scrapeDate,
      scrapeDateIsBefore,
      scrapeDateIsAfter,
      scrapeDateIs,
      iso
    };

export default datetime;
