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

function printTitleAndErrors(f, errs) {
  const b = path.basename(f);
  if (errs.length === 0) {
    console.log(`${b}: equal`);
    return;
  }
  console.log(`\n${b}\n${'-'.repeat(b.length)}`);
  errs.forEach(e => {
    console.log(`* ${e}`);
  });
  console.log();
}

/** Compare two json files. */
function compareJson(leftFname, rightFname, formatters) {
  const leftcontent = fs.readFileSync(leftFname, 'utf-8');
  const rightcontent = fs.readFileSync(rightFname, 'utf-8');
  if (leftcontent === rightcontent) {
    printTitleAndErrors(leftFname, []);
    return;
  }

  const left = JSON.parse(leftcontent);
  const right = JSON.parse(rightcontent);
  const errs = jsonDiff.jsonDiff(left, right, 10, formatters);
  printTitleAndErrors(leftFname, errs);
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

  printTitleAndErrors(leftFname, errs);
}

/** Find corresponding files in leftPaths and rightPaths that match
 * the regex. */
function findLeftRightFiles(regex, leftPaths, rightPaths) {
  function findFiles(files, regex) {
    return files.filter(f => {
      return regex.test(f);
    });
  }
  const leftFiles = findFiles(leftPaths, regex);
  const rightFiles = findFiles(rightPaths, regex);

  const filename = s => {
    const a = s.split(path.sep);
    return a[a.length - 1];
  };
  return leftFiles.map(lf => {
    const rf = rightFiles.find(rf => filename(rf) === filename(lf));
    return [lf, rf];
  });
}

// Main method /////////////////////////////////////////

/** Compare reports in "left" and "right" folders. */
function compareReportFolders(left, right) {
  const fpaths = d => {
    return glob(path.join(d, '**', '*.*')).sort();
  };
  const leftPaths = fpaths(left);
  const rightPaths = fpaths(right);

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
      regex: /features.json/,
      formatters: {}
    },
    {
      regex: /features-(.*).json/,
      formatters: {}
    },
    { regex: /timeseries-byLocation.json/, formatters: {} },
    { regex: /timeseries.json/, formatters: {} }
  ];

  jsonReports.forEach(hsh => {
    const list = findLeftRightFiles(hsh.regex, leftPaths, rightPaths);
    for (const [left, right] of list) {
      if (left && right) {
        compareJson(left, right, hsh.formatters);
      }
    }
  });

  const csvReports = [
    /crawler-report.csv/,
    /data(.*).csv/,
    /timeseries.csv/,
    /timeseries-tidy.csv/,
    /timeseries-jhu.csv/
  ];
  csvReports.forEach(regex => {
    const list = findLeftRightFiles(regex, leftPaths, rightPaths);
    for (const [left, right] of list) {
      if (left && right) {
        compareCsv(left, right);
      }
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
