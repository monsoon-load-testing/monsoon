const puppeteer = require("puppeteer");
const WeatherStation = require("../../weather-station/dist/weather-station");

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function testScript(browser, page, userId) {
  const weatherStation = new WeatherStation(browser, page, userId);

  await weatherStation.measure(
    "Load main page",
    async () => {
      await page.goto("https://requestbin.rauldehevia.com");
      // await sleep(20_000);
    },
    1000
  );

  await weatherStation.measure(
    "Go to bin",
    async () => {
      await page.type("input", "p9c-yf");
      await Promise.all([
        page.waitForNavigation(),
        page.click("button[class*=green]"),
      ]);
      // await sleep(20_000);
    },
    [1000, 3000]
  );
}

module.exports = {
  testScript,
};
