const { Builder, By, until } = require('selenium-webdriver');

const scraper = {
  state: 'SC',
  country: 'USA',
  url: 'https://www.scdhec.gov/monitoring-testing-covid-19',
  type: 'table',
  aggregate: 'county',

  async scraper() {
    const counties = [];
    const driver = await new Builder().forBrowser('chrome').build();

    try {
      await driver.get(this.url);

      // Give time for iframes to load (anything more deterministic doesn't seem to work)
      await driver.sleep(5000);

      // kill the annoying header
      await driver.executeScript("document.querySelector('header').remove()");

      // Switch to iframe
      let ifr = driver.wait(until.elementLocated(By.css('iframe')), 10000);
      await driver.switchTo().frame(ifr);

      // Switch to iframe
      ifr = driver.wait(until.elementLocated(By.css('iframe')), 5000);
      await driver.switchTo().frame(ifr);

      const g = driver.wait(until.elementLocated(By.css('g[id ^= COVID19_SC]')));

      const circles = await g.findElements(By.css('circle'));

      for (const circle of circles) {
        await driver.executeScript('arguments[0].scrollIntoView();', circle);
        await circle.click();

        try {
          const popup = driver.wait(until.elementLocated(By.css('.flex-fix.allow-shrink.auto-pointer-events.panel.panel-white.panel-no-padding.flex-vertical.info-panel.side-nav.ember-view')), 2000);
          const countyName = await popup.findElement(By.css('.overflow-hidden.text-ellipsis.padding-left-quarter.avenir-bold')).getText();
          const confirmed = await popup.findElement(By.css('.esriNumericValue')).getText();
          const deaths = await popup.findElement(By.css('.esriNumericValue ~ .esriNumericValue')).getText();

          counties.push({
            county: `${countyName} County`,
            cases: parseInt(confirmed, 10),
            deaths: parseInt(deaths, 10)
          });

          // Close the popup
          const closeButton = await popup.findElement(By.css('svg'));
          await driver.executeScript('arguments[0].scrollIntoView();', closeButton);
          await driver.sleep(300);
          await closeButton.click();
        } catch (err) {
          console.log(err);
        }
      }
    } finally {
      await driver.quit();
    }

    return counties;
  }
};

export default scraper;
