import moment from 'moment-timezone';

const DEFAULT_TIMEZONE = 'America/Los_Angeles'; // Pacific Standard Time

/**
 * Get current date in milliseconds since Epoch
 */
function getDate() {
  return Date.now();
}

/**
 * Formats a date in YYYY-MM-DD. Allows for the customization of the separator.
 * @param {number} date UTC date in milliseconds since Epoch, defaults to current date
 * @param {string} sep Separator to use, defaults to "-"
 */
function getYYYYMMDD(date = getDate(), sep = '-') {
  return moment(date)
    .tz(DEFAULT_TIMEZONE)
    .format(`YYYY${sep}MM${sep}DD`);
}

/**
 * Compares two dates. Returns true if the **date** element of `a` is before `b`.
 * @param {number} a UTC date is milliseconds since Epoch
 * @param {number} b UTC date in milliseconds since Epoch
 */
function isDateBefore(a, b) {
  const yearA = moment(a)
    .tz(DEFAULT_TIMEZONE)
    .year();
  const yearB = moment(b)
    .tz(DEFAULT_TIMEZONE)
    .year();
  const dayOfYearA = moment(a)
    .tz(DEFAULT_TIMEZONE)
    .dayOfYear();
  const dayOfYearB = moment(b)
    .tz(DEFAULT_TIMEZONE)
    .dayOfYear();

  return yearA < yearB || (yearA === yearB && dayOfYearA < dayOfYearB);
}

export { getDate, getYYYYMMDD, isDateBefore };
