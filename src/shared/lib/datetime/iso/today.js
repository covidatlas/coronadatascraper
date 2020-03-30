import { LocalDate, ZoneId } from '@js-joda/core';
import '@js-joda/timezone/dist/js-joda-timezone-10-year-range'; // minimize package size by only importing tz data for current year ±5 yrs

import { currentZdt } from './utils.js';

export const today = {
  /** @returns {string} The current date (UTC) in ISO format. Example: `2020-03-16` */
  utc: () => {
    return today.at('UTC');
  },

  /**
   * @param {string} tz The IANA label for the target timezone. Examples: `Australia/Sydney`, `America/Los_Angeles`
   * @returns {string} The current date at the given timezone, in ISO format. Example: `2020-03-16`
   */
  at: tz => {
    const currentZdtThere = currentZdt().withZoneSameInstant(ZoneId.of(tz));
    return LocalDate.from(currentZdtThere).toString();
  }
};

/** @returns {string} The current date (UTC) as an ISO string. */
export const getDate = () => today.utc();
