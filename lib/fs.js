import fs from 'fs';

async function exists(filePath) {
  return await fs.promises.access(filePath, fs.constants.R_OK).then(() => true).catch(() => false);
}

async function readFile(filePath) {
  return await fs.promises.readFile(filePath);
}

async function writeFile(filePath, data) {
  return await fs.promises.writeFile(filePath, data);
}

export { readFile, writeFile, exists};
