import { dateIsBefore } from './compare.js';
import { getDate } from './today.js';

export const scrapeDate = () => process.env.SCRAPE_DATE;

/*
  Check if the date we're scraping is before the passed date
*/
export const scrapeDateIsBefore = function(date) {
  let scrapeDate = getDate();
  if (process.env.SCRAPE_DATE) {
    scrapeDate = new Date(process.env.SCRAPE_DATE);
  }
  return dateIsBefore(scrapeDate, new Date(date));
};

/*
  Check if the date we're scraping is after the passed date
*/
export const scrapeDateIsAfter = function(date) {
  let scrapeDate = getDate();
  if (process.env.SCRAPE_DATE) {
    scrapeDate = new Date(process.env.SCRAPE_DATE);
  }
  return dateIsBefore(new Date(date), scrapeDate);
};

/*
  Check if the date we're scraping is equal to the passed date
*/
export const scrapeDateIs = function(date) {
  let scrapeDate = getDate();
  if (process.env.SCRAPE_DATE) {
    scrapeDate = new Date(process.env.SCRAPE_DATE);
  }

  const compareDate = new Date(date);
  scrapeDate.setHours(0, 0, 0, 0);
  compareDate.setHours(0, 0, 0, 0);

  return compareDate.getTime() === scrapeDate.getTime();
};
