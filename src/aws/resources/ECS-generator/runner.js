const puppeteer = require("puppeteer");
const { testScript, config } = require("./testScript");
const testDuration = 60_000; // hard-coded ms

console.log(config);

async function runTest() {
  console.log("Loading headless chrome...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  console.log("Headless chrome loaded. Starting the test:");

  const originTimestamp = Date.now(); // hard-coded ms
  const stopTime = originTimestamp + testDuration;

  while (Date.now() < stopTime) {
    await page.setCacheEnabled(false);

    await testScript(browser, page);

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
