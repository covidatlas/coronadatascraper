import { ZonedDateTime, LocalDate, nativeJs, ZoneId } from '@js-joda/core';
import '@js-joda/timezone';

export const currentDateHere = () => LocalDate.now().toString();

export const currentDateAtTimezone = tz => LocalDate.from(ZonedDateTime.now(ZoneId.of(tz)));

export const currentDateToUTC = () => LocalDate.from(ZonedDateTime.now(ZoneId.UTC));

export const dateAtTimezone = (d, tz) => LocalDate.of(ZonedDateTime.at(LocalDate.parse(d), ZoneId.of(tz)));

export const dateToUTC = d => LocalDate.of(ZonedDateTime.at(LocalDate.parse(d), ZoneId.UTC));

export const parse = d => {
  // JS Date object
  if (d instanceof Date) return LocalDate.from(nativeJs(d));
  // strings in weird formats?
  return d;
};
