/**
HTML table structure validator.

Scrapers break occasionally due to their source HTML tables changing.
This class provides a few simple checks to verify that the structure
is as expected.

Example:

Suppose you have the following table

    <html>
      <body>
        <table id="tid">
          <tr>
            <th>location</th>
            <th>cases</th>
            <th>deaths</th>
          </tr>
          <tr>
            <td>apple county</td>
            <td>10</td>
            <td>20</td>
          </tr>
          <tr>
            <td>deer county</td>
            <td>66</td>
            <td>77</td>
          </tr>
        </table>
      </body>
    </html>

You can create a hash of rules that the table should match:

    const rules = {
      headings: {
        0: /location/,
        1: /cases/,
        2: /deaths/
      },
      minrows: 2,
      data: [
        { column: 0, row: 'ANY', rule: /apple/i },
        { column: 0, row: 'ALL', rule: /county$/ },
        { column: 1, row: 'ALL', rule: /^[0-9]+$/ },
        { column: 2, row: 'ALL', rule: /^[0-9]+$/ },
        { column: 0, row: 2, rule: /deer/ }
      ]
    };

Rule notes:

* you don't have to pass all the rules, just the ones you need.
* the data rules support ANY, ALL, or a number.
* all rules are regexes.
* unknown or incorrect rules will throw an exception.
* we don't check column or row umber validity: if you put "column: 'a'",
  that's on you!

With the rules described, check the errors:

    errs = v.validate($table, rules);
    if (errs.length !== 0) {
      console.log(errs);
    }

Or as a shorthand, just throw and optionally log to console:

    const opts = { includeErrCount: 5, logToConsole: false };
    throwIfErrors(rules, $table, opts);


Usage notes:

There are some ASSUMPTIONS documented in the code:

* headings are on row 0
* data starts on row 1
* one data point per table cell

*/

/** Validate the rules, and return a full ruleset. */
function validateRules(rules) {
  const useRules = {
    headings: {},
    minrows: 0,
    data: []
  };

  for (const k in rules) {
    if (!Object.keys(useRules).includes(k)) {
      const msg = `bad rule key ${k}`;
      // console.log(msg);
      throw new Error(msg);
    }
  }

  // eslint-disable-next-line guard-for-in
  for (const k in rules) useRules[k] = rules[k];
  // console.log(useRules);

  // eslint-disable-next-line guard-for-in
  for (const k in useRules.headings) {
    const r = useRules.headings[k];
    if (!(r instanceof RegExp)) {
      throw new Error(`${r} is not a RegExp`);
    }
  }

  useRules.data.forEach(r => {
    if (!(r.rule instanceof RegExp)) {
      throw new Error(`${r.rule} is not a RegExp`);
    }
  });

  return useRules;
}

/** Test a cell at a given row/column with a regex. */
function matchCell(trs, row, column, regex) {
  const dr = trs.eq(row);
  let cells = dr.find('td');
  if (cells.length === 0) cells = dr.find('th');
  const cell = cells.eq(column);
  const txt = cell.text();
  return { result: regex.test(txt), text: txt };
}

/** Validate that table follows table heading rules. */
function checkHeadings(table, headingRules) {
  const errs = [];
  // eslint-disable-next-line guard-for-in
  for (const column in headingRules) {
    const re = headingRules[column];
    const ret = matchCell(table.find('tr'), 0, column, re);
    if (!ret.result) {
      errs.push(`heading ${column} "${ret.text}" does not match ${re}`);
    }
  }

  return errs;
}

/** Validate that table has a minimum number of rows. */
function checkMinRows(table, minrows) {
  const trs = table.find('tr');
  if (trs.length < parseInt(minrows, 10)) {
    return [`expected at least ${minrows} rows, only have ${trs.length}`];
  }
  return [];
}

/** Validate that table follows data rules.
 * Assume that the data starts on the second row.
 */
function checkData(table, dataRules) {
  const trs = table.find('tr');

  const datatrs = trs.slice(1);
  // console.log(`Have ${datatrs.length} data rows`);

  const errs = [];

  const anyRules = dataRules.filter(r => r.row === 'ANY');
  anyRules.forEach(rule => {
    let matches = false;
    // Using for loop to allow for break and exit
    // (can't break if we use forEach with anon function).
    for (let index = 0; index < datatrs.length; ++index) {
      const dr = datatrs.eq(index);
      const td = dr.find('td').eq(rule.column);
      const txt = td.text();
      // console.log(`    ${txt}`);
      if (rule.rule.test(txt)) {
        matches = true;
        break;
      }
    }
    if (!matches) {
      errs.push(`no row in column ${rule.column} matches ${rule.rule}`);
    }
  });

  const allRules = dataRules.filter(r => r.row === 'ALL');
  allRules.forEach(rule => {
    let matches = true;
    let failure = '';
    // Using for loop to allow for break and exit
    // (can't break if we use forEach with anon function).
    for (let index = 0; index < datatrs.length; ++index) {
      const dr = datatrs.eq(index);
      const td = dr.find('td').eq(rule.column);
      const txt = td.text();
      // console.log(`    ${txt}`);
      if (!rule.rule.test(txt)) {
        matches = false;
        failure = txt;
        break;
      }
    }
    if (!matches) {
      errs.push(`"${failure}" in column ${rule.column} does not match ${rule.rule}`);
    }
  });

  const cellRules = dataRules.filter(r => r.row !== 'ALL' && r.row !== 'ANY');
  cellRules.forEach(rule => {
    const r = parseInt(rule.row, 10);
    const c = parseInt(rule.column, 10);
    const ret = matchCell(trs, r, c, rule.rule);
    if (!ret.result) {
      errs.push(`cell[${r}, ${c}] value "${ret.text}" does not match ${rule.rule}`);
    }
  });

  return errs;
}

/** Validates a cheerio table using a set of rules.
 * Returns list of error messages.
 */
export function validate(table, rules) {
  const result = [];
  if (table === null || table === undefined) {
    result.push('null/undefined table');
    return result;
  }

  // ASSUMPTION: table must have 1 header row,
  // and at least one data row.
  const trs = table.find('tr');
  if (trs.length <= 1) {
    return ['no rows in table'];
  }

  const fullrules = validateRules(rules);
  result.push(...checkHeadings(table, fullrules.headings));
  result.push(...checkMinRows(table, fullrules.minrows));
  result.push(...checkData(table, fullrules.data));

  return result;
}

/** throw an error if the table doesn't meet layout rules
 *
 * Options defaults:
 * {
 *   includeErrCount: 5,
 *   logToConsole: false
 * }
 */
export function throwIfErrors(table, rules, options = {}) {
  const includeErrCount = options.includeErrCount || 5;
  const logToConsole = options.logToConsole || false;

  const fullrules = validateRules(rules);
  const errs = validate(table, fullrules);
  const errCount = errs.length;
  if (errCount === 0) return;

  const msg = `${errCount} validation errors.`;
  const firstN = errs.slice(0, includeErrCount);
  if (logToConsole) {
    console.error(msg);
    console.error(firstN);
  }
  throw new Error(`${msg}.  Sample: ${firstN.join(';')}.`);
}
