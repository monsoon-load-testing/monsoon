const fs = require("fs");
const AWS = require("aws-sdk");
const { nanoid } = require("nanoid");

const config = JSON.parse(
  fs.readFileSync("../load-generation/petrichor/config.json", "utf-8")
);

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function fetchFile(fileName) {
  const paramsObj = {
    Bucket: "monsoon-load-testing-bucket",
    Key: fileName,
  };

  try {
    const obj = await s3.getObject(paramsObj).promise();
    fs.writeFileSync(`./load-generation/petrichor/${fileName}`, obj.Body);
  } catch (e) {
    console.log(e);
  }
}

const originTimestamp = config.ORIGIN_TIMESTAMP;
const timeWindow = config.TIME_WINDOW;
const testDuration = config.TEST_LENGTH;
const usersPerContainer = 20;

const initialOffset = 20_000; // timeout is 10s.
const pollingTime = 15_000; // our use case

// we can let each container do this calculation and will not need to fetch timestamps from the S3 bucket
const initializeTimestamps = (timeWindow, testDuration, originTimestamp) => {
  let offset =
    Math.floor((Date.now() - originTimestamp) / timeWindow) * timeWindow;
  offset = offset >= 0 ? offset : 0;

  let currentTimestamp = originTimestamp + offset;

  const normalizedTimestamps = [];
  const finalTimestamp = originTimestamp + testDuration;
  while (currentTimestamp < finalTimestamp) {
    normalizedTimestamps.push(currentTimestamp);
    currentTimestamp += timeWindow;
  }
  normalizedTimestamps.push(finalTimestamp);
  return normalizedTimestamps;
};

const normalizedTimestamps = initializeTimestamps(
  timeWindow,
  testDuration,
  originTimestamp
);

// function definitions
const writeToS3 = async (finalBucket) => {
  const BUCKET_NAME = process.env.bucketName;

  const s3 = new AWS.S3();
  const promisesUpload = [];
  for (let filename in finalBucket) {
    // stepName-normalizedTimestamp
    // if there is no data in the time window -> normalizedTimestamp.
    let [stepName, normalizedTimestamp] = filename.split("-");

    const params = {
      Bucket: BUCKET_NAME,
      Key: `${normalizedTimestamp}/${stepName}/${nanoid(7)}.json`, // File name you want to save as in S3
      Body: JSON.stringify(finalBucket[filename]),
    };
    promisesUpload.push(s3.upload(params).promise());
  }
  try {
    await Promise.allSettled(promisesUpload);
  } catch (e) {
    console.log(e);
  }
};

const groupByCurrentNormalizedTimestamp = async (
  filenames,
  lowerBound,
  upperBound
) => {
  let bucket = [];
  for (let filename of filenames) {
    let fileContents = await fs.promises.readFile(
      `../load-generation/results/${filename}`,
      { encoding: "utf-8" }
    );
    fileContents = JSON.parse(fileContents);

    if (
      fileContents.stepStartTime >= lowerBound &&
      fileContents.stepStartTime < upperBound
    ) {
      // delete the current file
      // future work: the deletion process doesnt have to be await -> make it background job
      await fs.promises.unlink(`../load-generation/results/${filename}`);
      const stepName = filename.split("-")[1];
      fileContents.stepName = stepName;
      bucket.push(fileContents);
    }
  }
  return bucket;
};

const filterBucket = (bucket) => {
  let filteredBucket = {};
  bucket.forEach((dataPoint) => {
    const key = `${dataPoint.userId}-${dataPoint.stepName}-${normalizedTimestamps[0]}`;
    if (filteredBucket[key]) {
      filteredBucket[key].push(dataPoint);
    } else {
      filteredBucket[key] = [dataPoint];
    }
  });
  return filteredBucket;
};

const buildFinalBucket = (filteredBucket) => {
  let finalBucket = {};
  Object.keys(filteredBucket).forEach((key) => {
    let responseTimeSum = 0;
    let passCount = 0;
    let failCount = 0;
    let responseTimeDataPointCount = 0;
    filteredBucket[key].forEach((dataPoint) => {
      if (dataPoint.metrics.passed) {
        passCount += 1;
      } else {
        failCount += 1;
      }

      if (dataPoint.metrics.responseTime) {
        responseTimeSum += dataPoint.metrics.responseTime;
        responseTimeDataPointCount += 1;
      }
    });
    const normalizedResponseTime = Math.round(
      responseTimeSum / responseTimeDataPointCount
    ); // should be divided by the number points that contribute to response time
    const sampleCount = filteredBucket[key].length;

    const transactionRate = Math.round(
      (sampleCount / (timeWindow / 1000)) * 60
    );
    const [userId, stepName, normalizedTimestamp] = key.split("-");
    const newKey = `${stepName}-${normalizedTimestamp}`;

    if (finalBucket[newKey]) {
      // if newKey already exists
      finalBucket[newKey][userId] = {
        metrics: {
          normalizedResponseTime,
          passCount,
          failCount,
          transactionRate,
        },
        sampleCount,
      };
    } else {
      // newKey doesn't exist yet
      finalBucket[newKey] = {
        [userId]: {
          metrics: {
            normalizedResponseTime,
            passCount,
            failCount,
            transactionRate,
          },
          sampleCount,
        },
        usersPerContainer,
      };
    }
  });

  return finalBucket;
};

const normalizeData = async (timestamp, lowerBound, upperBound) => {
  console.log(timestamp, "before sleep");
  await sleep(11_000); // wait 11s so all tests within timestamp finish
  const filenames = await fs.promises.readdir("../load-generation/results");
  // load filenames again to ensure all tests within timestamp are processed
  let buckets = {};
  let filteredBucket = {};
  let finalBucket = {};
  buckets[timestamp] = await groupByCurrentNormalizedTimestamp(
    filenames,
    lowerBound,
    upperBound
  ); // getfilenames every data point inside the first normalized timestamps

  filteredBucket = filterBucket(buckets[timestamp]);
  finalBucket = buildFinalBucket(filteredBucket);
  // await writeToS3(finalBucket);
  await writeToLocal(finalBucket);
  console.log(timestamp, "after normalization");
};

// for excel and local testing
const writeToLocal = async (finalBucket) => {
  for (let filename in finalBucket) {
    let [stepName, normalizedTimestamp] = filename.split("-");
    const outPutFileName = `${normalizedTimestamp}-${stepName}-${nanoid(
      7
    )}.json`;
    const directoryName = "./output";
    if (!fs.existsSync(directoryName)) {
      fs.mkdirSync(directoryName);
    }

    const json = JSON.stringify(finalBucket[filename]);
    console.log(json);
    await fs.promises.writeFile(`${directoryName}/${outPutFileName}`, json);
  }
};

// main logic
async function doNormalization() {
  await sleep(initialOffset);

  let shouldRunningNormalization = true;

  let noNextDataPoint = false;
  while (shouldRunningNormalization) {
    await sleep(pollingTime); // polling
    let shouldProcess = false;
    if (normalizedTimestamps.length === 1) {
      shouldRunningNormalization = false;
      shouldProcess = false;
      break;
    }
    const [lowerBound, upperBound] = [
      normalizedTimestamps[0] - timeWindow / 2,
      normalizedTimestamps[0] + timeWindow / 2,
    ];

    try {
      let filenames = await fs.promises.readdir("../load-generation/results");
      // check if there is a file existing in the next time window
      for (let filename of filenames) {
        let fileContents = await fs.promises.readFile(
          `../load-generation/results/${filename}`,
          { encoding: "utf-8" }
        );
        fileContents = JSON.parse(fileContents);
        if (fileContents.stepStartTime >= upperBound) {
          shouldProcess = true;
          break;
        }
      }

      if (shouldProcess) {
        let normalizedTimestamp = normalizedTimestamps[0];
        normalizeData(normalizedTimestamp, lowerBound, upperBound);
        console.log("timestamps:", normalizedTimestamps);
        normalizedTimestamps.shift();
      } else {
        if (noNextDataPoint) {
          let normalizedTimestamp = normalizedTimestamps[0];
          normalizeData(normalizedTimestamp, lowerBound, upperBound);
          console.log("timestamps:", normalizedTimestamps);
          normalizedTimestamps.shift();
        } else {
          noNextDataPoint = true;
        }
      }
    } catch (err) {
      await fs.promises.writeFile(`./log/error.json`, JSON.stringify(err));
    }
  }

  // await sleep(60_000); // sleep for 1 min before processing the last batch
  // const filenames = await fs.promises.readdir("../load-generation/results");
  // const [lowerBound, upperBound] = [
  //   normalizedTimestamps[0] - timeWindow / 2,
  //   normalizedTimestamps[0] + timeWindow / 2,
  // ];
  // let buckets = {};
  // let filteredBucket = {};
  // let finalBucket = {};
  // buckets[normalizedTimestamps[0]] = await groupByCurrentNormalizedTimestamp(
  //   filenames,
  //   lowerBound,
  //   upperBound
  // );
  // // filteredBucket -> just the normalizedTimestamps[0] batch
  // filteredBucket = filterBucket(buckets[normalizedTimestamps[0]]);
  // // build finalBucket -> just the nromalizedTiemstamps[0] batch
  // finalBucket = buildFinalBucket(filteredBucket);
  // // // send to S3 bucket
  // await writeToS3(finalBucket);
  // console.log("last batch", normalizedTimestamps[0]);
  // // await writeToLocal(finalBucket);
  // normalizedTimestamps.shift();
}

(async () => {
  await doNormalization();
})();
