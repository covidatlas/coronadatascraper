const imports = require('esm')(module);

const fs = imports('../src/shared/lib/fs.js');

const { generateAdaptiveTheme } = imports('@adobe/leonardo-contrast-colors');

// returns theme colors as JSON
function generateColors() {
  const cdsTheme = generateAdaptiveTheme({
    baseScale: 'Gray',
    colorScales: [
      {
        name: 'Blue',
        colorKeys: ['#388de1', '#1e0a46'],
        colorspace: 'CAM02',
        ratios: [3.46, 4.51, 6, 8, 11, 14.5, 17.69]
      },
      {
        name: 'Gray',
        colorKeys: ['#1e0a46'],
        colorspace: 'CAM02',
        ratios: [1.15, 1.5, 3, 4.5, 6, 8, 17.69, 21]
      }
    ]
  });

  const cdsThemeLight = cdsTheme(97);

  const varPrefix = '--';
  const cssVariables = {};

  // Iterate each color object
  // for (let i = 0; i < cdsThemeLight.length; i++) {
  for (const colorTheme of cdsThemeLight) {
    console.log(cdsThemeLight);
    if (colorTheme.values) {
      for (const value of colorTheme.values) {
        // output "name" of color and prefix
        const key = value.name;
        const prop = varPrefix.concat(key);
        // create CSS property with name and value
        cssVariables[prop] = value.value;
      }
    }
  }

  const cssArray = Object.entries(cssVariables).map(v => {
    return `${v.join(': ')};\n`;
  });
  const cssString = cssArray.toString().replace(/,/g, '');

  fs.writeFile('./covidatlas/colors.css', `.spectrum {\n${cssString}}\n`);
}
generateColors();
