import path from 'path';
import convert from './_convert-timestamp.js';
import datetime from '../../../datetime/index.js';

export default function getLocalDateFromFilename(filename, tz = 'America/Los_Angeles') {
  let file = JSON.parse(JSON.stringify(filename)); // Let's not mutate anything inadvertently

  // Extract the file from the path
  file = path.basename(file);

  // Strip out the extension
  file = file.replace(path.extname(file), '');

  // Strip out the contents sha
  file = file.substr(0, file.length - 6);

  // Pull out the timestamp
  const ts = convert.filenameToZ8601(file);

  // Re-cast it from UTC to the source's timezone
  const castDate = datetime.cast(ts, tz);

  return castDate;
}
