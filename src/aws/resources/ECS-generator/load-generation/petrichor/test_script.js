const puppeteer = require("puppeteer");
const WeatherStation = require("../../weather-station/dist/weather-station");

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function testScript(browser, page, userId) {
  const weatherStation = new WeatherStation(browser, page, userId);

  await weatherStation.startStep("Load main page");
  await page.goto("https://requestbin.rauldehevia.com");
  await sleep(15_001);
  await weatherStation.endStep("Load main page", 0);

  await page.type("input", "p9c-yf");

  await weatherStation.startStep("Go to bin");
  await Promise.all([
    page.waitForNavigation(),
    page.click("button[class*=green]"),
  ]);
  await sleep(15_001);
  await weatherStation.endStep("Go to bin", 0);
  await page.click("button[class*=green]");
  weatherStation.endTest();
}

module.exports = {
  testScript,
};
