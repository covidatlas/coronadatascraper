import Ajv from 'ajv';

import scraperSchema from './schemas/scraper.json';
import locationSchema from './schemas/location.json';

const ajv = new Ajv({ useDefaults: true, removeAdditional: true, $data: true });

ajv.addKeyword('generator', {
  compile(sch) {
    if (sch === true) {
      return data => typeof data === 'function';
    }
    return data => typeof data !== 'function';
  }
});

export const schemas = {
  scraperSchema: ajv.compile(scraperSchema),
  locationSchema: ajv.compile(locationSchema)
};

export const schemaHasErrors = (data, schema) => {
  if (schema(data)) {
    return false;
  }

  return schema.errors;
};
