const imports = require('esm')(module);

const request = imports('request');
const yargs = imports('yargs');

const fs = imports('../src/shared/lib/fs.js');
const datetime = imports('../src/shared/lib/datetime/index.js').default;

const { argv } = yargs
  .scriptName('node ./scripts/status-slack-bot.js')
  .usage('$0 <cmd> [args]')
  .command('send [hook]', 'sends report.json to provided Slack Hook', yargs => {
    yargs.positional('hook', {
      type: 'string'
    });
  })
  .help();

const generateReport = async report => {
  const { sources, scrape, findFeatures, findPopulation, validate } = report;

  const filteredScaperErrors = scrape.errors.filter(error => error.type !== 'DeprecatedError');

  let valTitle = `- *${validate.errors.length}* invalid locations`;
  let valFooter = '';
  const maxValidationFailCount = 20;
  const displayValidationErrs = validate.errors
    .slice(0, maxValidationFailCount)
    .map(e => e.replace('United States', 'US'))
    .map(e => `  - ${e}`);
  if (displayValidationErrs.length < validate.errors.length) {
    valTitle = `${valTitle} (${displayValidationErrs.length} shown)`;
    valFooter = `_         ... and ${validate.errors.length - displayValidationErrs.length} more._`;
  }

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Report for ${datetime.now.utc()}:*`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `
_Sources:_
- *${sources.numSources}* sources
- *${sources.errors.length}* invalid sources:
${sources.errors.map(error => `  - ${error}`).join('\n')}`
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
- *${filteredScaperErrors.length}* scraper errors:
${filteredScaperErrors.map(error => `  - ${error.name}: ${error.err}`).join('\n')}`
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
        text: `
_Validate:_
${valTitle}:
${displayValidationErrs.join('\n')}
${valFooter}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Go to the full report: https://github.com/lazd/coronadatascraper/actions/runs/${process.env.RUN_NUMBER}`
      }
    }
  ];
};

const sendToSlack = async data => {
  request.post(
    argv.hook,
    {
      json: {
        blocks: data
      }
    },
    function(error, response, body) {
      if (error) {
        return console.error('ERROR POSTING TO SLACK:', error);
      }
      console.log('SERVER RESPONDED WITH:', body);
    }
  );
};

fs.readJSON('./dist/report.json')
  .then(generateReport)
  .then(sendToSlack);
