import each from 'jest-each';
import * as mockFs from './__test_utils__/fs.js';

import * as fs from './fs.js';

describe('fs', () => {
  describe('exists', () => {
    const tests = [['test/somefile'], ['test/asubdirectory/somefile'], ['somefile']];

    each(tests).test('when given a path to an existing file, it returns true', async pathName => {
      mockFs.mock({
        [pathName]: 'file content'
      });

      expect(await fs.exists(pathName)).toBe(true);

      // Don't forget to restore!
      mockFs.restore();
    });

    each(tests).test('when given a path to a directory that exists, it returns true', async pathName => {
      mockFs.mock({
        [pathName]: {}
      });

      expect(await fs.exists(pathName)).toBe(true);

      // Don't forget to restore!
      mockFs.restore();
    });

    each(tests).test('when given a path to a file that does not exist, it returns false', async pathName => {
      mockFs.mock({});

      expect(await fs.exists(pathName)).toBe(false);

      // Don't forget to restore!
      mockFs.restore();
    });
  });

  describe('ensureDir', () => {
    const tests = [['test/somedir'], ['test/asubdirectory'], ['somedir']];

    each(tests).test('when given a path with missing directories, it creates the directories', async pathName => {
      mockFs.mock({});

      await fs.ensureDir(pathName);

      expect(await fs.exists(pathName)).toBe(true);

      // Don't forget to restore!
      mockFs.restore();
    });
  });

  describe('readFile', () => {
    test('when given an existing file path, it returns the file content', async () => {
      const filePath = 'test/file.txt';
      const fileContent = 'some content';

      mockFs.mock({
        [filePath]: fileContent
      });

      expect(await fs.readFile(filePath)).toBe(fileContent);

      // Don't forget to restore!
      mockFs.restore();
    });

    test('when given a file path that does not exist, it throws a ENOENT', async () => {
      const filePath = 'test/file.txt';

      mockFs.mock({});

      try {
        await fs.readFile(filePath);
      } catch (e) {
        expect(e.toString()).toMatch('ENOENT');
        // Don't forget to restore!
        mockFs.restore();
        return;
      }

      // Don't forget to restore!
      mockFs.restore();

      throw new Error('Test did not fail');
    });
  });

  describe('getFilesInDir', () => {
    test('when given a directory with files, it returns the file paths', async () => {
      const directory = 'test';
      const directoryFiles = ['test1.html', 'test2.csv'];

      mockFs.mock({
        [directory]: directoryFiles.reduce((dirContent, filePath) => {
          dirContent[filePath] = 'some content';
          return dirContent;
        }, {})
      });

      expect(await fs.getFilesInDir(directory)).toStrictEqual(directoryFiles);

      // Don't forget to restore!
      mockFs.restore();
    });

    test('when given a directory path that does not exist, it throws ENOENT', async () => {
      mockFs.mock({});

      try {
        await fs.getFilesInDir('testdir');
      } catch (e) {
        expect(e.toString()).toMatch('ENOENT');
        // Don't forget to restore!
        mockFs.restore();
        return;
      }

      // Don't forget to restore!
      mockFs.restore();

      throw new Error('Test did not fail');
    });
  });

  describe('readJSON', () => {
    test('when given an existing JSON file, it returns the file content', async () => {
      const filePath = 'test/file.json';
      const jsonContent = { test: 'it works!' };
      const fileContent = JSON.stringify(jsonContent);

      mockFs.mock({
        [filePath]: fileContent
      });

      expect(await fs.readJSON(filePath)).toStrictEqual(jsonContent);

      // Don't forget to restore!
      mockFs.restore();
    });

    test('when given a file path that does not exist, it throws a ENOENT', async () => {
      const filePath = 'test/file.json';

      mockFs.mock({});

      try {
        await fs.readJSON(filePath);
      } catch (e) {
        expect(e.toString()).toMatch('ENOENT');
        // Don't forget to restore!
        mockFs.restore();
        return;
      }

      // Don't forget to restore!
      mockFs.restore();

      throw new Error('Test did not fail');
    });
  });

  describe('readCSV', () => {
    test('when given an existing CSV file, it returns the file content', async () => {
      const filePath = 'test/file.csv';

      const csvContent = `
title1,title2,title3
one,two,three
example1,example2,example3`;

      const expected = [
        { title1: 'one', title2: 'two', title3: 'three' },
        { title1: 'example1', title2: 'example2', title3: 'example3' }
      ];

      mockFs.mock({
        [filePath]: csvContent
      });

      expect(await fs.readCSV(filePath)).toStrictEqual(expected);

      // Don't forget to restore!
      mockFs.restore();
    });

    test('when given a file path that does not exist, it throws a ENOENT', async () => {
      const filePath = 'test/file.csv';

      mockFs.mock({});

      try {
        await fs.readCSV(filePath);
      } catch (e) {
        expect(e.toString()).toMatch('ENOENT');
        // Don't forget to restore!
        mockFs.restore();
        return;
      }

      // Don't forget to restore!
      mockFs.restore();

      throw new Error('Test did not fail');
    });
  });

  describe('writeFile', () => {
    test('when given a file path and data, it writes to a file', async () => {
      const filePath = 'file.txt';
      const fileContent = 'some file content!';

      mockFs.mock({});

      await fs.writeFile(filePath, fileContent);

      expect(await fs.readFile(filePath)).toBe(fileContent);

      // Don't forget to restore!
      mockFs.restore();
    });

    test('when given a file path with a missing directory and ensureDir = false, it throws ENOENT', async () => {
      const filePath = 'test/file.txt';
      const fileContent = 'some file content!';

      mockFs.mock({});

      try {
        await fs.writeFile(filePath, fileContent, { ensureDir: false });
      } catch (e) {
        expect(e.toString()).toMatch('ENOENT');
        // Don't forget to restore!
        mockFs.restore();
        return;
      }

      // Don't forget to restore!
      mockFs.restore();

      throw new Error('Test did not fail');
    });

    test('when given a file path with missing directories and ensureDir = true, it writes to a file and create directories', async () => {
      const filePath = 'test/file.txt';
      const fileContent = 'some file content!';

      mockFs.mock({});

      await fs.writeFile(filePath, fileContent, { ensureDir: true });

      expect(await fs.readFile(filePath)).toBe(fileContent);

      // Don't forget to restore!
      mockFs.restore();
    });
  });

  describe('writeJSON', () => {
    test('when given a file path and JSON data, it writes to a file', async () => {
      const filePath = 'file.json';
      const fileContent = { test: 'some data' };

      mockFs.mock({});

      await fs.writeJSON(filePath, fileContent);

      expect(await fs.readJSON(filePath)).toStrictEqual(fileContent);

      // Don't forget to restore!
      mockFs.restore();
    });

    test('when given a file path with a missing directory and ensureDir = false, it throws ENOENT', async () => {
      const filePath = 'test/file.json';
      const fileContent = { test: 'some data' };

      mockFs.mock({});

      try {
        await fs.writeJSON(filePath, fileContent, { ensureDir: false });
      } catch (e) {
        expect(e.toString()).toMatch('ENOENT');
        // Don't forget to restore!
        mockFs.restore();
        return;
      }

      // Don't forget to restore!
      mockFs.restore();

      throw new Error('Test did not fail');
    });

    test('when given a file path with missing directories and ensureDir = true, it writes to a file and create directories', async () => {
      const filePath = 'test/file.json';
      const fileContent = { test: 'some data' };

      mockFs.mock({});

      await fs.writeJSON(filePath, fileContent, { ensureDir: true });

      expect(await fs.readJSON(filePath)).toStrictEqual(fileContent);

      // Don't forget to restore!
      mockFs.restore();
    });
  });

  describe('writeCSV', () => {
    test('when given a file path and CSV data, it writes to a file', async () => {
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

      mockFs.mock({});

      await fs.writeCSV(filePath, fileContent);

      expect(await fs.readFile(filePath)).toStrictEqual(csvContent);

      // Don't forget to restore!
      mockFs.restore();
    });

    test('when given a file path with a missing directory and ensureDir = false, it throws ENOENT', async () => {
      const filePath = 'test/file.json';
      const fileContent = [
        { title1: 'one', title2: 'two', title3: 'three' },
        { title1: 'example1', title2: 'example2', title3: 'example3' }
      ];

      mockFs.mock({});

      try {
        await fs.writeCSV(filePath, fileContent, { ensureDir: false });
      } catch (e) {
        expect(e.toString()).toMatch('ENOENT');
        // Don't forget to restore!
        mockFs.restore();
        return;
      }

      // Don't forget to restore!
      mockFs.restore();

      throw new Error('Test did not fail');
    });

    test('when given a file path with missing directories and ensureDir = true, it writes to a file and create directories', async () => {
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

      mockFs.mock({});

      await fs.writeCSV(filePath, fileContent, { ensureDir: true });

      expect(await fs.readFile(filePath)).toStrictEqual(csvContent);

      // Don't forget to restore!
      mockFs.restore();
    });
  });
});
