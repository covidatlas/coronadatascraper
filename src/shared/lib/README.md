# Library

A number of functions are available in separate modules to help write parsers.

## `fetch`

`import * as fetch from './lib/fetch/index.js'`


#### `await fetch.page(url)`

Load the webpage at the given URL and return a Cheerio object

**Returns:** [Cheerio](https://cheerio.js.org/) object


#### `await fetch.json(url)`

Load and parse JSON from the given URL

**Returns:** Object


#### `await fetch.csv(url)`

Load and parse CSV from the given URL

**Returns:** Array<Object>


#### `await fetch.fetch(url)`

Fetch whatever is at the given URL. If the URL has been downloaded before, it will be loaded from `cache/$MD5.ext`.

**Returns:** String

## `fs`

`import * as fs from './lib/fs.js'`


#### `await fs.exists(filePath)`

Check if a file exists

**Returns:** Boolean


#### `await fs.readFile(filePath)`

Read a file


#### `await fs.readJSON(filePath)`

Read and parse JSON


#### `await fs.readCSV(filePath)`

Read and parse CSV


#### `await fs.writeFile(filePath, data)`

Write the given data to the given file path


#### `await fs.writeJSON(filePath, data)`

Write the given JSON to the given file path, formatted nicely


## `parse`

`import * as parse from './lib/parse.js'`

#### `parse.number(string)`
Turn the provided string into a number, ignoring non-numeric data

**Returns:** Number


#### `parse.float(string)`
Turn the provided string into a floating point number

**Returns:** Float


#### `parse.string(string)`
Remove line breaks, double spaces, zero-width space, asterisk, and trim the provided stirng

**Returns:** String


## `rules`

`import * as rules from './lib/rules.js'`

#### `rules.isAcceptable(data, acceptCriteria, rejectCriteria)`

Given a data object and arrays of criteria with keys/values that match the data object,
determine if the object is acceptable.

If the object has keys that match everything in at least one rejection criteria, it is rejected
If the object has keys that match everything in at least one acceptance criteria, it's accepted

## `transform`

`import * as transform from './lib/transform.js'`

#### `transform.objectToArray(object)`
Convert an object keyed on county name to an array

**Returns:** Array


#### `transform.addCounty(string)`
Append ' County' to the end of a string, if not already present

**Returns:** String


#### `transform.getName(location)`
Get the full name of a location

**Returns:** String


#### `transform.hash(string)`
MD5 hash a given string

**Returns:** String
