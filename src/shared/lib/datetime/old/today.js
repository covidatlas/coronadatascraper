/* eslint-disable import/prefer-default-export */

/*
  Get a date object offset for the current timezone
*/
export const getDate = function() {
  const date = new Date();
  const utcDate = new Date(date.toUTCString());
  utcDate.setHours(utcDate.getHours() - 7);
  return new Date(utcDate);
};
