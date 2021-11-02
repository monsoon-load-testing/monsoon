const puppeteer = require("puppeteer");
const WeatherStation = require("../../weather-station/dist/weather-station");

async function testScript(browser, page) {
  const weatherStation = new WeatherStation(browser, page, 123);

  await weatherStation.startStep("Load main page");
  await page.goto("https://requestbin.rauldehevia.com");
  await weatherStation.endStep("Load main page");

  await page.type("input", "p9c-yf");

  await weatherStation.startStep("Go to bin");
  await Promise.all([
    page.waitForNavigation(),
    page.click("button[class*=green]"),
  ]);
  await weatherStation.endStep("Go to bin");
  await page.click("button[class*=green]");
  weatherStation.endTest();
}

module.exports = {
  testScript,
};
