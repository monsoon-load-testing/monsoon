const puppeteer = require("puppeteer");
const WeatherStation = require("monsoon-weather-station");

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const your_home_page = "https://www.example.com";

async function testScript(browser, page, userId) {
  const weatherStation = new WeatherStation(browser, page, userId);

  await weatherStation.measure(
    "Load main page",
    async () => {
      await page.goto(`${your_home_page}`);
    },
    0
  );
}

module.exports = {
  testScript,
};
