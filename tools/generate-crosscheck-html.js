const imports = require('esm')(module);

const { generateCrossCheckPage } = imports('../site/cross-check-report.js');
const fs = imports('../src/shared/lib/fs.js');
// eslint-disable-next-line import/no-unresolved
const report = require('../dist/report.json');

async function generate() {
  const css = await fs.readFile('dist/index.css');
  const html = generateCrossCheckPage(report.scrape.crosscheckReports);

  const page = `
<html>
<head>
  <title>CDS Cross-check Report</title>
  <style type="text/css">${css}</style>
</head>
  <body class="spectrum spectrum--light spectrum--medium spectrum-Typography">
    <div class="spectrum-Site" style="height: auto">
      <div class="spectrum-Site-page cds-CrossCheckReports-page">
        ${html}
      </div>
    </div>
  </body>
</html>
`;
  fs.writeFile('dist/crosscheck.html', page);
}

generate();
