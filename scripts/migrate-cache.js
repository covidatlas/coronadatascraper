const imports = require('esm')(module);
const { join, parse, sep } = require('path');
const fs = require('fs');
const { ZoneId, ZonedDateTime } = require('@js-joda/core');
require('@js-joda/timezone/dist/js-joda-timezone-10-year-range');
const fastGlob = require('fast-glob');

// New cache app files
const newCache = join(process.cwd(), 'src', 'shared', 'lib', 'fetch', 'caching', 'new');
const convertTS = imports(join(newCache, '_convert-timestamp.js')).default;
const hash = imports(join(newCache, '_hash.js')).default;

function cast(date, tz) {
  const parsed = ZonedDateTime.parse(date);
  return parsed.withZoneSameInstant(ZoneId.of(tz)).toString();
}

(async () => {
  const start = Date.now();
  let counter = 0;
  const gross = f => !f.includes('.DS_Store') && !f.includes('.git');

  /**
   * Old stuff
   */
  const oldCacheDir = join(process.cwd(), 'coronadatascraper-cache');
  let folders = fs.readdirSync(oldCacheDir);
  folders = folders.filter(gross);
  console.log(`Found ${folders.length} cache folders`);

  // Sanity check
  const beforeFiles = fastGlob.sync([join(oldCacheDir, '**')]);
  const beforeFiltered = beforeFiles.filter(gross);
  const sanity = beforeFiltered.length;
  console.log(`Found ${sanity} total files`);

  // Let's go
  for (const folder of folders) {
    // Pad those date parts month
    const date = folder
      .split('-')
      .map(part => {
        if (part.length === 1) return `0${part}`;
        return part;
      })
      .join('-');
    // DST was March 8, cache starts March 12, so this is fine to hardcode as -07:00 (for now)
    const ts = `${date}T21:00:00-07:00`;
    const castUTC = cast(ts, 'UTC');

    // JS Joda doesn't output directly to 8601 and it's faster for me to just do this
    const iso = castUTC.replace('Z[UTC]', ':00.000Z');
    const fileTs = convertTS.Z8601ToFilename(iso);

    // Cache dir contents
    const dir = join(oldCacheDir, folder);
    let files = fs.readdirSync(dir);
    files = files.filter(gross);

    // Move 'em
    for (const file of files) {
      const filePath = join(dir, file);
      let contents = fs.readFileSync(filePath);
      contents = hash(contents, 5);
      const parsed = parse(filePath);

      const folder = join(process.cwd(), 'crawler-cache', parsed.name.substr(0, 10));

      fs.mkdirSync(folder, { recursive: true });
      const finalName = `${fileTs}-${contents}${parsed.ext}`;
      const newFilePath = join(folder, finalName);

      const strip = i => i.replace(process.cwd() + sep, '');
      console.log(`Moving...`);
      console.log(`  From:`, strip(filePath));
      console.log(`    To:`, strip(newFilePath));
      console.log('');

      fs.copyFileSync(filePath, newFilePath);
      ++counter;
    }
  }

  console.log(`Moved ${counter} cache files!\n`);
  console.log(`Old cache files ... `, sanity);
  console.log(`New cache files ... `, counter);
  if (sanity !== counter) {
    console.log('🚨 CACHE DID NOT MIGRATE CORRECTLY');
  } else console.log(`Cache sucessfully migrated in ${Date.now() - start}ms!`);
})();
