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
        ratios: [1, 1.15, 1.5, 3, 4.5, 6, 8, 17.69, 21]
      }
    ]
  });

  const cdsThemeLight = cdsTheme(100);
  const cdsThemeDark = cdsTheme(8);

  const varPrefix = '--';
  const cssLightVariables = {};
  const cssStaticVariables = {};
  const cssDarkVariables = {};

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
        cssLightVariables[prop] = value.value;
      }
    } else if (colorTheme.background) {
      const key = 'BackgroundColor';
      const prop = varPrefix.concat(key);
      // create CSS property with name and value
      cssLightVariables[prop] = colorTheme.background;
    }
  }

  const cssLightArray = Object.entries(cssLightVariables).map(v => {
    return `${v.join(': ')};\n`;
  });
  const cssLightString = cssLightArray.toString().replace(/,/g, '');

  // Static colors
  for (const colorTheme of cdsThemeLight) {
    console.log(cdsThemeLight);
    if (colorTheme.values) {
      for (const value of colorTheme.values) {
        // output "name" of color and prefix
        const staticPrefix = 'static';
        const pref = varPrefix.concat(staticPrefix);
        const key = value.name;
        const prop = pref.concat(key);
        // create CSS property with name and value
        cssStaticVariables[prop] = value.value;
      }
    }
  }

  const cssStaticArray = Object.entries(cssStaticVariables).map(v => {
    return `${v.join(': ')};\n`;
  });
  const cssStaticString = cssStaticArray.toString().replace(/,/g, '');

  // Create dark theme
  for (const colorTheme of cdsThemeDark) {
    console.log(cdsThemeDark);
    if (colorTheme.values) {
      for (const value of colorTheme.values) {
        // output "name" of color and prefix
        const key = value.name;
        const prop = varPrefix.concat(key);
        // create CSS property with name and value
        cssDarkVariables[prop] = value.value;
      }
    } else if (colorTheme.background) {
      const key = 'BackgroundColor';
      const prop = varPrefix.concat(key);
      // create CSS property with name and value
      cssDarkVariables[prop] = colorTheme.background;
    }
  }

  const cssDarkArray = Object.entries(cssDarkVariables).map(v => {
    return `${v.join(': ')};\n`;
  });
  const cssDarkString = cssDarkArray.toString().replace(/,/g, '');

  fs.writeFile(
    './covidatlas/colors.css',
    `.spectrum--light, .spectrum--dark {\n${cssStaticString}}\n` +
      `.spectrum--light {\n${cssLightString}}\n` +
      `.spectrum--dark {\n${cssDarkString}}\n`
  );
}
generateColors();
