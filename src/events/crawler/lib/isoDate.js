/* eslint-disable camelcase */

import { ZonedDateTime, LocalDateTime, LocalDate, ZoneId } from '@js-joda/core';
import '@js-joda/timezone/dist/js-joda-timezone-10-year-range'; // minimize package size by only importing tz data for current year ±5 yrs

// util functions
const currentJsDate = () => new Date(Date.now()); // allows us to mock current date
const currentZdt = () => ZonedDateTime.parse(currentJsDate().toISOString());
const normalize = d => d.replace(/[\\/.]/g, '-');
const truncate = d => d.slice(0, 10); // truncate ISO datetime to ISO date

// These don't check that string is a valid date, just that it has the right form
export const looksLike = {
  isoDate: s => /^\d{4}-\d{2}-\d{2}$/.test(s), // YYYY-DD-MM
  YYYYMD: s => /^\d{4}-\d{1,2}-\d{1,2}$/.test(s) // YYYY-D-M
};

export const parse = d => {
  // JS Date object
  if (d instanceof Date) d = d.toISOString();
  // String
  if (typeof d === 'string') {
    const s = truncate(normalize(d));
    // ISO date
    if (looksLike.isoDate(s)) return LocalDate.parse(s).toString();
    // Other formats
    if (looksLike.YYYYMD(s)) {
      const ymd = s.split('-'); // e.g. [2020,3,16]
      return LocalDate.of(...ymd).toString();
    }
  }
};

export const today = {
  here: () => {
    return LocalDate.from(currentZdt()).toString();
  },
  at: tz => {
    const currentZdtThere = currentZdt().withZoneSameInstant(ZoneId.of(tz));
    return LocalDate.from(currentZdtThere).toString();
  }
};

export const now = {
  here: () => {
    return LocalDateTime.from(currentZdt()).toString();
  },
  at: tz => {
    const currentZdtThere = currentZdt().withZoneSameInstant(ZoneId.of(tz));
    return LocalDateTime.from(currentZdtThere).toString();
  }
};

export const systemTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
