import { parse } from './parse.js';
import { getYYYYMMDD } from './format.js';

/** @returns {string} The value of the SCRAPE_DATE environment variable, as an ISO date */
export const scrapeDate = () => (process.env.SCRAPE_DATE ? parse(process.env.SCRAPE_DATE) : undefined);

/**
 * @param {string|Date} d The date to compare to the scrape date.
 * @returns {boolean} true if the date is earlier than the scrape date.
 */
export const scrapeDateIsBefore = d => (scrapeDate() ? scrapeDate() : getYYYYMMDD()) < parse(d);

/**
 * @param {string|Date} d The date to compare to the scrape date.
 * @returns {boolean} true if the date is later than the scrape date.
 */
export const scrapeDateIsAfter = d => (scrapeDate() ? scrapeDate() : getYYYYMMDD()) > parse(d);

/**
 * @param {string|Date} d The date to compare to the scrape date.
 * @returns {boolean} true if the date is equal to the scrape date.
 */
export const scrapeDateIs = d => (scrapeDate() ? scrapeDate() : getYYYYMMDD()) === parse(d);
