/*
  Get a date object offset for the current timezone
*/
export const getDate = function() {
  const date = new Date();
  const utcDate = new Date(date.toUTCString());
  utcDate.setHours(utcDate.getHours() - 7);
  return new Date(utcDate);
};

/*
  Get date formatted in YYYY-M-D
*/
export const getYYYYMD = function(date = getDate(), sep = '-') {
  let localDate = date;
  if (typeof localDate === 'string') {
    localDate = new Date(localDate);
  }
  const month = localDate.getUTCMonth() + 1;
  const day = localDate.getUTCDate();
  const year = localDate.getUTCFullYear();

  return `${year}${sep}${month}${sep}${day}`;
};

/*
  Get date formatted in YYYY-M-D
*/
export const getYYYYMMDD = function(date = getDate(), sep = '-') {
  let localDate = date;
  if (typeof localDate === 'string') {
    localDate = new Date(localDate);
  }
  const month = (localDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = localDate
    .getUTCDate()
    .toString()
    .padStart(2, '0');
  const year = localDate.getUTCFullYear();

  return `${year}${sep}${month}${sep}${day}`;
};

/*
  Get date formatted in DD-MM-YYYY
*/
export const getDDMMYYYY = function(date = getDate(), sep = '-') {
  let localDate = date;
  if (typeof localDate === 'string') {
    localDate = new Date(localDate);
  }
  const month = (localDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = localDate
    .getUTCDate()
    .toString()
    .padStart(2, '0');
  const year = localDate.getUTCFullYear();

  return `${day}${sep}${month}${sep}${year}`;
};

/*
  Get date formatted in M/D/YYYY
*/
export const getMDYYYY = function(date = getDate(), sep = '/') {
  let localDate = date;
  if (typeof localDate === 'string') {
    localDate = new Date(localDate);
  }
  const month = localDate.getUTCMonth() + 1;
  const day = localDate.getUTCDate();
  const year = localDate.getUTCFullYear();

  return `${month}${sep}${day}${sep}${year}`;
};

/*
  Get date formatted in M/D/YY
*/
export const getMDYY = function(date = getDate(), sep = '/') {
  let localDate = date;
  if (typeof localDate === 'string') {
    localDate = new Date(localDate);
  }
  const month = localDate.getUTCMonth() + 1;
  const day = localDate.getUTCDate();
  const year = localDate
    .getUTCFullYear()
    .toString()
    .substr(2, 2);

  return `${month}${sep}${day}${sep}${year}`;
};

/*
  Check of the *date* of the passed date is before the other passed date
  *sigh*
*/
export const dateIsBefore = function(a, b) {
  let localA = a;
  let localB = b;
  localA = new Date(localA);
  localB = new Date(localB);
  localA.setHours(0, 0, 0, 0);
  localB.setHours(0, 0, 0, 0);
  return localA.getTime() < localB.getTime();
};

/*
  Check of the *date* of the passed date is before or equal to the other passed date
  *sigh*
*/
export const dateIsBeforeOrEqualTo = function(a, b) {
  let localA = a;
  let localB = b;
  localA = new Date(localA);
  localB = new Date(localB);
  localA.setHours(0, 0, 0, 0);
  localB.setHours(0, 0, 0, 0);
  return localA.getTime() < localB.getTime() || localA.getTime() === localB.getTime();
};

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
