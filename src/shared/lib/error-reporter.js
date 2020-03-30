import * as datetime from './datetime.js';

export const SEVERITY_LOW = 'low';
export const SEVERITY_MED = 'medium';
export const SEVERITY_HIGH = 'high';
export const SEVERITY_CRITICAL = 'critical';

const errors = [
  {
    date: 'date',
    country: 'country',
    state: 'state',
    county: 'county',
    city: 'city',
    type: 'type',
    description: 'description',
    severity: 'severity',
    category: 'category'
  }
];

/**
 * Logs an error.
 *
 * @param category the high-level category for this error, for example "parser" or "qa"
 * @param type a more detailed error category, for example "missing date" or "parser has thrown an error"
 * @param description a description to help with debugging, if available
 * @param severity how urgent is a fix for this error
 * @param location assigns an error to a particular location to help with filtering, can be a location/source object, or a string
 * @param date assigns a particular date to the error, to help with filtering
 */
function logError(
  category,
  type,
  description,
  severity,
  location = '',
  date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD()
) {
  const errorObj = {
    date: datetime.getYYYYMMDD(date),
    country: location.country,
    state: location.state,
    county: location.county,
    city: location.city,
    type,
    category,
    description,
    severity
  };

  if (typeof location === 'string') {
    const locationComponents = location.split(',');
    const { length } = locationComponents;

    const locationAttributes = ['country', 'state', 'county', 'city'];
    for (let i = 0; i < length; i++) {
      errorObj[locationAttributes[i]] = locationComponents.pop().trim();
    }
  }

  errors.push(errorObj);
}

/**
 * Get the list of errors as a CSV
 */
function getCSV() {
  return errors;
}

export default { logError, getCSV };
