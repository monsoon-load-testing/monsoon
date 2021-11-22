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

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

function promiseMapper(userId, promise) {
  return new Promise((resolve) => {
    promise.finally(() => resolve(userId));
  });
}

const writePromiseLogToS3 = async (promiseStatusLog) => {
  const BUCKET_NAME = process.env.bucketName;
  const now = Date.now();
  const params = {
    Bucket: BUCKET_NAME,
    Key: `logs/${now}-${id}.json`, // File name you want to save as in S3
    Body: JSON.stringify(promiseStatusLog),
  };
  try {
    await s3.upload(params).promise();
  } catch (e) {
    console.log(e);
  }
};

const promiseStatusLog = { logCounter: 0 };
const updatePromiseStatusLog = (
  userId,
  numberOfUsers,
  concurrentTestPromisesMap
) => {
  promiseStatusLog[userId].count += 1;
  for (let i = 1; i <= numberOfUsers; i++) {
    promiseStatusLog[i].promise = util.inspect(concurrentTestPromisesMap[i]);
  }
  promiseStatusLog.logCounter += 1;
};

const writePromiseLogToS3IfCounter = async () => {
  if (promiseStatusLog.logCounter > 200) {
    try {
      await writePromiseLogToS3(promiseStatusLog);
    } catch (e) {
      console.log(e);
    }
    promiseStatusLog.logCounter = 0;
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
  for (let i = 1; i <= numberOfUsers; i++) {
    await sleep(300);
    concurrentTestPromisesMap[i] = promiseMapper(i, runTest(browser, i));
    promiseStatusLog[i] = { count: 0, promise: undefined };
  }

  while (JSON.stringify(concurrentTestPromisesMap) !== "{}") {
    const userId = await Promise.race(Object.values(concurrentTestPromisesMap));

    // updatePromiseStatusLog(userId, numberOfUsers, concurrentTestPromisesMap);
    // await writePromiseLogToS3IfCounter();

    delete concurrentTestPromisesMap[userId];

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
  const incognito = await browser.createIncognitoBrowserContext();
  try {
    const resolvedValue = await Promise.race([
      promiseRunTest(incognito, userId),
      promiseTimeout(),
    ]);
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

function promiseRunTest(incognito, userId) {
  const test = async () => {
    const page = await incognito.newPage();
    await page.setDefaultTimeout(10_000);
    await testScript(incognito, page, userId);
    await page.close();
    await incognito.close();
  };

  return new Promise((resolve, reject) => {
    test()
      .then((data) => resolve("passed"))
      .catch((err) => reject(err));
  });
}

function promiseTimeout() {
  const TEST_TIMEOUT = 50_000;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(
        new Error(`The test is taking too much time. Closing incognito context`)
      );
    }, TEST_TIMEOUT);
  });
}

runMultipleTest();
