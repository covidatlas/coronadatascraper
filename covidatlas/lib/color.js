/* globals document */

import * as d3interpolate from 'd3-interpolate';
import * as d3scale from 'd3-scale';

const choroplethColor = 'magma';

export const noCasesColor = '#ffffff';
export const noPopulationDataColor = 'rgba(0,0,0,0)';

export const outlineColorHighlight = 'rgb(0,0,0)';
export const outlineColor = 'rgba(0, 0, 0, 0.3)';

const choroplethColors = {
  stoplight: ['#eeffcd', '#b4ffa5', '#ffff00', '#ff7f00', '#ff0000'],
  yellowOrangePurple: [
    '#fff5bd',
    '#ffb500',
    '#ff7e00',
    '#f24b0d',
    '#cd311f',
    '#b10048',
    '#7c0864',
    '#4a185a',
    '#2b123e',
    '#140321'
  ],
  yellowOrangeRed: [
    '#fff5bd',
    '#fce289',
    '#fcce54',
    '#ffb601',
    '#ff8f00',
    '#fd6100',
    '#e03d19',
    '#b52725',
    '#801f28',
    '#4b1a21'
  ],
  heat: ['#FFFFFF', '#ffff5e', '#ffe70c', '#fead0a', '#fd6f08', '#fd2907', '#fd0407'],
  peach: ['rgb(253,222,166)', 'rgb(255,188,134)', 'rgb(249,152,133)', 'rgb(232,110,129)', 'rgb(224,88,136)'],
  pink: [
    'rgb(255, 244, 221)',
    'rgb(255, 221, 215)',
    'rgb(255, 197, 210)',
    'rgb(254, 174, 203)',
    'rgb(250, 150, 196)',
    'rgb(245, 126, 189)',
    'rgb(239, 100, 181)',
    'rgb(232, 70, 173)',
    'rgb(210, 56, 161)',
    'rgb(187, 46, 150)',
    'rgb(163, 36, 140)',
    'rgb(138, 27, 131)',
    'rgb(113, 22, 124)',
    'rgb(86, 15, 116)',
    'rgb(55, 11, 110)',
    'rgb(0, 9, 104)'
  ],
  viridis: [
    '#fde725',
    '#d8e219',
    '#addc30',
    '#84d44b',
    '#5ec962',
    '#3fbc73',
    '#28ae80',
    '#1fa088',
    '#21918c',
    '#26828e',
    '#2c728e',
    '#33638d',
    '#3b528b',
    '#424086',
    '#472d7b',
    '#48186a'
  ],
  magma: [
    '#fcfdbf',
    '#fde2a3',
    '#fec488',
    '#fea772',
    '#fc8961',
    '#f56b5c',
    '#e75263',
    '#d0416f',
    '#b73779',
    '#9c2e7f',
    '#832681',
    '#6a1c81',
    '#51127c',
    '#36106b',
    '#1d1147',
    '#0a0822'
  ]
};

let domainArray = [];
const colorsArray = choroplethColors[choroplethColor];

// Create domains array equal to number of colors
// distribution of lightness/colors handled outside of this tool
for (let i = 0; i < colorsArray.length; i++) {
  let inc;
  if (i === 0) {
    inc = 0;
  } else {
    inc = i / colorsArray.length;
  }
  domainArray.push(inc);
}
domainArray = domainArray.sort();

export const fill = d3scale
  .scaleLinear()
  .domain(domainArray)
  .range(colorsArray)
  .interpolate(d3interpolate.interpolateHcl);

function ramp(color, n, containerId) {
  const base = document.getElementById(containerId);
  const canvas = document.createElement('canvas');
  base.appendChild(canvas);
  canvas.setAttribute('width', `${n}px`);
  canvas.setAttribute('height', '16px');
  const context = canvas.getContext('2d');

  canvas.style.width = `${n}px`;
  canvas.style.height = '16px';
  canvas.style.imageRendering = 'pixelated';

  for (let i = 0; i < n; ++i) {
    context.fillStyle = color(i / (n - 1));
    context.fillRect(i, 0, 1, 32);
  }
  return canvas;
}

export function getScaledColorValue(location, locationData, type, worstAffectedPercent) {
  // Color based on how bad it is, relative to the worst place
  const affectedPercent = locationData[type] / location.population;
  const percentRatio = affectedPercent / worstAffectedPercent;

  return fill(percentRatio);
}

export function createLegend(min, max) {
  const base = document.getElementById('map');
  const containerId = 'mapLegend';
  const container = base.querySelector(`#${containerId}`) || document.createElement('div');
  container.innerHTML = '';
  container.id = containerId;

  const heading = document.createElement('span');
  heading.className = 'spectrum-Heading spectrum-Heading--XXXS';
  heading.innerHTML = 'Percent of population infected';
  container.appendChild(heading);

  base.appendChild(container);
  ramp(fill, 300, containerId);

  // Correct value of max percent so that it's easier to parse
  const lowestPercent = (min * 100).toFixed(8);
  const worstPercent = (max * 100).toFixed(2);

  const scaleText = document.createElement('span');
  scaleText.className = 'mapLegend-scaleLabels';
  const startText = document.createElement('span');
  startText.className = 'spectrum-Body spectrum-Body--XS';
  startText.innerHTML = `${lowestPercent}%`;
  const endText = document.createElement('span');
  endText.className = 'spectrum-Body spectrum-Body--XS';
  endText.innerHTML = `${worstPercent}%`;
  scaleText.appendChild(startText);
  scaleText.appendChild(endText);
  container.appendChild(scaleText);
}
