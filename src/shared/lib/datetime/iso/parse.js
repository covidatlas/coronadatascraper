/* eslint-disable import/prefer-default-export */
import { LocalDate } from '@js-joda/core';
import '@js-joda/timezone/dist/js-joda-timezone-10-year-range'; // minimize package size by only importing tz data for current year ±5 yrs

import { truncate, normalize } from './utils.js';
import { looksLike } from './looks-like.js';

const couldNotParseDateError = date => new Error(`datetime.parse: Could not parse '${date.toString()}' as a date`);

/**
 * Attempts to interpret the input as a date.
 * @param {Date|string} date The date to parse.
 * @returns {string} The date as an ISO-formatted string, e.g. 2020-03-16
 */
export const parse = date => {
  if (date === undefined) throw new Error('datetime.parse: Cannot parse undefined as date');
  if (date === null) throw new Error('datetime.parse: Cannot parse null as date');
  if (date === '') throw new Error('datetime.parse: Cannot parse empty string as date');

  // JS Date object
  if (date instanceof Date) date = date.toISOString();

  // String
  if (typeof date === 'string') {
    const s = truncate(normalize(date));

    // ISO date
    if (looksLike.isoDate(s)) return LocalDate.parse(s).toString();

    // YYYY-M-D
    if (looksLike.YYYYMD(s)) {
      const [y, m, d] = s.split('-').map(Number); // e.g. [2020, 3, 16]
      return LocalDate.of(y, m, d).toString();
    }

    // M-D-YYYY
    if (looksLike.MDYYYY(s)) {
      const [m, d, yyyy] = s.split('-').map(Number); // e.g. [3, 16, 2020]
      return LocalDate.of(yyyy, m, d).toString();
    }

    // M-D-YY
    if (looksLike.MDYY(s)) {
      const [m, d, yy] = s.split('-').map(Number); // e.g. [3, 16, 20]
      const yyyy = yy + 2000; // assume current century
      return LocalDate.of(yyyy, m, d).toString();
    }

    // 0: Treat zero as the beginning of unix epoch
    if (s === '0') return LocalDate.of(1970, 1, 1).toString();

    // last chance - try using js Date
    // for some values, this will return the previous day when run > GMT
    try {
      const jsdate = new Date(date);
      return truncate(jsdate.toISOString());
    } catch (err) {
      throw couldNotParseDateError(date);
    }
  }

  // Numbers
  if (typeof date === 'number') {
    // for some values, this will return the previous day when run > GMT
    try {
      const jsdate = new Date(date);
      return truncate(jsdate.toISOString());
    } catch (err) {
      throw couldNotParseDateError(date);
    }
  }

  throw couldNotParseDateError(date);
};
