const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');

const pdfParser = imports(join(process.cwd(), 'src', 'shared', 'lib', 'fetch', 'pdf-parser.js')).default;
const pdfUtils = imports(join(process.cwd(), 'src', 'shared', 'lib', 'pdf.js'));
const fs = imports(join(process.cwd(), 'src', 'shared', 'lib', 'fs.js'));

test('Module exists', t => {
  t.plan(1);
  t.ok(pdfParser, 'pdfParser exists');
});

test('Parsing works', async t => {
  t.plan(1);

  const pdfBuffer = await fs.readFile(join(process.cwd(), 'tests', 'unit', '__assets__', 'dummy.pdf'), null);

  const data = await pdfParser(pdfBuffer);

  t.isEquivalent(data, [
    { page: 1, x: 3.3, y: 4.494, w: 50.071, text: 'Dumm' },
    { page: 1, x: 6.431, y: 4.494, w: 8.952, text: 'y' },
    { page: 1, x: 7.269, y: 4.494, w: 32.168, text: 'PDF' },
    { page: 1, x: 9.281, y: 4.494, w: 14.281, text: 'fi' },
    { page: 1, x: 10.175, y: 4.494, w: 13.411, text: 'le' },
    null
  ]);
});

test('Finding rows work', async t => {
  t.plan(1);
  const pdfBuffer = await fs.readFile(join(process.cwd(), 'tests', 'unit', '__assets__', 'dummy.pdf'), null);

  const data = await pdfParser(pdfBuffer);
  const rows = pdfUtils.asRows(data);

  t.isEquivalent(rows, [
    [
      { page: 1, x: 3.3, y: 4.494, w: 50.071, text: 'Dumm' },
      { page: 1, x: 6.431, y: 4.494, w: 8.952, text: 'y' },
      { page: 1, x: 7.269, y: 4.494, w: 32.168, text: 'PDF' },
      { page: 1, x: 9.281, y: 4.494, w: 14.281, text: 'fi' },
      { page: 1, x: 10.175, y: 4.494, w: 13.411, text: 'le' }
    ]
  ]);
});
