const puppeteer = require("puppeteer");
const WeatherStation = require("monsoon-weather-station");

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function testScript(browser, page, userId) {
  const weatherStation = new WeatherStation(browser, page, userId);

  await weatherStation.measure(
    "1) Go to Boost Health Main Page",
    async () => {
      await page.goto("https://requestbin.rauldehevia.com");
      const randomDelay = Math.random() >= 0.5 ? 9_999 : 0;
      await sleep(randomDelay);
    },
    [2000]
  );

  await weatherStation.measure(
    "2) Open Brain Boost product details",
    async () => {
      await page.goto("https://requestbin.rauldehevia.com");
      await sleep(237);
    },
    [2000]
  );

  // await weatherStation.measure(
  //   "3) Add Brain Boost to Cart",
  //   async () => {
  //     await page.type("input", "p9c-yf");
  //     await Promise.all([
  //       page.waitForNavigation(),
  //       page.click("button[class*=green]"),
  //     ]);
  //   },
  //   [1000, 3000]
  // );
}

module.exports = {
  testScript,
};
