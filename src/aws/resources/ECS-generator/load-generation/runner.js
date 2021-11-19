const puppeteer = require("puppeteer");
const fs = require("fs");
// const { nanoid } = require("nanoid");
const { testScript } = require("./petrichor/test_script.js");
const config = JSON.parse(fs.readFileSync("./petrichor/config.json", "utf-8"));

const TEST_LENGTH = config.TEST_LENGTH;
const ORIGIN_TIMESTAMP = config.ORIGIN_TIMESTAMP;
const STOP_TIME = ORIGIN_TIMESTAMP + TEST_LENGTH;

function promiseMapper(userId, promise) {
  return new Promise((resolve) => {
    promise.finally(() => resolve(userId));
  });
}

async function runMultipleTest(numberOfUsers = 5) {
  if (Date.now() >= STOP_TIME) return;

  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const concurrentTestPromisesMap = {};
  const promisesCounter = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (let i = 1; i <= numberOfUsers; i++) {
    concurrentTestPromisesMap[i] = promiseMapper(i, runTest(browser, i));
  }
  while (JSON.stringify(concurrentTestPromisesMap) !== "{}") {
    const userId = await Promise.race(Object.values(concurrentTestPromisesMap));

    promisesCounter[userId] += 1;
    console.log("counter:", promisesCounter);

    delete concurrentTestPromisesMap[userId];
    if (Date.now() < STOP_TIME) {
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
  await page.setDefaultTimeout(10_000);
  await testScript(incognito, page, userId);
  await page.close();
  await incognito.close();
}

runMultipleTest();
