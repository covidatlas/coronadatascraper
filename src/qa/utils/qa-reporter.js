const imports = require('esm')(module);

const readline = imports('readline');
const { stream } = imports('@lorenzofox3/for-await');

const fs = imports('../../shared/lib/fs.js');
const reporter = imports('../../shared/lib/error-reporter.js').default;

// Currently active location and test, helps with structuring the report
const active = {
  loc: '',
  test: '',
  date: ''
};

let passed = 0;
let failed = 0;

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
      } else if (description && description.match(/^d>/)) {
        active.date = description.replace('d>', '');
      } else {
        active.test = description;
      }
      // When test ends, we update the active object accordingly
    } else if (m.type === 'TEST_END') {
      const { description } = m.data;
      if (description && description.match(/^l>/)) {
        active.loc = '';
      } else if (description && description.match(/^d>/)) {
        active.date = '';
      } else {
        active.test = '';
      }
    } else if (m.type === 'ASSERTION' && active.loc && active.test && !m.data.description.match(/^d>/)) {
      if (m.data.pass) {
        passed += 1;
      } else {
        failed += 1;
        reporter.logError('qa', active.test, m.data.description, 'low', active.loc, active.date);
      }
    }
  }

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  // write to file!
  const filePath = 'dist/reports/data-quality.csv';
  await fs.writeCSV(filePath, reporter.getCSV());
  console.log(`✏️  Test results written to ${filePath}`);
}

processLineByLine();
