/* globals d3, document */

const fields = [
  {
    name: 'cases',
    color: 'orange'
  },
  {
    name: 'deaths',
    color: 'red'
  }
  // todo: what to do about tested?
  // {
  //   name: 'recovered',
  //   color: 'green'
  // },
  // {
  //   name: 'hospitalized',
  //   color: 'red'
  // },
  // {
  //   name: 'discharged',
  //   color: 'red'
  // }
];
/*
  [
    date: 'YYYY-MM-DD'
  ]
*/

function generateGraphData({ timeseries, location }) {
  const graphData = [];
  for (const date in timeseries) {
    if (!timeseries[date][location.id] || !timeseries[date][location.id].cases) {
      continue;
    }
    const obj = {
      ...timeseries[date][location.id],
      date
    };
    graphData.push(obj);
  }

  return graphData;
}

function showGraph({ timeseries, location }) {
  const data = generateGraphData({ timeseries, location });

  const el = document.querySelector('#graph');
  // set the dimensions and margins of the graph
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const width = el.offsetWidth - margin.left - margin.right;
  const height = el.offsetHeight - margin.top - margin.bottom;

  // parse the date / time
  const parseTime = d3.timeParse('%Y-%m-%d');

  // set the ranges
  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  function getDate(d) {
    return x(d.date);
  }

  function getField(field) {
    return function(d) {
      // show 0 if there is no data
      return y(d[field] || 0);
    };
  }

  // append the svg obgect to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  const svg = d3
    .select('#graph')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // format the data
  data.forEach(function(d) {
    d.date = parseTime(d.date);
  });

  // Scale the range of the data
  x.domain(
    d3.extent(data, function(d) {
      return d.date;
    })
  );
  y.domain([
    0,
    d3.max(data, function(d) {
      return Math.max(...fields.map(f => d[f.name]).filter(f => typeof f === 'number'));
    })
  ]);

  for (const field of fields) {
    const line = d3
      .line()
      .x(getDate)
      .y(getField(field.name));

    svg
      .append('path')
      .data([data])
      .attr('class', 'ca-Graph-line')
      .style('stroke', field.color)
      .attr('d', line);
  }

  // Add the X Axis
  svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Add the Y Axis
  svg.append('g').call(d3.axisLeft(y));
}

export default showGraph;
