const puppeteer = require("puppeteer");
const fs = require("fs");
const { nanoid } = require("nanoid");
const { testScript } = require("./petrichor/test_script");

const config = JSON.parse(fs.readFileSync("./petrichor/config.json", "utf-8"));

const TEST_LENGTH = config.TEST_LENGTH;
const ORIGIN_TIMESTAMP = config.ORIGIN_TIMESTAMP;
const STOP_TIME = ORIGIN_TIMESTAMP + TEST_LENGTH;

function promiseMapper(userId, promise) {
  return new Promise((resolve) => {
    promise.finally(() => resolve(userId));
  });
}

/*

- runTest rename to runMultipleTest(numberOfUsers=5)
- runTest (browser, userId)
ALGO runMultipleTest:
 - if Date.now() >  stopTime -> return;
 - const browser=....
 - const promisesMap = {}
 - add 5 promises to promisesMap (key is the userId)
 - while promisesMap is not empty
  - userId = await Promise.race(...)
  - delete promisesMap[userId]
  - if (Date.now() <  stopTime)
    - add the promise to promisesMap
 - browser.close()
ALGO runTest(browser, userId)
  const incognito = ...
  const page = ...
  await testScript(incognito, page, userId)
  await page.close
  await incognito.close
*/

async function runMultipleTest(numberOfUsers = 5) {
  if (Date.now() > STOP_TIME) return;

  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const concurrentTestPromisesMap = {};
  for (let i = 1; i <= 5; i++) {
    concurrentTestPromisesMap[i] = promiseMapper(i, runTest(browser, i));
  }

  while (JSON.stringify(concurrentTestPromisesMap) !== "{}") {
    const userId = await Promise.race(Object.values(concurrentTestPromisesMap));
    delete concurrentTestPromisesMap[userId];
    if (Date.now() <= STOP_TIME) {
      concurrentTestPromisesMap[userId] = promiseMapper(
        userId,
        runTest(browser, userId)
      );
    }
  }
  await browser.close();
}

async function runTest(browser, userId) {
  const incognito = await browser.createIncognitoBrowserContext();
  const page = await incognito.newPage();
  await testScript(incognito, page, userId);
  await page.close();
  await incognito.close();
}

// async function runMultipleTestSS(numberOfUsers = 5) {
//   console.log("Loading headless chrome...");
//   const browser = await puppeteer.launch({
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//     ],
//   });
//   const page = await browser.newPage();
//   console.log("Headless chrome loaded. Starting the test:");

//   const stopTime = ORIGIN_TIMESTAMP + TEST_LENGTH;
//   const userId = nanoid(6);

//   while (Date.now() < stopTime) {
//     await page.setCacheEnabled(false);

//     await testScript(browser, page, userId);

//     // delete local Storage
//     await page.evaluate(() => {
//       localStorage.clear();
//     });

//     // delete cookies
//     const client = await page.target().createCDPSession();
//     await client.send("Network.clearBrowserCookies");
//   }

//   await browser.close();
// }

runMultipleTest();
