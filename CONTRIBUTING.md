# Contribute to COVID Atlas

Welcome! We are happy you are considering contributing to this project. There are many ways you can contribute,
from squashing bugs, maintaining our fleet of scrapers, or helping out on our front-end website!

This document provides details regarding the scope of this project, as well as the kind of contribution
you can make and how to make them.

If after reading this document you have any outstanding questions, feel free to join us on our Slack and say hello!

**Table of content**

- [Contribute to COVID Atlas](#contribute-to-covid-atlas)
  - [About the project](#about-the-project)
  - [Getting Started](#getting-started)
  - [Code of conduct](#code-of-conduct)
  - [How to help](#how-to-help)
    - [Checking our data for quality issues](#checking-our-data-for-quality-issues)
    - [Maintain our existing sources](#maintain-our-existing-sources)
    - [Contribute a source](#contribute-a-source)
    - [Contribute to the project core](#contribute-to-the-project-core)
    - [Other ways to contribute](#other-ways-to-contribute)
  - [Development workflow](#development-workflow)
  - [Testing](#testing)
  - [Code formating](#code-formating)

## About the project

COVID Atlas collects local data from around the world into one resource. We believe this data would be most useful to:

- People looking to understand how the pandemic affects them and their loved one directly.
- Data scientists and epidemiologists looking to access a comprehensive dataset on the extent of the pandemic across the world.

## Getting Started

First, make sure to go through our [Getting Started](./docs/getting_started.md) guide to help get our project running on your local machine.

## Code of conduct

By participating in this project, you agree to abide by our [Code of Conduct](./.github/code_of_conduct.md). We expect all contributors to follow the Code of Conduct and to treat fellow humans with respect.

## How to help

### Checking our data for quality issues

Sometimes, subtle data issues creep in

### Maintain our existing sources

Sources change and our scrapers fail often. We would be immensely grateful if you wish to support us in maintaining our existing fleet of scrapers. Feel free to look through our issue tracker, or chime in on Slack and we can point you to scrapers we need help on!

### Contribute a source

To help you contribute a new source, please read the [Sources and Scrapers](./docs/sources.md) guide before you start!

Send a pull request with your scraper, and be sure to run the scraper first with the instructions specified in the guide to make sure the data is valid.

### Contribute to the project core

Check the Issues for any task we need to get done. If you are new to open source, look for the label [`Good first issue`](https://github.com/lazd/coronadatascraper/labels/good%20first%20issue). You can also chime in on Slack to see if we need help with anything!

### Other ways to contribute

You don't have to code to contribute! We are also looking for project managers, designers, copy editors, social media coordinators, and more! Make sure to say hello on our Slack and we will be happy to give you some work!

## Development workflow

You will need to fork the main repository to work on your changes. Simply navigate to our GitHub page and click the "Fork" button at the top. Once you've forked the repository, you can clone your new repository and start making edits.

In git it is best to isolate each topic or feature into a “topic branch”. While individual commits allow you control over how small individual changes are made to the code, branches are a great way to group a set of commits all related to one feature together, or to isolate different efforts when you might be working on multiple topics at the same time.

While it takes some experience to get the right feel about how to break up commits, a topic branch should be limited in scope to a single issue

Our [Getting Started](./docs/getting_started.md) guide provides more detail to help you run this project.

## Testing

All modifications to our codebase should come with a test to demonstrate intended behavior. This also includes scrapers—you can learn more about our scraper testing approaches in our [Sources and Scrapers](./docs/sources.md) guide.

For core library testing, we use Tape. We maintain all our tests in the `tests` folder at the project root. You can read more about Tape here: https://ci.testling.com/guide/tape

## Code formating

**Important!** All our files must follow the _kebab-case_ (ie. hello-world.js) standard for filenames.

We use prettier for code styling and ESLint for code linting. They will automatically run when commiting and pushing through Git hooks.

