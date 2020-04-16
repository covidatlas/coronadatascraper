/** Compare two folders of Covid Data Scraper reports.
 *
 * Given two folders, this script diffs the corresponding reports, and
 * prints the differences to console log.  Call this script from the
 * command line.
 *
 * Usage:
 * node ${this_file} --left <one folder> --right <other folder>
 *
 * Sample annotated output:
 *
 *    $ node tests/regression/compare.js --left zzzBase/ --right zzzOther/
 *
 *    data-2020-4-9.json
 *    ------------------
 *    * [2703, Roberts County, South Dakota]/sources[0]/url value: X != https://doh.org
 *
 *    Explanation:
 *    Nested json structures are separated by `/`.  `[#]` indicates an array.
 *    Some "formatters" are used to add extra info to the diff report.
 *    So, the above line says:
 *    * For the two files zzzBase/data-2020-4-9.json and zzzOther/data-2020-4-9.json,
 *    * - root array element 2703 (Roberts County, SD) ...
 *    * - has a 'sources' array, of which element 0 ...
 *    * - has a 'url' property which is different:
 *    * the `--left` file contains `X`, the `--right` file contains `https://doh.org`
 *
 *    reports/crawler-report.csv
 *    --------------------------
 *    * Line 154, col 51: "," != "s"
 *
 *    features-2020-4-9.json
 *    ----------------------
 *      equal
 *
 *    The corresponding files in the `--left` and `--right` directories are equal.
 */

const imports = require('esm')(module);
const path = require('path');
const fs = require('fs');

const yargs = imports('yargs');
const glob = require('fast-glob').sync;

const lib = path.join(process.cwd(), 'src', 'shared', 'lib');
const jsonDiff = imports(path.join(lib, 'diffing', 'json-diff.js'));
const stringDiff = imports(path.join(lib, 'diffing', 'string-diff.js')).default;

// Utilities /////////////////////////////////////////

/** Compare two json files. */
function compareJson(leftFname, rightFname, formatters) {
  const loadJson = f => {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  };
  const left = loadJson(leftFname);
  const right = loadJson(rightFname);
  const errs = jsonDiff.jsonDiff(left, right, 10, formatters);
  if (errs.length === 0) console.log('  equal');
  else
    errs.forEach(e => {
      console.log(`* ${e}`);
    });
}

/** Compare two CSV files. */
function compareCsv(leftFname, rightFname) {
  const loadlines = f => {
    return fs.readFileSync(f, 'utf8').match(/[^\r\n]+/g);
  };
  const left = loadlines(leftFname);
  const right = loadlines(rightFname);

  const errs = [];
  if (left.length !== right.length) {
    errs.push(`Different line count (${left.length} vs ${right.length})`);
  }

  const minLength = left.length < right.length ? left.length : right.length;
  for (let i = 0; i < minLength; ++i) {
    const diff = stringDiff(left[i], right[i]);
    if (diff.column !== null) errs.push(`Line ${i}, col ${diff.column}: "${diff.left}" != "${diff.right}"`);
    if (errs.length >= 10) break;
  }

  if (errs.length === 0) console.log('  equal');
  else
    errs.forEach(e => {
      console.log(`* ${e}`);
    });
}

/** Find _one_ file in leftPaths and rightPaths that matches the
 * regex. */
function findLeftRightFiles(regex, leftPaths, rightPaths) {
  function findFile(files, regex) {
    const drs = files.filter(f => {
      return regex.test(f);
    });
    if (drs.length === 0) {
      console.log(`Missing ${regex} file.`);
      return null;
    }
    if (drs.length > 1) {
      console.log(`Multiple/ambiguous ${regex} files.`);
      return null;
    }
    return drs[0];
  }
  return [findFile(leftPaths, regex), findFile(rightPaths, regex)];
}

// Main method /////////////////////////////////////////

/** Compare reports in "left" and "right" folders. */
function compareReportFolders(left, right) {
  const fpaths = d => {
    return glob(path.join(d, '**', '*.*')).sort();
  };
  const leftPaths = fpaths(left);
  const rightPaths = fpaths(right);

  const printTitle = s => {
    const b = path.basename(s);
    console.log(`\n${b}\n${'-'.repeat(b.length)}`);
  };

  const jsonReports = [
    {
      regex: /data(.*).json/,
      formatters: {
        '^[(\\d+)]$': (h, m) => {
          return `[${m[1]}, ${h.name}]`;
        }
      }
    },
    {
      regex: /report.json/,
      formatters: {
        '^(.*?/sources)[(\\d+)]$': (h, m) => {
          return `${m[1]}[${m[2]}, ${h.url}]`;
        }
      }
    },
    {
      regex: /ratings.json/,
      formatters: {
        '^[(\\d+)]$': (h, m) => {
          return `[${m[1]}, ${h.url}]`;
        }
      }
    },
    {
      regex: /features(.*).json/,
      formatters: {}
    }
  ];

  jsonReports.forEach(hsh => {
    const [left, right] = findLeftRightFiles(hsh.regex, leftPaths, rightPaths);
    if (left && right) {
      printTitle(left);
      compareJson(left, right, hsh.formatters);
    }
  });

  const csvReports = [/crawler-report.csv/, /data(.*).csv/];
  csvReports.forEach(regex => {
    const [left, right] = findLeftRightFiles(regex, leftPaths, rightPaths);
    if (left && right) {
      printTitle(left);
      compareCsv(left, right);
    }
  });
}

// Entry point /////////////////////////////////////////

const { argv } = yargs
  .option('left', {
    alias: 'l',
    description: 'Left folder',
    type: 'string',
    default: 'dist'
  })
  .option('right', {
    alias: 'r',
    description: 'Right folder',
    type: 'string'
  })
  .demand(['left', 'right'], 'Please specify both directories')
  .version(false)
  .help();

compareReportFolders(argv.left, argv.right);
