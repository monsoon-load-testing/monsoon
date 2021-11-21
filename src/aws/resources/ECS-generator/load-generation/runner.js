const puppeteer = require("puppeteer");
const fs = require("fs");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const { nanoid } = require("nanoid");
const id = nanoid(7);
const { testScript } = require("./petrichor/test_script.js");
const config = JSON.parse(fs.readFileSync("./petrichor/config.json", "utf-8"));
const util = require("util");

const TEST_LENGTH = config.TEST_LENGTH;
const ORIGIN_TIMESTAMP = config.ORIGIN_TIMESTAMP;
const STOP_TIME = ORIGIN_TIMESTAMP + TEST_LENGTH;

function promiseMapper(userId, promise) {
  return new Promise((resolve) => {
    promise.finally(() => resolve(userId));
  });
}

const writePromiseLogToS3 = async (counter) => {
  const BUCKET_NAME = process.env.bucketName;
  const now = Date.now();
  const params = {
    Bucket: BUCKET_NAME,
    Key: `logs/${now}-${id}.json`, // File name you want to save as in S3
    Body: JSON.stringify(counter),
  };
  try {
    await s3.upload(params).promise();
  } catch (e) {
    console.log(e);
  }
};

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
  const promiseStatusLog = {};
  for (let i = 1; i <= numberOfUsers; i++) {
    concurrentTestPromisesMap[i] = promiseMapper(i, runTest(browser, i));
    promiseStatusLog[i] = { count: 0, promise: undefined };
  }
  let logCounter = 0;

  while (JSON.stringify(concurrentTestPromisesMap) !== "{}") {
    const userId = await Promise.race(Object.values(concurrentTestPromisesMap));

    promiseStatusLog[userId].count += 1;
    for (let i = 1; i <= numberOfUsers; i++) {
      promiseStatusLog[i].promise = util.inspect(concurrentTestPromisesMap[i]);
    }
    logCounter += 1;

    delete concurrentTestPromisesMap[userId];

    if (logCounter > 30) {
      try {
        await writePromiseLogToS3(promiseStatusLog);
      } catch (e) {
        console.log(e);
      }
      logCounter = 0;
      // console.log(promiseStatusLog);
    }
    if (Date.now() < STOP_TIME) {
      concurrentTestPromisesMap[userId] = promiseMapper(
        userId,
        runTest(browser, userId)
      );

      if (Object.values(concurrentTestPromisesMap).length < numberOfUsers) {
        console.log(
          `The number of users is less than ${numberOfUsers}. Restarting...`
        );
        await browser.close();
        return;
      }
    }
  }
  await browser.close();
}

async function runTest(browser, userId) {
  try {
    const incognito = await browser.createIncognitoBrowserContext();
    const page = await incognito.newPage();
    await page.setDefaultTimeout(10_000);
    await testScript(incognito, page, userId);
    await page.close();
    await incognito.close();
  } catch (error) {
    console.log("something went wrong. closing incognito context");
    try {
      await incognito.close();
      console.log("incognito context closed successfully");
    } catch (error) {
      console.log("context was already closed. success");
    }
  }
}

runMultipleTest();
