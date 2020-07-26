/* globals d3, document */

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
  // display handles view controlling
  const display = {
    // Graph types
    // linearGraph: true for linear graph, false for logarithmic graph
    linearGraph: true,
    // overviewGraph: true for total overview of time, false for daily occurrences graph
    overviewGraph: true,

    // Data points to display
    cases: true,
    deaths: true,
    recovered: true,
    active: true,
    hospitalized: true,
    tested: false
  };

  //
  // Data
  //

  // Create an array of objects to work well with d3.nested
  // Functions to work in forEach loop of data

  const lines = [];

  // Pull in data
  const data = generateGraphData({ timeseries, location });

  data.forEach(d => {
    console.log(`${JSON.stringify(d)},`);
  });

  // Parse time for cross browser compatability
  const parseTime = d3.timeParse('%Y-%m-%d');

  // Determine the daily occurrences for each peace of data
  function countDay(key, d, i, arr) {
    // if (d[key === undefined]) {
    //   return 0;
    // }

    if (i === 0) {
      return d[key];
    }

    // Find the difference in data points between this date and the previous date and array iterator is > 0
    // If there is data for the previous date

    if (arr[i - 1][key] !== undefined) {
      return d[key] - arr[i - 1][key];
    }

    // If data points started being collected at dates after beginning of array
    // To avoid spike in data return the same daily count as the second date of data point

    if (arr[i + 1] !== undefined) {
      return arr[i + 1][key] - arr[i][key];
    }
  }

  function cleanDay(num) {
    // eslint-disable-next-line no-restricted-globals
    if (num === undefined || isNaN(num)) {
      return 0;
    }
    return num;
  }

  // Makes sure countDay is displayed correctly on graph being > 0
  function countDayPoint(num) {
    if (num < 0) {
      return 0;
    }
    return num;
  }

  // Make sure all data is > 0 for log calculations. log0 = undefined
  // If point is 0 set it to 1 for graphing purposes

  function countLog(obj) {
    if (obj.count <= 0) {
      obj.countLog = 1;
    } else {
      obj.countLog = obj.count;
    }
    return obj.countLog;
  }
  function countLogDay(obj) {
    if (obj.countDay <= 0) {
      obj.countLogDay = 1;
    } else {
      obj.countLogDay = obj.countDay;
    }
    return obj.countLogDay;
  }

  // Push an object with all data set for that day into lines array
  // Will use the data from data pulled in above
  function populatePoint(key, d, i, arr) {
    let obj = {};

    if (d[key] !== undefined && d[key] !== null) {
      obj.name = key;
      obj.count = d[key];
      obj.date = parseTime(d.date);
      obj.countDay = cleanDay(countDay(key, d, i, arr));
      obj.countDayPoint = countDayPoint(cleanDay(countDay(key, d, i, arr)));
      obj.countLog = countLog(obj);
      obj.countLogDay = countLogDay(obj);

      lines.push(obj);
      obj = {};
    }

    // Example for readability

    // if (d.cases !== undefined && d.cases !== null) {
    //   obj.name = 'cases';
    //   obj.count = d.cases;
    //   obj.date = parseTime(d.date);
    //   obj.countDay = countDay('cases', d, i, arr);
    //   obj.countLog = countLog(obj);
    //   obj.countLogDay = countLogDay(obj);

    //   lines.push(obj);
    //   obj = {};
    // }
  }

  // Add modified data object points to lines array
  // Add key for populatePoint of what you want to label key as
  data.forEach((d, i, arr) => {
    populatePoint('cases', d, i, arr);

    populatePoint('deaths', d, i, arr);

    populatePoint('recovered', d, i, arr);

    populatePoint('active', d, i, arr);

    populatePoint('tested', d, i, arr);

    populatePoint('hospitalized', d, i, arr);
  });

  // Filter lines for what is being displayed and toggled in legend
  function filterLines(d) {
    if (display.cases && d.name === 'cases') {
      return 1;
    }
    if (display.deaths && d.name === 'deaths') {
      return 1;
    }
    if (display.recovered && d.name === 'recovered') {
      return 1;
    }
    if (display.active && d.name === 'active') {
      return 1;
    }
    if (display.tested && d.name === 'tested') {
      return 1;
    }
    if (display.hospitalized && d.name === 'hospitalized') {
      return 1;
    }
  }

  //
  // Legend
  //

  // Data for generating legend
  const nestedLines = d3
    .nest()
    .key(d => d.name)
    .entries(lines);

  const legend = document.querySelector('.graph-legend-key-container');

  // legend.setAttribute('class', 'graph-legend');
  // legend.innerHTML = '<div class="graph-legend-key-container">';
  for (const d of nestedLines) {
    legend.innerHTML += `
        <div class="graph-legend-key-container" id="graph-legend-${d.key}">
          <div class="graph-legend-color graph-line-${d.key}"></div>
          <div class="graph-legend-key-name">${d.key}</div>
        </div>`;
  }
  // document.getElementById('graph').appendChild(legend);

  // Legend toggle buttons
  const legendCases = document.getElementById('graph-legend-cases');
  const legendDeaths = document.getElementById('graph-legend-deaths');
  const legendRecovered = document.getElementById('graph-legend-recovered');
  const legendActive = document.getElementById('graph-legend-active');
  const legendHospitalized = document.getElementById('graph-legend-hospitalized');
  const legendTested = document.getElementById('graph-legend-tested');

  // Appends legend onto graph and toggles for filtered lines result
  // Error check to make sure the area you are viewing has complete data or don't try to change style
  function applyLegend() {
    // document.getElementById('graph').appendChild(legend);

    // Toggle opacity of active data points in legend
    if (legendCases) {
      legendCases.style.opacity = display.cases === true ? 1 : 0.5;
    }
    if (legendDeaths) {
      legendDeaths.style.opacity = display.deaths === true ? 1 : 0.5;
    }
    if (legendRecovered) {
      legendRecovered.style.opacity = display.recovered === true ? 1 : 0.5;
    }
    if (legendActive) {
      legendActive.style.opacity = display.active === true ? 1 : 0.5;
    }
    if (legendHospitalized) {
      legendHospitalized.style.opacity = display.hospitalized === true ? 1 : 0.5;
    }
    if (legendTested) {
      legendTested.style.opacity = display.tested === true ? 1 : 0.5;
    }
  }

  //
  // Building graph
  //

  // set the dimensions and margins of the graph
  const el = document.querySelector('#graph');
  const margin = { top: 20, right: 10, bottom: 10, left: 45 };
  const width = el.offsetWidth - margin.left - margin.right - 10;
  const height = el.offsetHeight - margin.top - margin.bottom - 10;

  function generateGraph() {
    // Clear any previous graph and append legend
    d3.selectAll('#graph > *').remove();
    applyLegend();

    // Filter data for active data points and toggling
    const filteredLines = lines.filter(d => filterLines(d));

    // Data for drawing lines

    // append the svg object to the #graph of the page
    const svg = d3
      .select('#graph')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.right})`);

    //
    // Overview graph - Line Graph
    //

    function drawGraph() {
      const xValue = d => d.date;
      // const xLabel = 'date';
      // Set yValue depending on if display is set for linear graph or log graph, and for overview data or day count data
      const yValue = d => {
        if (display.linearGraph && display.overviewGraph) {
          return d.count;
        }
        if (display.linearGraph && !display.overviewGraph) {
          return d.countDayPoint;
        }
        if (!display.linearGraph && display.overviewGraph) {
          return d.countLog;
        }
        if (!display.linearGraph && !display.overviewGraph) {
          return d.countLogDay;
        }
      };
      // const yLabel = 'Population';

      //
      // Configure x scale
      //
      const xScale = d3
        .scaleTime()
        .domain(d3.extent(filteredLines, xValue))
        .range([0, width]);

      // gridlines in x axis function
      function makeXgridlines() {
        return d3.axisBottom(xScale).ticks(10);
      }

      g.append('g')
        .attr('class', 'graph-grid')
        .attr('transform', `translate(0,${height})`)
        .call(
          makeXgridlines()
            .tickSize(-height)
            .tickFormat('')
        );

      // Append x axis data onto chart
      g.append('g')
        .call(d3.axisBottom(xScale))
        .attr('transform', `translate(0,${height})`);
      // Append x axis label onto chart
      // g.append('text')
      //   .attr('class', 'bottom-axis-label')
      //   .attr('x', width / 2)
      //   .attr('y', height + margin.bottom)
      //   .text(xLabel);

      //
      // Configure y scale
      // Configure for depending on linear or logarithmic
      // Default is linear
      let yScale = d3
        .scaleLinear()
        .domain([0, d3.max(filteredLines, d => yValue(d))])
        .range([height, 0]);

      // Reassign yScale to be log graph

      if (display.linearGraph === false) {
        yScale = d3
          .scaleLog()
          .base(2)
          .domain([1, d3.max(filteredLines, d => yValue(d))])
          .range([height, 0]);
      }

      // gridlines on y axis function
      function makeYgridlines() {
        return d3.axisLeft(yScale).ticks(5);
      }
      // Add on y grid lines
      g.append('g')
        .attr('class', 'graph-grid')
        .call(
          makeYgridlines()
            .tickSize(-width)
            .tickFormat('')
        );

      // Add y axis data (domain / range )
      g.append('g').call(d3.axisLeft(yScale));
      // Add y axis title and positioning
      // x and y positioning reversed due to rotation
      // g.append('text')
      //   .attr('class', 'left-axis-label')
      //   .attr('transform', 'rotate(-90)')
      //   .attr('x', -height / 2)
      //   .attr('y', '-40px')
      //   .text(yLabel);

      // Create paths for lines for different data

      const nestedFiltered = d3
        .nest()
        .key(d => d.name)
        .entries(filteredLines);

      const lineGenerator = d3
        .line()
        .x(d => xScale(xValue(d)))
        .y(d => yScale(yValue(d)));
      // .curve(d3.curveBasis);
      // Draw lines
      g.selectAll('graph-line')
        .data(nestedFiltered)
        .enter()
        .append('path')
        .attr('class', d => `graph-line graph-line-${d.key}`)
        .attr('d', d => lineGenerator(d.values));

      //
      // Tooltips
      //
      // Tooltips and dots use filteredLines array

      const tooltip = d3
        .select('#graph')
        .append('div')
        .attr('class', 'graph-tooltip')
        .style('opacity', 0);

      const formatDate = date => {
        const dateF = {
          year: date.getUTCFullYear(),
          month: date.getUTCMonth() + 1,
          day: date.getUTCDate()
        };
        return `${dateF.month}/${dateF.day}/${dateF.year}`;
      };

      const tooltipHTML = ({ name, date, count, countDay }) => {
        return `
        <h3 class="graph-tooltip-title" style="color:var(--graph-color-${name})">${name}</h3>
        <p class="graph-tooltip-date">Date: ${formatDate(date)}</p>
        <p class="graph-tooltip-overview-count">Total ${name}: ${count}</p>
        <p class="graph-tooltip-daily-count">Today's ${name}: ${countDay}</p>
        `;
      };

      // Place tooltips so they load inside graph
      // Pass in mouse position as point
      // Need to have offset in a direction to not have weird effect
      function placeTooltipX(point) {
        const halfX = width / 2;
        if (point < halfX) {
          return point + 70;
        }
        return point - 120;
      }

      function placeTooltipY(point) {
        const halfY = height / 2;
        if (point < halfY) {
          return point - 20;
        }
        return point - 100;
      }

      const mouseover = function() {
        tooltip.style('opacity', 1);
      };

      const mousemove = function(d) {
        tooltip
          .html(tooltipHTML(d))
          .style('left', `${placeTooltipX(d3.mouse(this)[0])}px`)
          .style('top', `${placeTooltipY(d3.mouse(this)[1])}px`);
      };

      const mouseleave = function() {
        tooltip
          .transition()
          .duration(200)
          .style('opacity', 0);
      };

      // Draw dots with filtered lines for tooltips
      g.selectAll('circle')
        .data(filteredLines)
        .enter()
        .append('circle')
        .attr('cy', d => yScale(yValue(d)))
        .attr('cx', d => xScale(xValue(d)))
        .attr('r', 3)
        .attr('class', d => `graph-circle graph-circle-${d.name}`)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave);
    }

    drawGraph();
  }
  generateGraph();

  //
  // Event listeners
  //

  // Event listeners for legend
  // Error check to make sure the area you are viewing has complete data or don't make a button for it
  if (legendCases) {
    legendCases.addEventListener('click', () => {
      display.cases = !display.cases;
      generateGraph();
    });
  }
  if (legendDeaths) {
    legendDeaths.addEventListener('click', () => {
      display.deaths = !display.deaths;
      generateGraph();
    });
  }
  if (legendRecovered) {
    legendRecovered.addEventListener('click', () => {
      display.recovered = !display.recovered;
      generateGraph();
    });
  }
  if (legendActive) {
    legendActive.addEventListener('click', () => {
      display.active = !display.active;
      generateGraph();
    });
  }
  if (legendHospitalized) {
    legendHospitalized.addEventListener('click', () => {
      display.hospitalized = !display.hospitalized;
      generateGraph();
    });
  }
  if (legendTested) {
    legendTested.addEventListener('click', () => {
      display.tested = !display.tested;
      generateGraph();
    });
  }

  const btnOverview = document.getElementById('graph-btn-overview');
  const btnDailyCount = document.getElementById('graph-btn-daily');
  const btnLinear = document.getElementById('graph-btn-linear');
  const btnLog = document.getElementById('graph-btn-log');

  btnOverview.addEventListener('click', () => {
    display.overviewGraph = true;
    generateGraph();
  });

  btnDailyCount.addEventListener('click', () => {
    display.overviewGraph = false;
    generateGraph();
  });

  btnLinear.addEventListener('click', () => {
    display.linearGraph = true;
    generateGraph();
  });

  btnLog.addEventListener('click', () => {
    display.linearGraph = false;
    generateGraph();
  });
}

export default showGraph;
