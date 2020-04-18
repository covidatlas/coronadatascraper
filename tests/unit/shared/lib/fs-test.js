const imports = require('esm')(module);
const { join } = require('path');
const mockFs = require('mock-fs');
const test = require('tape');

const fs = imports(join(process.cwd(), 'src', 'shared', 'lib', 'fs.js'));

test('Module exists', t => {
  t.plan(1);
  t.ok(fs, 'fs exists');
});

test('fs.exists', async t => {
  const tests = ['test/somefile', 'test/asubdirectory/somefile', 'somefile'];
  t.plan(tests.length * 3);

  for (const pathName of tests) {
    mockFs({
      [pathName]: 'file content'
    });
    t.ok(await fs.exists(pathName), `fs.exists found existing file: ${pathName}`);
    mockFs.restore(); // Don't forget to restore!
  }

  for (const pathName of tests) {
    mockFs({
      [pathName]: {}
    });
    t.ok(await fs.exists(pathName), `fs.exists found existing dir: ${pathName}`);
    mockFs.restore(); // Don't forget to restore!
  }

  for (const pathName of tests) {
    mockFs({});
    t.notOk(await fs.exists(pathName), `fs.exists did not find missing file: ${pathName}`);
    mockFs.restore(); // Don't forget to restore!
  }
});

test('fs.ensureDir', async t => {
  const tests = ['test/somedir', 'test/asubdirectory', 'somedir'];
  t.plan(tests.length);

  for (const pathName of tests) {
    mockFs({});
    await fs.ensureDir(pathName);
    t.ok(await fs.exists(pathName), `fs.ensureDir created dir: ${pathName}`);
    mockFs.restore(); // Don't forget to restore!
  }
});

test('fs.readFile', async t => {
  t.plan(2);
  const filePath = 'test/file.txt';
  const fileContent = 'some content';

  mockFs({
    [filePath]: fileContent
  });
  t.equal(await fs.readFile(filePath), fileContent, `fs.readFile returned file content: ${filePath}`);
  mockFs.restore(); // Don't forget to restore!

  mockFs({});
  try {
    await fs.readFile(filePath);
  } catch (e) {
    t.ok(e.message.startsWith('ENOENT'), 'fs.readFile did not find missing file');
    mockFs.restore(); // Don't forget to restore!
  }
});

test('fs.getFilesInDir', async t => {
  t.plan(2);
  const directory = 'test';
  const directoryFiles = ['test1.html', 'test2.csv'];

  mockFs({
    [directory]: directoryFiles.reduce((dirContent, filePath) => {
      dirContent[filePath] = 'some content';
      return dirContent;
    }, {})
  });
  t.deepEqual(await fs.getFilesInDir(directory), directoryFiles, `fs.getFilesInDir returned file paths`);
  mockFs.restore(); // Don't forget to restore!

  mockFs({});
  try {
    await fs.getFilesInDir('testdir');
  } catch (e) {
    t.ok(e.message.startsWith('ENOENT'), 'fs.getFilesInDir did not find missing dir');
    mockFs.restore(); // Don't forget to restore!
  }
});

test('fs.readJSON', async t => {
  t.plan(2);
  const filePath = 'test/file.json';
  const jsonContent = { test: 'it works!' };
  const fileContent = JSON.stringify(jsonContent);

  mockFs({
    [filePath]: fileContent
  });
  t.deepEqual(await fs.readJSON(filePath), jsonContent, 'fs.readJSON returns JSON file content');
  mockFs.restore(); // Don't forget to restore!

  mockFs({});
  try {
    await fs.readJSON(filePath);
  } catch (e) {
    t.ok(e.message.startsWith('ENOENT'), 'fs.readJSON did not find missing file');
    mockFs.restore(); // Don't forget to restore!
  }
});

test('fs.readCSV', async t => {
  t.plan(2);
  const filePath = 'test/file.csv';
  const csvContent = `
title1,title2,title3
one,two,three
example1,example2,example3`;
  const expected = [
    { title1: 'one', title2: 'two', title3: 'three' },
    { title1: 'example1', title2: 'example2', title3: 'example3' }
  ];

  mockFs({
    [filePath]: csvContent
  });
  t.deepEqual(await fs.readCSV(filePath), expected, 'fs.readCSV returns JSON file content');
  mockFs.restore(); // Don't forget to restore!

  mockFs({});
  try {
    await fs.readCSV(filePath);
  } catch (e) {
    t.ok(e.message.startsWith('ENOENT'), 'fs.readCSV did not find missing file');
    mockFs.restore(); // Don't forget to restore!
  }
});

test('fs.writeFile', async t => {
  t.plan(3);
  let filePath = 'file.txt';
  const fileContent = 'some file content!';

  mockFs({});
  await fs.writeFile(filePath, fileContent);
  t.equal(await fs.readFile(filePath), fileContent, 'fs.writeFile writes a valid file');
  mockFs.restore(); // Don't forget to restore!

  filePath = 'test/file.txt';
  mockFs({});
  try {
    await fs.writeFile(filePath, fileContent, { ensureDir: false });
  } catch (e) {
    t.ok(e.message.startsWith('ENOENT'), 'fs.writeFile did not write a file into a missing dir');
    mockFs.restore(); // Don't forget to restore!
  }

  mockFs({});
  await fs.writeFile(filePath, fileContent, { ensureDir: true });
  t.equal(await fs.readFile(filePath), fileContent, 'fs.writeFile writes a valid file into a new dir');
  mockFs.restore(); // Don't forget to restore!
});

test('fs.writeJSON', async t => {
  t.plan(3);
  let filePath = 'file.json';
  const fileContent = { test: 'some data' };

  mockFs({});
  await fs.writeJSON(filePath, fileContent);
  t.deepEqual(await fs.readJSON(filePath), fileContent, 'fs.writeJSON writes a valid file');
  mockFs.restore(); // Don't forget to restore!

  filePath = 'test/file.json';
  mockFs({});
  try {
    await fs.writeJSON(filePath, fileContent, { ensureDir: false });
  } catch (e) {
    t.ok(e.message.startsWith('ENOENT'), 'fs.writeJSON did not write a file into a missing dir');
    mockFs.restore(); // Don't forget to restore!
  }

  mockFs({});
  await fs.writeJSON(filePath, fileContent, { ensureDir: true });
  t.deepEqual(await fs.readJSON(filePath), fileContent, 'fs.writeJSON writes a valid file into a new dir');
  mockFs.restore(); // Don't forget to restore!
});

test('fs.writeCSV', async t => {
  t.plan(3);
  const filePath = 'test/file.csv';
  const fileContent = [
    { title1: 'title1', title2: 'title2', title3: 'title3' },
    { title1: 'one', title2: 'two', title3: 'three' },
    { title1: 'example1', title2: 'example2', title3: 'example3' }
  ];
  const csvContent = `title1,title2,title3
one,two,three
example1,example2,example3
`;

  mockFs({});
  await fs.writeCSV(filePath, fileContent);
  t.deepEqual(await fs.readFile(filePath), csvContent, 'fs.writeCSV writes a valid file');
  mockFs.restore(); // Don't forget to restore!

  mockFs({});
  try {
    await fs.writeCSV(filePath, fileContent, { ensureDir: false });
  } catch (e) {
    t.ok(e.message.startsWith('ENOENT'), 'fs.writeCSV did not write a file into a missing dir');
    mockFs.restore(); // Don't forget to restore!
  }

  mockFs({});
  await fs.writeCSV(filePath, fileContent, { ensureDir: true });
  t.deepEqual(await fs.readFile(filePath), csvContent, 'fs.writeCSV writes a valid file into a new dir');
  mockFs.restore(); // Don't forget to restore!
});
