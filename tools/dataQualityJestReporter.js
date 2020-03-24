const fs = require('fs');

class CovidAtlasDataQualityReporter {
  /**
   * constructor for the reporter
   *
   * @param {Object} globalConfig - Jest configuration object
   * @param {Object} options - Options object defined in jest config
   */
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this._report = [];
  }

  /**
   * Hook to process the test run before running the tests, the only real data
   * available at this time is the number of test suites about to be executed
   *
   * @param {JestTestRunResult} - Results for the test run, but only `numTotalTestSuites` is of use
   * @param {JestRunConfig} - Run configuration
   */
  onRunStart() {
    this._report = [];
  }

  /**
   * Hook to process the test run results after a test suite has been executed
   * This will be called many times during the test run
   *
   * @param {JestTestSuiteRunConfig} testRunConfig - Context information about the test run
   * @param {JestTestSuiteResult} testResults - Results for the test suite just executed
   * @param {JestTestRunResult} - Results for the test run at the point in time of the test suite being executed
   */
  onTestResult(testRunConfig, testResults) {
    testResults.testResults.forEach(testResult => {
      const keys = testResult.fullName.split(': ');
      const record = {
        location: keys[0],
        test: keys[1],
        status: testResult.status
      };
      this._report.push(record);
    });
  }

  /**
   * Hook to process the test run results after all the test suites have been
   * executed
   *
   * @param {string} test - The Test last run
   * @param {JestTestRunResult} - Results from the test run
   */
  async onRunComplete() {
    // write to file!
    const filePath = 'dist/data-quality.json';
    await fs.promises.writeFile(filePath, JSON.stringify(this._report));
    console.log(`\n✏️  Test results written to ${filePath}`);

    // force exit code 0; all we care about is the data-quality.json report
    return process.exit(0);
  }
}

module.exports = CovidAtlasDataQualityReporter;
