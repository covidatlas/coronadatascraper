/* eslint-disable global-require */

import path from 'path';
import * as fetch from '../../../lib/fetch.js';
import { readFile } from '../../../lib/fs.js';
import AL from './index.js';

jest.mock('../../../lib/fetch.js');

const read = p => readFile(path.resolve(__dirname, p));

describe('scraper: USA-AL', () => {
  beforeAll(async () => {
    fetch.mockSources({
      '2019-coronavirus.html': await read('./tests/2019-coronavirus.html')
    });
  });

  it('scrapes latest', async () => {
    expect(await AL.scraper()).toEqual(require('./tests/expected.json'));
  });

  afterEach(() => {
    delete process.env.SCRAPE_DATE;
  });
});
