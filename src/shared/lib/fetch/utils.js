import extract from 'extract-zip';
import fs, { promises as fsp } from 'fs';
import got from 'got';
import { sep } from 'path';
import stream from 'stream';
import { promisify } from 'util';
import * as fs_ from '../fs.js';
import join from '../join.js';
import * as path from 'path';

const pipeline = promisify(stream.pipeline);

export const downloadFile = async (url, dest) => {
  await pipeline(got.stream(url), fs.createWriteStream(dest));
};

export const folderFromZipURL = async (url, folder) => {
  // downloads a zip from an URL and extracts into a folder
  // uses __cache__.json to cache the url and only download if needed

  const cacheFile = join(folder, '__cache__.json');

  try {
    const cache = await fs_.readJSON(cacheFile);
    const cacheURL = cache.url;
    if (cacheURL === url) {
      console.log(`  ZIP already downloaded: ${url}`);
      return;
    }
  } catch (err) {}

  console.log(`  Downloading ZIP: ${url}`);

  const projectTmp = path.resolve('tmp');
  await fsp.mkdir(projectTmp, { recursive: true });
  const tmpDir = await fsp.mkdtemp(`${projectTmp}${sep}`);
  const tmpZip = join(tmpDir, 'tmp.zip');

  try {
    await downloadFile(url, tmpZip);
  } catch (err) {
    console.error(`  Error downloading zip: ${err}`);
    throw err;
  }

  try {
    await extract(tmpZip, { dir: tmpDir });
    console.log('  Extraction complete');
  } catch (err) {
    console.error(`  Error extracting zip: ${err}`);
    throw err;
  }

  await fsp.unlink(tmpZip);
  await fs_.writeJSON(join(tmpDir, '__cache__.json'), { url });

  await fsp.mkdir(path.dirname(folder), { recursive: true });
  await fsp.rmdir(folder, { recursive: true });
  await fsp.rename(tmpDir, folder);
};
