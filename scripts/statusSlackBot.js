const imports = require('esm')(module);

const request = imports('request');
const yargs = imports('yargs');

const fs = imports('../lib/fs.js');
const datetime = imports('../lib/datetime.js');

const { argv } = yargs
  .scriptName('node ./scripts/statusSlackBot.js')
  .usage('$0 <cmd> [args]')
  .command('send [hook]', 'sends report.json to provided Slack Hook', yargs => {
    yargs.positional('hook', {
      type: 'string'
    });
  })
  .help();

const generateReport = async report => {
  const { scrape, findFeatures, findPopulation } = report;

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Report for ${datetime.getDate().toUTCString()}:*`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `
_Scrapers:_
- *${scrape.numCities}* cities
- *${scrape.numCounties}* counties
- *${scrape.numStates}* states
- *${scrape.numCountries}* countries
- *${scrape.numErrors}* scraper errors:
${scrape.errors.map(error => `  - ${error.name}: ${error.err}`).join('\n')}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `
_Features:_
- *${findFeatures.numFeaturesFound}* locations matched
- *${findFeatures.missingFeatures.length}* locations with missing features`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `
_Populations:_
- *${findPopulation.numLocationsWithPopulation}* locations matched
- *${findPopulation.missingPopulations.length}* locations with missing populations`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Go to the data: http://blog.lazd.net/coronadatascraper`
      }
    }
  ];
};

const sendToSlack = async data => {
  request.post(argv.hook, {
    json: {
      blocks: data
    }
  });
};

fs.readJSON('./dist/report.json')
  .then(generateReport)
  .then(sendToSlack);
