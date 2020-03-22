import Ajv from 'ajv';

import scraperSchema from './schemas/scraper.json';

export const schemas = {
  scraperSchema
};

const ajv = new Ajv();

ajv.addKeyword('generator', {
  compile(sch) {
    if (sch === true) {
      return data => typeof data === 'function';
    }
    return data => typeof data !== 'function';
  }
});

export const schemaHasErrors = (data, schema) => {
  const validate = ajv.compile(schema);

  if (validate(data)) {
    return false;
  }
  return validate.errors;
};
