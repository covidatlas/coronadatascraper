const readline = require('readline');
const fs = require('fs');
const { stream } = require('@lorenzofox3/for-await');

const report = {};

// Currently active location and test, helps with structuring the report
const active = {
  loc: '',
  test: ''
};

let passed = 0;
let failed = 0;

/**
 * Adds an error to the report. Creates the necessary fields if missing.
 */
const addError = error => {
  if (active.test) {
    if (!report[active.loc]) {
      report[active.loc] = {};
    }

    const locData = report[active.loc];

    if (!locData[active.test]) {
      locData[active.test] = [];
    }

    locData[active.test].push(error);
  }
};

async function processLineByLine(input = process.stdin) {
  const inputStream = stream(
    readline.createInterface({
      input
    })
  ).map(m => JSON.parse(m));

  for await (const m of inputStream) {
    // When test start, we determine if we are dealing with a
    // new test or location and update the active object
    if (m.type === 'TEST_START') {
      const { description } = m.data;
      // Locations start with characters "l>"
      if (description && description.match(/^l>/)) {
        active.loc = description.replace('l>', '');
      } else {
        active.test = description;
      }
      // When test ends, we update the active object accordingly
    } else if (m.type === 'TEST_END') {
      const { description } = m.data;
      if (description && description.match(/^l>/)) {
        active.loc = '';
      } else {
        active.test = '';
      }
    } else if (m.type === 'ASSERTION') {
      if (m.data.pass) {
        passed += 1;
      } else {
        failed += 1;
        addError(m.data.description);
      }
    }
  }

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  // write to file!
  const filePath = 'dist/data-quality.json';
  await fs.promises.writeFile(filePath, JSON.stringify(report, null, 2));
  console.log(`✏️  Test results written to ${filePath}`);
}

processLineByLine();
