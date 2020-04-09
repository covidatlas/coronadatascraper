import { generateAdaptiveTheme } from '@adobe/leonardo-contrast-colors';
import * as fs from '../src/shared/lib/fs.js';
// returns theme colors as JSON
function generateColors() {
  const cdsTheme = generateAdaptiveTheme({
    baseScale: 'Gray',
    colorScales: [
      {
        name: 'Gray',
        colorKeys: ['#355166'],
        colorspace: 'RGB',
        ratios: [-1.2, -1.05, 1, 1.1, 1.2, 1.5, 1.93, 3.01, 4.54, 8, 12.81]
      },
      {
        name: 'Blue',
        colorKeys: ['#21385e', '#829800', '#007e60', '#efef00'],
        colorspace: 'LCH',
        ratios: [3.2, 4.8, 7.4, 11.7]
      }
    ]
  });

  const cdsThemeLight = cdsTheme(100);

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

  fs.writeFile('./site/colors.css', `.spectrum--light {\n${cssString}}\n`);
}
generateColors();
