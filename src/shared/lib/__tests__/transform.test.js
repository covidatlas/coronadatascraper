import * as transform from '../transform.js';

describe('transform', () => {
  describe('normalizeString', () => {
    test.each([
      ['Saint-Barthélemy', 'saint-barthelemy'],
      ['La Réunion', 'la reunion']
    ])('it normalizes strings', (value, expected) => {
      expect(transform.normalizeString(value)).toBe(expected);
    });
  });
});
