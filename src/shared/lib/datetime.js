import { DateTimeFormatter, ZonedDateTime, LocalDateTime, LocalDate, ZoneId } from '@js-joda/core';
import '@js-joda/timezone/dist/js-joda-timezone-10-year-range'; // minimize package size by only importing tz data for current year ±5 yrs

// util functions

const currentJsDate = () => new Date(Date.now()); // allows us to mock current date

const currentZdt = () => ZonedDateTime.parse(currentJsDate().toISOString());

const normalize = d => d.replace(/[\\/.]/g, '-'); // replaces slashes & dots with dashes

// truncate ISO datetime to ISO date
const truncate = datetime =>
  datetime
    .split(' ')[0] //
    .split('T')[0];

const dateTester = pattern => {
  /**
   * Checks that a string matches the pattern given. Doesn't check that string is a valid date,
   * just that it has this form.
   * @param {string} s The string to check
   * @returns {boolean} true if the given string matches the pattern for an ISO date (YYYY-MM-DD).
   */
  const tester = s => pattern.test(normalize(s));
  return tester;
};

export const looksLike = {
  isoDate: dateTester(/^\d{4}-\d{2}-\d{2}$/),
  YYYYMD: dateTester(/^\d{4}-\d{1,2}-\d{1,2}$/),
  MDYYYY: dateTester(/^\d{1,2}-\d{1,2}-\d{4}$/),
  MDYY: dateTester(/^\d{1,2}-\d{1,2}-\d{2}$/)
};

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
  }
  throw new Error(`datetime.parse: Could not parse '${date.toString()}' as a date`);
};

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

export const now = {
  /** @returns {string} The current date and time (UTC) in ISO format. Example: `2020-03-16T23:45` */
  utc: () => {
    return now.at('UTC');
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

/** @returns {string} The current date (UTC) as an ISO string. */
export const getDate = () => today.utc();

/**
 * @param {string} pattern using [SimpleDateFormat](http://js-joda.github.io/js-joda/manual/formatting.html#format-patterns) codes
 * @param {string=} defaultSeparator the separator used in the pattern provided (can be replaced by caller)
 * @returns A formatting function that takes a date and an optional separator, and returns a string
 */
const buildFormatter = (pattern, defaultSeparator = '-') => {
  /**
   * @param {string|Date} date The date to format. Defaults to the current date.
   * @param {string=} separator The separator to use instead of the default
   * @returns {string} The formatted date
   */
  const formatterFunction = (date = today.utc(), separator = defaultSeparator) => {
    const separatorRegex = new RegExp(defaultSeparator, 'g');
    const patternWithSeparator = pattern.replace(separatorRegex, separator);
    const formatter = DateTimeFormatter.ofPattern(patternWithSeparator);
    const isoDate = parse(date);
    return LocalDate.parse(isoDate).format(formatter);
  };
  return formatterFunction;
};

export const getYYYYMMDD = buildFormatter('yyyy-MM-dd');
export const getYYYYMD = buildFormatter('yyyy-M-d');
export const getDDMMYYYY = buildFormatter('dd-MM-yyyy');
export const getMDYYYY = buildFormatter('M/d/yyyy', '/');
export const getMDYY = buildFormatter('M/d/yy', '/');

/**
 * @param {string|Date} date The date to format. Defaults to the current date.
 * @param {string} [separator='_'] The separator to use instead of the default
 * @returns The formatted date
 */
export const getMonthDYYYY = (date = today.utc(), sep = '_') => {
  // not worth bringing in @js-joda/locale_en just for this, so we'll keep this one artisanal
  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  const isoDate = parse(date);
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${MONTHS[m - 1]}${sep}${d}${sep}${y}`;
};

/**
 * @param {string|Date} a The first date
 * @param {string|Date} b The second date
 * @returns {boolean} true if the first date is earlier than the second date
 */
export const dateIsBefore = (a, b) => parse(a) < parse(b);

/**
 * @param {string|Date} a The first date
 * @param {string|Date} b The second date
 * @returns {boolean} true if the first date is earlier than or equal to the second date
 */
export const dateIsBeforeOrEqualTo = (a, b) => parse(a) <= parse(b);

/** @returns {string} The value of the SCRAPE_DATE environment variable, as an ISO date */
export const scrapeDate = () => (process.env.SCRAPE_DATE ? parse(process.env.SCRAPE_DATE) : undefined);

/**
 * @param {string|Date} d The date to compare to the scrape date.
 * @returns {boolean} true if the date is earlier than the scrape date.
 */
export const scrapeDateIsBefore = d => scrapeDate() < parse(d);

/**
 * @param {string|Date} d The date to compare to the scrape date.
 * @returns {boolean} true if the date is later than the scrape date.
 */
export const scrapeDateIsAfter = d => scrapeDate() > parse(d);

/**
 * @param {string|Date} d The date to compare to the scrape date.
 * @returns {boolean} true if the date is equal to the scrape date.
 */
export const scrapeDateIs = d => parse(d) === scrapeDate();
