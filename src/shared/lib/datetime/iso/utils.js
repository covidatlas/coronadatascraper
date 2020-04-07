import { ZonedDateTime } from '@js-joda/core';

// util functions

export const currentJsDate = () => new Date(Date.now()); // allows us to mock current date

export const currentZdt = () => ZonedDateTime.parse(currentJsDate().toISOString());

export const normalize = d => d.replace(/[\\/.]/g, '-'); // replaces slashes & dots with dashes

// truncate ISO datetime to ISO date
export const truncate = datetime =>
  datetime
    .split(' ')[0] //
    .split('T')[0];
