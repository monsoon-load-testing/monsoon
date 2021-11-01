const puppeteer = require("puppeteer");
const WeatherStation = require("monsoon-weather-station");

Observer.configTest(1, 100, 0.5);

async function testScript(browser, page, time) {
  const weatherStation = new WeatherStation(browser, page, 123);

  await weatherStation.startStep("Load main page");
  await page.goto("https://requestbin.rauldehevia.com");
  await weatherStation.endStep("Load main page");
  // await page.screenshot({ path: `frontpage${time}.jpg` });

  await page.type("input", "p9c-yf");
  // await page.screenshot({ path: `input${time}.jpg` });

  await weatherStation.startStep("Go to bin");
  await Promise.all([
    page.waitForNavigation(),
    page.click("button[class*=green]"),
  ]);
  await weatherStation.endStep("Go to bin");
  // await page.screenshot({ path: `after go click${time}.jpg` });
  await page.click("button[class*=green]");
  weatherStation.endTest();
}

module.exports = {
  testScript
};