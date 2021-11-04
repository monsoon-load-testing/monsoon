const puppeteer = require("puppeteer");
const fs = require("fs");
const { nanoid } = require("nanoid");
const { testScript } = require("./petrichor/test_script");

const config = JSON.parse(fs.readFileSync("./petrichor/config.json", "utf-8"));

const TEST_LENGTH = config.TEST_LENGTH;
const ORIGIN_TIMESTAMP = config.ORIGIN_TIMESTAMP;

async function runTest() {
  console.log("Loading headless chrome...");
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
  const page = await browser.newPage();
  console.log("Headless chrome loaded. Starting the test:");

  const stopTime = ORIGIN_TIMESTAMP + TEST_LENGTH;
  const userId = nanoid(6);

  while (Date.now() < stopTime) {
    await page.setCacheEnabled(false);

    await testScript(browser, page, userId);

    // delete local Storage
    await page.evaluate(() => {
      localStorage.clear();
    });

    // delete cookies
    const client = await page.target().createCDPSession();
    await client.send("Network.clearBrowserCookies");
  }

  await browser.close();
}

runTest();
