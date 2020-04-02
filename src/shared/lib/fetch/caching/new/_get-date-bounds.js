import sorter from './_sorter.js';
import getLocalDateFromFilename from './_get-local-date-from-filename.js';

/**
 * Takes a cached filename, returns date boundaries
 */
export default function getDateBounds(files, tz) {
  const sorted = sorter(files); // jic
  const earliest = getLocalDateFromFilename(sorted[0], tz);
  const latest = getLocalDateFromFilename(sorted[sorted.length - 1], tz);

  return { earliest, latest };
}
