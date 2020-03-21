import fastGlob from 'fast-glob';

export default async args => {
  console.log(`⏳ Fetching scrapers`);
  const filePaths = await fastGlob(['./scrapers/**/*.js']);
  const sources = await Promise.all(filePaths.map(filePath => import(`../${filePath}`))).then(modules => [...modules.map(module => module.default)]);
  console.log(`✅ Fetched ${sources.length} scrapers!`);

  return { ...args, sources };
};
