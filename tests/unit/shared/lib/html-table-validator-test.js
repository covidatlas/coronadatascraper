const cheerio = require('cheerio');
const test = require('tape');
const HtmlTableValidator = require('../../../../src/shared/lib/html-table-validator.js');

// The html table that most tests will be using.
// Summarized:
//   apple county| 10| 20
//   deer county | 66| 77
const $html = `
<html>
  <body>
    <table id="tid">
      <tr>
        <th>location</th><th>cases</th><th>deaths</th>
      </tr>
      <tr>
        <td>apple county</td><td>10</td><td>20</td>
      </tr>
      <tr>
        <td>deer county</td><td>66</td><td>77</td>
      </tr>
    </table>
  </body>
</html>`;

// The table for the current test run.
let $table = null;

// The rules being used to verify $table.
let $rules = {};

// Validate $table using $rules.
function expectErrors(t, expected) {
  const v = new HtmlTableValidator($rules);
  const actual = v.errors($table);
  // console.log(actual);
  t.equal(actual.toString(), expected.toString());

  // Don't bother -- success() just checks error length.
  // const shouldBeSuccessful = expected.length === 0;
  // t.equal(v.success($table), shouldBeSuccessful);
}

function setup() {
  const c = cheerio.load($html);
  $table = c('table#tid').eq(0);
}

// CONSTRUCTOR

test('constructor: throws error if a bad rule is used', t => {
  setup();
  const rules = {
    headings: { 0: {} }
  };
  t.throws(() => {
    // eslint-disable-next-line no-new
    new HtmlTableValidator(rules);
  });
  t.end();
});

test('constructor: throws error if an invalid rule is passed', t => {
  setup();
  const rules = {
    badHeading: 'this should throw'
  };
  t.throws(() => {
    // eslint-disable-next-line no-new
    new HtmlTableValidator(rules);
  });
  t.end();
});

// SANITY CHECKS

test('sanity: no errors if no rules', t => {
  setup();
  expectErrors(t, []);
  t.end();
});

test('sanity: error if table is null', t => {
  setup();
  $table = null;
  expectErrors(t, ['null/undefined table']);
  t.end();
});

test('sanity: error if table is undefined', t => {
  setup();
  $table = undefined;
  expectErrors(t, ['null/undefined table']);
  t.end();
});

test('sanity: reports error if no rows in table', t => {
  setup();
  const norows = '<html><head><table id="tid"></table></head></html>';
  const c = cheerio.load(norows);
  $table = c('table#tid').eq(0);
  expectErrors(t, ['no rows in table']);
  t.end();
});

// HEADER CHECKS

test('headers: can check header with regex', t => {
  setup();
  $rules = {
    headings: {
      0: /shouldfail/
    }
  };
  expectErrors(t, ['heading 0 "location" does not match /shouldfail/']);
  t.end();
});

test('headers: can check multiple headers at once', t => {
  setup();
  $rules = {
    headings: {
      0: /shouldfail/,
      1: /another_bad/
    }
  };
  expectErrors(t, [
    'heading 0 "location" does not match /shouldfail/',
    'heading 1 "cases" does not match /another_bad/'
  ]);
  t.end();
});

test('headers: passes if all regexes match', t => {
  setup();
  $rules = {
    headings: {
      0: /location/,
      1: /cases/,
      2: /deaths/
    }
  };
  expectErrors(t, []);
  t.end();
});

test('headers: can use exact-matching regexes', t => {
  setup();
  $rules = {
    headings: {
      0: /location/,
      1: /^cases $/,
      2: /^ deaths $/
    }
  };
  expectErrors(t, ['heading 1 "cases" does not match /^cases $/', 'heading 2 "deaths" does not match /^ deaths $/']);
  t.end();
});

test('headers: can use case-insensitive regex', t => {
  setup();
  $rules = {
    headings: {
      0: /LocaTion/i,
      1: /CASES/i,
      2: /DEATHS/i
    }
  };
  expectErrors(t, []);
  t.end();
});

test('headers: can use <td> for header cells', t => {
  setup();
  const trhtml = $html.replace(/<th>/g, '<td>').replace(/<\/th>/g, '</td>');
  const c = cheerio.load(trhtml);
  $table = c('table#tid').eq(0);
  $rules = {
    headings: {
      0: /something/,
      1: /Cases/
    }
  };
  expectErrors(t, ['heading 0 "location" does not match /something/', 'heading 1 "cases" does not match /Cases/']);
  t.end();
});

test('headers: reports error if a rule refers to a non-existent column', t => {
  setup();
  $rules = {
    headings: {
      a: /something/,
      17: /Cases/
    }
  };
  expectErrors(t, ['heading 17 "" does not match /Cases/', 'heading a "" does not match /something/']);
  t.end();
});

// MINROW CHECKS

test('minrows: fails if table has insufficient rows', t => {
  setup();
  $rules = {
    minrows: 10
  };
  expectErrors(t, ['expected at least 10 rows, only have 3']);
  t.end();
});

test('minrows: passes if table has sufficient rows', t => {
  setup();
  $rules = {
    minrows: 2
  };
  expectErrors(t, []);
  t.end();
});

// DATA ROW COLUMN CHECKS

test('data ANY: passes if any row matches', t => {
  setup();
  $rules = {
    data: [{ column: 0, row: 'ANY', rule: /apple/ }]
  };
  expectErrors(t, []);
  t.end();
});

test('data ANY: fails if no row matches', t => {
  setup();
  $rules = {
    data: [{ row: 'ANY', column: 0, rule: /UNKNOWN/ }]
  };
  expectErrors(t, ['no row in column 0 matches /UNKNOWN/']);
  t.end();
});

test('data ANY: can use numeric regex', t => {
  setup();
  $rules = {
    data: [
      { column: 1, row: 'ANY', rule: /^[0-9]+$/ },
      { column: 2, row: 'ANY', rule: /^[a-z]+$/ }
    ]
  };
  expectErrors(t, ['no row in column 2 matches /^[a-z]+$/']);
  t.end();
});

test('data ANY: reports error if a rule refers to a non-existent column', t => {
  setup();
  $rules = {
    data: [
      { column: 17, row: 'ANY', rule: /^[0-9]+$/ },
      { column: 'a', row: 'ANY', rule: /^[a-z]+$/ }
    ]
  };
  expectErrors(t, ['no row in column 17 matches /^[0-9]+$/', 'no row in column a matches /^[a-z]+$/']);
  t.end();
});

test('data ALL: passes if all rows match', t => {
  setup();
  $rules = {
    data: [
      { column: 0, row: 'ALL', rule: /county/ },
      { column: 1, row: 'ALL', rule: /^[0-9]+$/ }
    ]
  };
  expectErrors(t, []);
  t.end();
});

test('data ALL: fails if any rows do not match', t => {
  setup();
  $rules = {
    data: [
      { column: 0, row: 'ALL', rule: /apple/ },
      { column: 1, row: 'ALL', rule: /^[0-9]+$/ }
    ]
  };
  expectErrors(t, ['"deer county" in column 0 does not match /apple/']);
  t.end();
});

test('data CELL: passes if cell matches', t => {
  setup();
  $rules = {
    data: [{ column: 0, row: 0, rule: /location/ }]
  };
  expectErrors(t, []);
  t.end();
});

test('data CELL: treats bad cell references as empty', t => {
  setup();
  $rules = {
    data: [
      { column: 0, row: 10000, rule: /location/ },
      { column: 5000, row: 2, rule: /outerspace/ }
    ]
  };
  expectErrors(t, [
    'cell[10000, 0] value "" does not match /location/',
    'cell[2, 5000] value "" does not match /outerspace/'
  ]);
  t.end();
});

test('data CELL: fails if cell does not match', t => {
  setup();
  $rules = {
    data: [
      { column: 0, row: 0, rule: /area/ },
      { column: 0, row: 1, rule: /apple/ },
      { column: 1, row: 2, rule: /cat/ }
    ]
  };
  expectErrors(t, ['cell[0, 0] value "location" does not match /area/', 'cell[2, 1] value "66" does not match /cat/']);
  t.end();
});

// THROWIFERRORS TESTS

test('throwIfErrors: throws if errors', t => {
  setup();
  $rules = {
    headings: {
      0: /shouldfail/
    }
  };
  t.throws(() => {
    HtmlTableValidator.throwIfErrors($rules, $table, { logToConsole: false });
  });
  t.end();
});

test('throwIfErrors: does not throw if no errors', t => {
  setup();
  $rules = {
    headings: {
      0: /location/
    }
  };
  HtmlTableValidator.throwIfErrors($rules, $table, { logToConsole: false });
  t.equal(1, 1);
  t.end();
});

test('throwIfErrors: can specify count of errors to include in thrown message', t => {
  setup();
  $rules = {
    data: [
      { column: 0, row: 0, rule: /area/ },
      { column: 0, row: 1, rule: /apple/ },
      { column: 1, row: 2, rule: /cat/ }
    ]
  };

  // Sanity check of validation errors:
  expectErrors(t, ['cell[0, 0] value "location" does not match /area/', 'cell[2, 1] value "66" does not match /cat/']);

  let errMsg;
  try {
    const opts = { includeErrCount: 1, logToConsole: false };
    HtmlTableValidator.throwIfErrors($rules, $table, opts);
  } catch (e) {
    errMsg = e.message;
  }

  t.match(errMsg, /value "location"/);
  t.doesNotMatch(errMsg, /value "66"/);
  t.end();
});

test('throwIfErrors: count of errors requested may be more than actual errors', t => {
  setup();
  $rules = {
    data: [
      { column: 0, row: 0, rule: /area/ },
      { column: 0, row: 1, rule: /apple/ },
      { column: 1, row: 2, rule: /cat/ }
    ]
  };

  // Sanity check of validation errors:
  expectErrors(t, ['cell[0, 0] value "location" does not match /area/', 'cell[2, 1] value "66" does not match /cat/']);

  let errMsg;
  try {
    const opts = { includeErrCount: 999, logToConsole: false };
    HtmlTableValidator.throwIfErrors($rules, $table, opts);
  } catch (e) {
    errMsg = e.message;
  }

  t.match(errMsg, /value "location"/);
  t.match(errMsg, /value "66"/);
  t.end();
});
