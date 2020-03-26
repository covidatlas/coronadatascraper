/* eslint-disable camelcase */

import { ZonedDateTime, LocalDateTime, LocalDate, nativeJs, ZoneId } from '@js-joda/core';
import '@js-joda/timezone';

// util functions
const truncate = d => d.slice(0, 10);
const normalize = d => d.replace(/[\\/.]/g, '-');
const currentJsDate = () => nativeJs(new Date(Date.now())); // allows us to mock current date
const currentZdt = () => ZonedDateTime.from(currentJsDate());

// These don't check that string is a valid date, just that it has the right form
export const looksLike = {
  isoDate: s => /^\d{4}-\d{2}-\d{2}$/.test(s), // YYYY-DD-MM
  YYYYMMDD: s => /^\d{4}-\d{1,2}-\d{1,2}$/.test(s) // YYYY-D-M
};

export const parse = d => {
  // JS Date object
  if (d instanceof Date) return LocalDate.from(nativeJs(d));
  // String
  if (typeof d === 'string') {
    const s = truncate(normalize(d));
    if (looksLike.isoDate(s)) return LocalDate.parse(s).toString();
    if (looksLike.YYYYMMDD(s)) {
      const ymd = s.split('-');
      return LocalDate.of(ymd);
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
