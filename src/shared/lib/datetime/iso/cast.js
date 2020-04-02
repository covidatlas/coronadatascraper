import { ZoneId, ZonedDateTime } from '@js-joda/core';
import '@js-joda/timezone/dist/js-joda-timezone-10-year-range';

/**
 * Returns locale-cast YYYY-MM-DD from a UTC-cast 8601Z
 * @param {*} tz IANA timezone string, e.g. `America/Los_Angeles`
 * @param {*} utc ISO8601Z string, e.g. `2020-04-02T01:23:45.678Z`
 */
export default function cast(utc, tz = 'America/Los_Angeles') {
  const parsed = ZonedDateTime.parse(utc);
  const adjusted = parsed.withZoneSameInstant(ZoneId.of(tz));
  return adjusted.toString().split('T')[0];
}
