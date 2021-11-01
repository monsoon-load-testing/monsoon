const puppeteer = require("puppeteer");
const WeatherStation = require("../dist/weather-station");

async function testScript(browser, page, userId) {
  const weatherStation = new WeatherStation(browser, page, userId);

  await weatherStation.startStep("Load main page");
  await page.goto("https://requestbin.rauldehevia.com");
  await weatherStation.endStep("Load main page");
  // await page.screenshot({ path: `screenshots/frontpage.jpg` });

  await page.type("input", "p9c-yf");
  // await page.screenshot({ path: `screenshots/input.jpg` });

  await weatherStation.startStep("Go to bin");
  await Promise.all([
    page.waitForNavigation(),
    page.click("button[class*=green]"),
  ]);
  await weatherStation.endStep("Go to bin");
  // await page.screenshot({ path: `after go click${time}.jpg` });
  await page.click("button[class*=green]");
  // weatherStation.endTest();
}

const runTest = async () => {
  console.log("Loading headless chrome...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  console.log("Headless chrome loaded. Starting the test:");
  await testScript(browser, page, "dn34u94");
  await browser.close();
};

runTest();

module.exports = {
  testScript,
};
