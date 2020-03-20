/*
  Get a date object offset for the current timezone
*/
function getDate() {
  const date = new Date();
  const utcDate = new Date(date.toUTCString());
  utcDate.setHours(utcDate.getHours() - 7);
  return new Date(utcDate);
}

/*
  Get date formatted in YYYY-M-D
*/
function getYYYYMD(date = getDate(), sep = '-') {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();

  return `${year}${sep}${month}${sep}${day}`;
}

/*
  Get date formatted in YYYY-M-D
*/
function getYYYYMMDD(date = getDate(), sep = '-') {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date
    .getUTCDate()
    .toString()
    .padStart(2, '0');
  const year = date.getUTCFullYear();

  return `${year}${sep}${month}${sep}${day}`;
}

/*
  Get date formatted in DD-MM-YYYY
*/
function getDDMMYYYY(date = getDate(), sep = '-') {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date
    .getUTCDate()
    .toString()
    .padStart(2, '0');
  const year = date.getUTCFullYear();

  return `${day}${sep}${month}${sep}${year}`;
}

/*
  Get date formatted in M/D/YYYY
*/
function getMDYYYY(date = getDate(), sep = '/') {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();

  return `${month}${sep}${day}${sep}${year}`;
}

/*
  Get date formatted in M/D/YY
*/
function getMDYY(date = getDate(), sep = '/') {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const year = date
    .getUTCFullYear()
    .toString()
    .substr(2, 2);

  return `${month}${sep}${day}${sep}${year}`;
}

/*
  Check of the *date* of the passed date is before the other passed date
  *sigh*
*/
function dateIsBefore(a, b) {
  a = new Date(a);
  b = new Date(b);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return a.getTime() < b.getTime();
}

/*
  Check of the *date* of the passed date is before or equal to the other passed date
  *sigh*
*/
function dateIsBeforeOrEqualTo(a, b) {
  a = new Date(a);
  b = new Date(b);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return a.getTime() < b.getTime() || a.getTime() === b.getTime();
}

/*
  Check if the date we're scraping is before the passed date
*/
function scrapeDateIsBefore(date) {
  let scrapeDate = getDate();
  if (process.env.SCRAPE_DATE) {
    scrapeDate = new Date(process.env.SCRAPE_DATE);
  }
  return dateIsBefore(scrapeDate, new Date(date));
}

/*
  Check if the date we're scraping is after the passed date
*/
function scrapeDateIsAfter(date) {
  let scrapeDate = getDate();
  if (process.env.SCRAPE_DATE) {
    scrapeDate = new Date(process.env.SCRAPE_DATE);
  }
  return dateIsBefore(new Date(date), scrapeDate);
}

/*
  Check if the date we're scraping is equal to the passed date
*/
function scrapeDateIs(date) {
  let scrapeDate = getDate();
  if (process.env.SCRAPE_DATE) {
    scrapeDate = new Date(process.env.SCRAPE_DATE);
  }

  const compareDate = new Date(date);
  scrapeDate.setHours(0, 0, 0, 0);
  compareDate.setHours(0, 0, 0, 0);

  return compareDate.getTime() === scrapeDate.getTime();
}

export { getDate, getYYYYMD, getYYYYMMDD, getMDYYYY, getMDYY, getDDMMYYYY, dateIsBefore, scrapeDateIsBefore, scrapeDateIsAfter, scrapeDateIs, dateIsBeforeOrEqualTo };
