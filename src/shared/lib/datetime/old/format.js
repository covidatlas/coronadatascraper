import { getDate } from './today.js';

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
  Get date formatted in Month_D_YYYY
*/
export const getMonthDYYYY = function(date = getDate(), sep = '_') {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const months = [
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

  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate().toString();
  const year = date.getUTCFullYear().toString();

  return `${month}${sep}${day}${sep}${year}`;
};
