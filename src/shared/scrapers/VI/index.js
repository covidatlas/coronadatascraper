import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import getSchemaKeyFromHeading from '../../utils/get-schema-key-from-heading.js';
import maintainers from '../../lib/maintainers.js';
import getDataWithTestedNegativeApplied from '../../utils/get-data-with-tested-negative-applied.js';

const schemaKeysByHeadingFragment = {
  update: null,
  'attention deficit': null,
  pending: null,
  death: 'deaths',
  negative: 'testedNegative',
  positive: 'cases',
  recovered: 'recovered'
};

const scraper = {
  country: 'iso1:VI',
  type: 'paragraph',
  url: 'https://doh.vi.gov/covid19usvi',
  sources: [
    {
      url: 'https://doh.vi.gov',
      name: 'United States Virgin Islands Department of Health'
    }
  ],
  maintainers: [
    {
      name: 'Jacob McGowan',
      github: 'jacobmcgowan'
    },
    maintainers.camjc
  ],
  async scraper() {
    const $ = await fetch.page(this, this.url, 'default');
    const $paragraphs = $('.block-content p');
    const data = {};
    $paragraphs
      .filter((_index, paragraph) =>
        $(paragraph)
          .text()
          .includes(':')
      )
      .each((_index, paragraph) => {
        const text = $(paragraph)
          .text()
          .toLowerCase();
        const [heading, valueIncludingParenthetical] = text.split(':');
        const key = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment });
        const [valueWithSlash] = valueIncludingParenthetical.split('(');
        const [value] = valueWithSlash.split('/');
        if (key) {
          data[key] = parse.number(value);
        }
      });

    assert(data.cases > 0, 'Cases is not reasonable');
    return getDataWithTestedNegativeApplied(data);
  }
};

export default scraper;
