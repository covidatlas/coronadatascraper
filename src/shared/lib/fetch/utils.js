import extract from 'extract-zip';
import fs, { promises as fsp } from 'fs';
import got from 'got';
import os from 'os';
import path, { sep } from 'path';
import stream from 'stream';
import { promisify } from 'util';
import * as fs_ from '../fs.js';

const pipeline = promisify(stream.pipeline);

export const downloadFile = async (url, dest) => {
  await pipeline(got.stream(url), fs.createWriteStream(dest));
};

export const folderFromZipURL = async (url, folder, debug = false) => {
  // downloads a zip from an URL and extracts into a folder
  // uses __cache__.json to cache the url and only download if needed

  try {
    const cache = await fs_.readJSON(path.join(folder, '__cache__.json'));
    const cacheURL = cache.url;
    if (cacheURL === url) {
      if (debug) {
        console.log(`  ZIP already downloaded: ${url}`);
      }
      return;
    }
    // eslint-disable-next-line no-empty
  } catch (err) {}

  console.log(`  Downloading ZIP: ${url}`);

  const osTmp = os.tmpdir();
  const tmpDir = await fsp.mkdtemp(`${osTmp}${sep}`);
  const tmpZip = path.join(tmpDir, 'tmp.zip');

  try {
    await downloadFile(url, tmpZip);
  } catch (err) {
    console.error(`  Error downloading zip: ${err}`);
    await fsp.rmdir(tmpDir, { recursive: true });
    throw err;
  }

  try {
    await extract(tmpZip, { dir: tmpDir });
    console.log('  Extraction complete');
  } catch (err) {
    console.error(`  Error extracting zip: ${err}`);
    await fsp.rmdir(tmpDir, { recursive: true });
    throw err;
  }

  await fsp.unlink(tmpZip);
  await fs_.writeJSON(path.join(tmpDir, '__cache__.json'), { url }, { silent: true });

  await fsp.mkdir(path.dirname(folder), { recursive: true });
  await fsp.rmdir(folder, { recursive: true });
  await fsp.rename(tmpDir, folder);
};
