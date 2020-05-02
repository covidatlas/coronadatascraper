const assert = require('assert');
const slugify = require('slugify');

const slugifyOptions = { lower: true };

const schemaKeys = [
  'cases',
  'hospitalized',
  'tested',
  'testedNegative', // Not in final schema, used to scrape negative results to then combine with cases to get `tested` number.
  'deaths',
  'recovered',
  'state',
  'county',
  null // Use when we want to discard the column.
];

/**
 * Hand-rolled version of _.pickBy from lodash/
 * @param {object} object
 * @param {(value:any, key: string|null) => boolean} predicate
 */
const pickBy = (object, predicate) => {
  const obj = {};
  for (const key in object) {
    if (predicate(object[key], key)) {
      obj[key] = object[key];
    }
  }
  return obj;
};

const assertAllValuesAreInSchema = schemaKeysByHeadingFragment => {
  const potentialKeys = Object.values(schemaKeysByHeadingFragment);
  potentialKeys.forEach(potentialKey =>
    assert(
      schemaKeys.some(validKey => validKey === potentialKey),
      `Invalid value in schemaKeysByHeadingFragment: ${potentialKey}`
    )
  );
};

const getSchemaKeyFromHeading = ({ heading, schemaKeysByHeadingFragment }) => {
  assertAllValuesAreInSchema(schemaKeysByHeadingFragment);
  const slugHeading = slugify(heading, slugifyOptions);

  const foundItems = pickBy(schemaKeysByHeadingFragment, (schemaKey, headingFragment) => {
    const slugFragment = slugify(headingFragment, slugifyOptions);
    return slugHeading.includes(slugFragment);
  });
  const foundSchemaKeys = Object.values(foundItems);
  assert.strictEqual(
    foundSchemaKeys.length,
    1,
    `no single match found for ${slugHeading} in ${JSON.stringify(schemaKeysByHeadingFragment)}}`
  );
  return foundSchemaKeys[0];
};

module.exports = getSchemaKeyFromHeading;
