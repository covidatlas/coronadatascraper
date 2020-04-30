/* globals Chart, document */

let chart;

const changeSizes = opts => {
  // if (document.body.offsetWidth <= 960 && typeof opts.title.text === 'string') {
  //   opts.title.text = opts.title.text.split(/, */);
  // } else if (document.body.offsetWidth > 960 && typeof opts.title.text !== 'string') {
  //   opts.title.text = opts.title.text.join(', ');
  // }

  const y = opts.scales.yAxes[0];
  if (document.body.offsetHeight <= 425) {
    [y.scaleLabel.labelString] = y.types;
  } else {
    y.scaleLabel.labelString = `${y.types[0]}`;
  }
};

const options = {
  maintainAspectRatio: false,
  // title: {
  //   display: true,
  //   fontSize: 20
  // },
  scales: {
    xAxes: [
      {
        type: 'time',
        distribution: 'linear',
        time: {
          minUnit: 'day'
        },
        ticks: {
          major: {
            enabled: true,
            fontStyle: 'bold'
          },
          autoSkip: true,
          source: 'data',
          sampleSize: 100
        }
      }
    ],
    yAxes: [
      {
        type: 'linear',
        gridLines: {
          drawBorder: false
        },
        major: {
          enabled: true,
          fontStyle: 'bold'
        },
        types: ['Linear', 'Logarithmic'],
        scaleLabel: {
          display: true,
          labelString: 'Linear'
        },
        ticks: {
          autoSkip: true,

          userCallback(label) {
            if (this.options.type === 'linear') {
              return label;
            }
            const remain = label / 10 ** Math.floor(Chart.helpers.log10(label));
            if (remain === 1 || remain === 2 || remain === 5) {
              return label;
            }
          }
        }
      }
    ]
  },
  legend: {
    labels: {
      usePointStyle: true,
      filter(labelItem, data) {
        const curr = data.datasets.find(d => d.label === labelItem.text);
        if (curr.data.length) {
          return labelItem;
        }
      }
    }
  },
  tooltips: {
    intersect: false,
    mode: 'nearest',
    position: 'nearest',
    axis: 'x',
    callbacks: {
      title(tooltipItem) {
        // lol Safari hates zero padded dates and we can't access moment, so hooray for jank
        const [year, month, day] = tooltipItem[0].label.split('-').map(n => parseInt(n, 10));
        return new Date(year, month - 1, day).toLocaleDateString();
      },
      label(tooltipItem, data) {
        let label = data.datasets[tooltipItem.datasetIndex].label || '';
        if (label) {
          label += ': ';
        }
        label += parseInt(tooltipItem.value, 10);
        return label;
      }
    }
  },
  events: ['mousemove', 'mouseout', 'click'],
  onClick() {
    const y = this.options.scales.yAxes[0];
    const types = y.types.reverse();
    y.type = types[0].toLowerCase();

    changeSizes(this.options);
    this.update();
    this.render();
  },
  onResize(_chart) {
    changeSizes(_chart.options);
  }
};

const showGraph = ({ timeseries, location }) => {
  const casesData = [];
  const activeData = [];
  const deathsData = [];
  const testedData = [];
  const recoveredData = [];

  const locationData = Object.keys(timeseries).map(date => {
    return {
      date,
      ...timeseries[date][location.id]
    };
  });

  locationData.forEach(day => {
    const date = `${day.date} 12:00:00Z`;

    if (day.cases)
      casesData.push({
        y: day.cases,
        t: date
      });

    if (day.tested)
      testedData.push({
        y: day.tested,
        t: date
      });

    if (day.active)
      activeData.push({
        y: day.active,
        t: date
      });

    if (day.deaths)
      deathsData.push({
        y: day.deaths,
        t: date
      });

    if (day.recovered)
      recoveredData.push({
        y: day.recovered,
        t: date
      });
  });

  const lineSettings = {
    type: 'line',
    lineTension: 0.1,
    borderWidth: 1.5,
    spanGaps: true,
    fill: false
  };

  const data = {
    datasets: [
      {
        label: 'Total Cases',
        borderColor: '#d47700',
        backgroundColor: '#d47700',
        data: casesData,
        ...lineSettings
      },
      // {
      //   label: 'Active Cases',
      //   borderColor: '#FF0000',
      //   backgroundColor: 'white',
      //   data: activeData,
      //   ...lineSettings
      // },
      // {
      //   label: 'Tested',
      //   borderColor: 'orange',
      //   backgroundColor: 'orange',
      //   data: testedData,
      //   ...lineSettings
      // },
      {
        label: 'Deaths',
        borderColor: '#c12121',
        backgroundColor: '#c12121',
        data: deathsData,
        ...lineSettings
      },
      {
        label: 'Recovered',
        borderColor: '#4c9e0f',
        backgroundColor: '#4c9e0f',
        data: recoveredData,
        ...lineSettings
      }
    ]
  };

  options.scales.xAxes[0].ticks.max = casesData[casesData.length - 1].t;
  // options.title.text = location.name;
  changeSizes(options);

  if (chart) {
    chart.options = options;
    chart.data = data;
    chart.update();
    chart.render();
  } else {
    Chart.defaults.global.defaultFontFamily = 'aglet-slab, sans-serif';
    Chart.defaults.global.defaultFontSize = 16;
    Chart.defaults.global.defultFontColor = '#334E62';

    chart = new Chart('graph', { data, options });
  }

  document.getElementById('graph-elements').style.visibility = 'visible';
};

export default showGraph;
