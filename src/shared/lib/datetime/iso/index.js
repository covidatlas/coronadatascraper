import { dateIsBefore, dateIsBeforeOrEqualTo } from './compare.js';
import { getYYYYMD, getYYYYMMDD, getDDMMYYYY, getMDYY, getMDYYYY, getMonthDYYYY } from './format.js';
import { scrapeDate, scrapeDateIsBefore, scrapeDateIsAfter, scrapeDateIs } from './scrape-date.js';
import { getDate, today } from './today.js';
import { now } from './now.js';
import { parse } from './parse.js';
import { looksLike } from './looks-like.js';

export default {
  dateIsBefore,
  dateIsBeforeOrEqualTo,
  getDate,
  getDDMMYYYY,
  getMDYY,
  getMDYYYY,
  getMonthDYYYY,
  getYYYYMD,
  getYYYYMMDD,
  looksLike,
  now,
  parse,
  scrapeDate,
  scrapeDateIs,
  scrapeDateIsAfter,
  scrapeDateIsBefore,
  today
};
