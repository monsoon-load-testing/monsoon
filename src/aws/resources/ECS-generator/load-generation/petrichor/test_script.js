const puppeteer = require("puppeteer");
const WeatherStation = require("monsoon-weather-station");

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
      // random sleep between 1s to 15s
      // Math.random * max + min as offset
      // await sleep((Math.floor(Math.random() * 15) + 1) * 1_000);
    },
    [1000, 3000]
  );
  // if (Number(userId) === 1) {
  //   await sleep(90_000);
  // }
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
