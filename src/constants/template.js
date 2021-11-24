const testTemplate = `const puppeteer = require("puppeteer");
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
      await page.goto(\`\${your_home_page}\`);
    },
    [1000, 3000] // optional randomized delay after step between lowerBound (e.g. 1000ms) and upperBound (e.g. 3000ms)
  );
}`;

const testConfig = {
  testLengthInMinutes: 10,
  numberOfUsers: 40,
  rampUpLengthInMinutes: 2,
};

module.exports = { testTemplate, testConfig };
