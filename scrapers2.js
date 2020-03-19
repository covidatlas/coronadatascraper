import fastGlob from 'fast-glob';

export default async () => {
	const filePaths = await fastGlob(['./scrapers/**/*.js']);
	return await Promise.all(
		filePaths.map(filePath => import(filePath)))
			.then(modules => [
				...modules.map(module => module.default)
		]);
};

// export { loadScrapers }