import Ajv from 'ajv';

import scraperSchema from './schemas/scraper.json';
import locationSchema from './schemas/location.json';

export const schemas = {
  scraperSchema,
  locationSchema
};

export const schemaHasErrors = (data, schema, options = {}) => {
  const { useDefaults, removeAdditional } = { useDefaults: true, removeAdditional: true, ...options };

  const ajv = new Ajv({ useDefaults, removeAdditional });

  ajv.addKeyword('generator', {
    compile(sch) {
      if (sch === true) {
        return data => typeof data === 'function';
      }
      return data => typeof data !== 'function';
    }
  });

  const validate = ajv.compile(schema);

  if (validate(data)) {
    return false;
  }

  return validate.errors;
};
