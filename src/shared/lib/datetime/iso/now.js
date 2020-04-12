/* eslint-disable import/prefer-default-export */
import { LocalDateTime, ZoneId } from '@js-joda/core';
import '@js-joda/timezone/dist/js-joda-timezone-10-year-range'; // minimize package size by only importing tz data for current year ±5 yrs

import { currentZdt } from './utils.js';

export const now = {
  /** @returns {string} The current date and time (UTC) in ISO format. Example: `2020-03-16T23:45` */
  utc: () => {
    return `${now.at('UTC')}Z`;
  },

  /**
   * @param {string} tz The IANA label for the target timezone. Examples: `Australia/Sydney`, `America/Los_Angeles`
   * @returns {string} The current date and time at the given timezone, in ISO format. Example: `2020-03-16T23:45`
   */
  at: tz => {
    const currentZdtThere = currentZdt().withZoneSameInstant(ZoneId.of(tz));
    return LocalDateTime.from(currentZdtThere).toString();
  }
};
