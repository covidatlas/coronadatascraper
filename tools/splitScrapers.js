import Parser from 'acorn';
import escodegen from 'escodegen';
import slugify from 'slugify';
import prettier from 'prettier';
import * as fs from '../lib/fs.js';

const scraperImportsAndComments = (dots, scraperDefinition) => {
  const IMPORT_PATH = `import path from 'path`;
  const IMPORT_LIBS = ['fetch', 'parse', 'transform', 'datetime', 'rules', 'fs'];

  let imports = ``;
  if (scraperDefinition.includes('path.')) {
    imports += `${IMPORT_PATH}\n`;
  }

  IMPORT_LIBS.forEach(lib => {
    if (scraperDefinition.includes(`${lib}.`)) {
      imports += `import * as ${lib} from '..${dots}/lib/${lib}.js'\n`;
    }
  });

  let commentBlock = `/*
  Each scraper must return the following object or an array of the following objects:

  {
    city: String†,
    county: String†,   // County or region name, complete with "County" or "Parish" at the end
    country: String†,  // ISO 3166-1 alpha-3 country code
    cases: Integer,    // Confirmed cases (including presumptive)
    deaths: Integer,
    recovered: Integer,
    tested: Integer
  }

  † Optional, not required if provided in the main scraper definition
*/

// Set county to this if you only have state data, but this isn't the entire state\n`;

  if (scraperDefinition.includes('UNASSIGNED')) {
    commentBlock += `const UNASSIGNED = '(unassigned)';`;
  } else {
    commentBlock += `//const UNASSIGNED = '(unassigned)';`;
  }

  return `${imports}\n\n${commentBlock}`;
};

const writeScraperToFile = async (props, scraperDefinition) => {
  let dirPath = 'scrapers';
  let filepath = 'index.js';
  let dots = '';

  if (props.country) {
    dirPath += `/${props.country}`;
    dots += '/..';
  }

  if (props.state) {
    dirPath += `/${props.state}`;
    dots += '/..';
  }

  if (props.county) {
    const countySlug = slugify(props.county, { lower: true });
    filepath = `${countySlug}.js`;
  }

  let code = scraperImportsAndComments(dots, scraperDefinition);
  code += '\n\n';
  code += `const scraper = ${scraperDefinition}`;
  code += '\n\n';
  code += 'export default scraper;\n';

  code = prettier.format(code, {
    parser: 'babel',
    singleQuote: true,
    endOfLine: 'auto'
  });

  await fs.ensureDir(dirPath);
  await fs.writeFile(`${dirPath}/${filepath}`, code);
};

const getScraperProperties = scraper => {
  const props = {
    country: null,
    state: null,
    county: null
  };

  scraper.properties.forEach(prop => {
    if (prop.key.name in props) {
      props[prop.key.name] = prop.value.value;
    }
  });

  return props;
};

const splitScrapers = async () => {
  try {
    const fileName = 'scrapers.js';
    const file = await fs.readFile(fileName);

    const ast = Parser.parse(file.toString(), {
      sourceType: 'module'
    });

    let scrapers = [];
    ast.body.forEach(node => {
      if (node.type === 'VariableDeclaration' && node.kind === 'const') {
        node.declarations.forEach(declaration => {
          if (declaration.id.name === 'scrapers') {
            scrapers = declaration.init.elements;
          }
        });
      }
    });

    // now let's loop through our scrapers and get the code!
    scrapers.forEach(scraper => {
      const props = getScraperProperties(scraper);
      const scraperCode = escodegen.generate(scraper);
      writeScraperToFile(props, scraperCode);
    });
  } catch (err) {
    console.error(err);
  }
};

splitScrapers();
