import { generateAdaptiveTheme } from '@adobe/leonardo-contrast-colors';
import * as fs from '../lib/fs.js';
// returns theme colors as JSON
function generateColors() {
  let cds_theme = generateAdaptiveTheme({
    baseScale: "Gray",
    colorScales: [
      {
        name: "Gray",
        colorKeys: [
          "#355166"
        ],
        colorspace: "RGB",
        ratios: [
          -1.2,
          -1.05,
          1,
          1.1,
          1.2,
          1.5,
          1.93,
          3.01,
          4.54,
          8,
          12.81
        ]
      },
      {
        name: "Blue",
        colorKeys: [
          "#21385e",
          "#829800",
          "#007e60",
          "#efef00"
        ],
        colorspace: "LCH",
        ratios: [
          3.2,
          4.8,
          7.4,
          11.7
        ]
      }
    ]
  });

  let cds_theme_light = cds_theme(97);

  let varPrefix = '--';
  let cssVariables = {};

  // Iterate each color object
  for (let i = 0; i < cds_theme_light.length; i++) {
    // Iterate each value object within each color object
    for(let j = 0; j < cds_theme_light[i].values.length; j++) {
      // output "name" of color and prefix
      let key = cds_theme_light[i].values[j].name;
      let prop = varPrefix.concat(key);
      // output value of color
      let value = cds_theme_light[i].values[j].value;
      // create CSS property with name and value
cssVariables[prop] = value;
    }
  }
  let cssString = Object.entries(cssVariables).map(v => {    
    return `${v.join(': ')};\n`
  });
  fs.writeFile('./site/colors.css', `.spectrum {\n${cssString}}\n`);
}
generateColors();
