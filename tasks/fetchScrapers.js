import fastGlob from 'fast-glob';

export default async args => {
  console.log(`⏳ Fetching scrapers`);
  const filePaths = await fastGlob(['./scrapers/**/*.js']);
  const scrapers = await Promise.all(filePaths.map(filePath => import(`../${filePath}`))).then(modules => [...modules.map(module => module.default)]);
  console.log(`✅ Fetched ${scrapers.length} scrapers!`);

  return { ...args, scrapers };
};
