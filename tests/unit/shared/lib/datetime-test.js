const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');

const datetime = imports(join(process.cwd(), 'src', 'shared', 'lib', 'datetime', 'iso', 'index.js')).default;

const {
  today,
  now,
  parse,
  getYYYYMMDD,
  getYYYYMD,
  getDDMMYYYY,
  getMDYYYY,
  getMDYY,
  getMonthDYYYY,
  dateIsBefore,
  dateIsBeforeOrEqualTo,
  scrapeDateIsBefore,
  scrapeDateIsAfter,
  scrapeDateIs,
  looksLike
} = datetime;

const mockDate = d => {
  const t = new Date(d).getTime();
  const dateNowStub = () => t;
  global.Date.now = dateNowStub;
};
mockDate.realDateNow = Date.now.bind(global.Date);
mockDate.reset = () => {
  global.Date.now = mockDate.realDateNow;
};

test('system timezone', t => {
  t.pass(Intl.DateTimeFormat().resolvedOptions().timeZone);
  t.end();
});

// Leaving this in to make sure timezone tests are working.
// If enabled, this `yarn test:tz` will fail for any timezones east of GMT, e.g. `Australia/Sydney`
test.skip('heisenbug', t => {
  t.equal(new Date('3/16/20').toISOString().substring(0, 10), '2020-03-16', 'Fails east of GMT');
  t.end();
});

test('looksLike.isoDate', t => {
  t.equal(looksLike.isoDate('2020-03-16'), true, 'valid date');
  t.equal(looksLike.isoDate('1234-99-52'), true, 'invalid date but right form');
  t.equal(looksLike.isoDate('2020/03/16'), true, 'using slashes');
  t.equal(looksLike.isoDate('2020-3-16'), false, 'no padding');
  t.equal(looksLike.isoDate('20-03-16'), false, 'two-digit year');
  t.equal(looksLike.isoDate('pizza'), false, 'etc');
  t.end();
});

test('looksLike.YYYYMD', t => {
  t.equal(looksLike.YYYYMD('2020-3-16'), true, 'valid date');
  t.equal(looksLike.YYYYMD('1234-9-52'), true, 'invalid date but right form');
  t.equal(looksLike.YYYYMD('2020-03-16'), true, 'padding');
  t.equal(looksLike.YYYYMD('20-03-16'), false, 'two-digit year');
  t.equal(looksLike.YYYYMD('pizza'), false, 'etc');
  t.end();
});

test('looksLike.MDYY', t => {
  t.equal(looksLike.MDYY('03-16-20'), true, 'valid date');
  t.equal(looksLike.MDYY('3-16-20'), true, 'no padding');
  t.equal(looksLike.MDYY('3/16/20'), true, 'using slashes');
  t.equal(looksLike.MDYY('99-99-99'), true, 'invalid date but right form');
  t.equal(looksLike.MDYY('03-16'), false, 'four-digit year');
  t.equal(looksLike.MDYY('pizza'), false, 'etc');
  t.end();
});

test('parse', t => {
  t.equal(parse(new Date('2020-03-16')), '2020-03-16', 'from JS Date');
  t.equal(parse('2020-03-16'), '2020-03-16', 'from ISO date');
  t.equal(parse('2020-03-16T23:45:00Z'), '2020-03-16', 'from ISO datetime');
  t.equal(parse('2020-3-1'), '2020-03-01', 'from unpadded ISO date');
  t.equal(parse('2020-3-01'), '2020-03-01', 'from inconsistently padded ISO date');
  t.equal(parse('2020/03/01'), '2020-03-01', 'using slashes');
  t.equal(parse('3/16/2020'), '2020-03-16', 'from M-D-YYYY');
  t.equal(parse('3/16/20'), '2020-03-16', 'from M-D-YY');
  t.equal(parse('3/16/70'), '2070-03-16', 'M-D-YY assumes current century');
  t.equal(parse('2020-3-24 16:00:00'), '2020-03-24', 'yyyy-M-d hh:mm:ss');
  t.equal(parse(1585540800000), '2020-03-30', 'from epoch number');

  // passes <= GMT, fails > GMT
  // t.equal(parse('March 16, 2020'), '2020-03-16', 'fallthrough to Date');

  t.throws(() => parse(undefined), 'from undefined');
  t.throws(() => parse('9999-99-99'), 'from invalid date');
  t.throws(() => parse({}), 'from object');
  t.end();
});

test('today.utc', t => {
  mockDate('2020-03-16T23:45Z');
  t.equal(today.utc(), '2020-03-16', 'returns the date in UTC');
  mockDate.reset();
  t.end();
});

test('today.at', t => {
  mockDate('2020-03-16T23:45Z');
  t.equal(today.at('America/Los_Angeles'), '2020-03-16', 'returns the date in Los Angeles');
  t.equal(today.at('Australia/Sydney'), '2020-03-17', 'returns the date in Sydney'); // next day
  mockDate.reset();
  t.end();
});

test('now.utc', t => {
  mockDate('2020-03-16T23:45Z');
  t.equal(now.utc(), '2020-03-16T23:45Z', 'returns the time in UTC');
  mockDate.reset();
  t.end();
});

test('now.at', t => {
  mockDate('2020-03-16T23:45Z');
  t.equal(now.at('America/Los_Angeles'), '2020-03-16T16:45', 'returns the time in Los Angeles'); // 7 hrs earlier
  t.equal(now.at('Australia/Sydney'), '2020-03-17T10:45', 'returns the time in Australia'); // 11 hrs later, next day
  mockDate.reset();
  t.end();
});

test('getYYYYMMDD', t => {
  t.equal(getYYYYMMDD('2020-03-16'), '2020-03-16', 'from ISO date');
  t.equal(getYYYYMMDD('2020-3-16'), '2020-03-16', 'from unpadded ISO date');
  t.equal(getYYYYMMDD('2020-03-16T00:00:00'), '2020-03-16', 'from ISO datetime');
  t.equal(getYYYYMMDD('2020-03-16', '/'), '2020/03/16', 'slash as separator');
  t.equal(getYYYYMMDD('2020-03-16', ''), '20200316', 'no separator');

  mockDate('2020-03-16');
  t.equal(getYYYYMMDD(), '2020-03-16', 'defaults to current date');
  mockDate.reset();

  t.end();
});

test('getYYYYMD', t => {
  t.equal(getYYYYMD('2020-03-16'), '2020-3-16', 'from ISO date');
  t.equal(getYYYYMD('2020-03-16T00:00:00'), '2020-3-16', 'from ISO datetime');
  t.end();
});

test('getDDMMYYYY', t => {
  t.equal(getDDMMYYYY('2020-03-16'), '16-03-2020', 'from ISO date');
  t.end();
});

test('getMDYYYY', t => {
  t.equal(getMDYYYY('2020-03-16'), '3/16/2020', 'from ISO date');
  t.equal(getMDYYYY('2020-03-16', '-'), '3-16-2020', 'dash as separator');
  t.end();
});

test('getMDYY', t => {
  t.equal(getMDYY('2020-03-16'), '3/16/20', 'from ISO date');
  t.end();
});

test('getMonthDYYYY', t => {
  t.equal(getMonthDYYYY('2020-03-16'), 'March_16_2020', 'from ISO date');
  t.equal(getMonthDYYYY('2020-03-06'), 'March_6_2020', `doesn't pad date`);
  t.end();
});

test('dateIsBefore', t => {
  t.equal(dateIsBefore('2020-03-16', '2020-03-20'), true, 'before');
  t.equal(dateIsBefore('2020-03-16', '2020-03-16'), false, 'same');
  t.equal(dateIsBefore('2020-03-20', '2020-03-16'), false, 'after');
  t.end();
});

test('dateIsBeforeOrEqualTo', t => {
  t.equal(dateIsBeforeOrEqualTo('2020-03-16', '2020-03-20'), true, 'before');
  t.equal(dateIsBeforeOrEqualTo('2020-03-16', '2020-03-16'), true, 'same');
  t.equal(dateIsBeforeOrEqualTo('2020-03-20', '2020-03-16'), false, 'after');
  t.end();
});

test('scrapeDateIsBefore', t => {
  process.env.SCRAPE_DATE = '2020-3-16';
  t.equal(scrapeDateIsBefore('2020-3-20'), true, 'before');
  t.equal(scrapeDateIsBefore('2020-3-16'), false, 'same');
  t.equal(scrapeDateIsBefore('2020-3-10'), false, 'after');
  delete process.env.SCRAPE_DATE;
  t.end();
});

test('scrapeDateIsAfter', t => {
  process.env.SCRAPE_DATE = '2020-3-16';
  t.equal(scrapeDateIsAfter('2020-3-20'), false, 'before');
  t.equal(scrapeDateIsAfter('2020-3-16'), false, 'same');
  t.equal(scrapeDateIsAfter('2020-3-10'), true, 'after');
  delete process.env.SCRAPE_DATE;
  t.end();
});

test('scrapeDateIs', t => {
  process.env.SCRAPE_DATE = '2020-3-16';
  t.equal(scrapeDateIs('2020-3-20'), false, 'before');
  t.equal(scrapeDateIs('2020-3-16'), true, 'same');
  t.equal(scrapeDateIs('2020-3-10'), false, 'after');

  delete process.env.SCRAPE_DATE;
  t.end();
});
