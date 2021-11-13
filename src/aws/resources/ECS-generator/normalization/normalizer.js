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

const initialOffset = 20_000; // timeout is 10s.
const pollingTime = 15_000; // our use case

// we can let each container do this calculation and will not need to fetch timestamps from the S3 bucket
const initializeTimestamps = (timeWindow, testDuration, originTimestamp) => {
  let currentTime = originTimestamp;
  const normalizedTimestamps = [];
  const finalTimestamp = originTimestamp + testDuration;
  while (currentTime < finalTimestamp) {
    normalizedTimestamps.push(currentTime);
    currentTime += timeWindow;
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
  for (let filename in finalBucket) {
    // stepName-normalizedTimestamp
    // if there is no data in the time window -> normalizedTimestamp
    let [stepName, normalizedTimestamp] = filename.split("-");

    const params = {
      Bucket: BUCKET_NAME,
      Key: `${normalizedTimestamp}/${stepName}/${nanoid(7)}.json`, // File name you want to save as in S3
      Body: JSON.stringify(finalBucket[filename]),
    };
    await s3.upload(params).promise();
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
    let sum = 0;
    let passCount = 0;
    let failCount = 0;
    filteredBucket[key].forEach((dataPoint) => {
      if (dataPoint.metrics.passed) {
        passCount += 1;
        sum += dataPoint.metrics.responseTime;
      } else {
        failCount += 1;
      }
    });
    const normalizedResponseTime = Math.round(sum / filteredBucket[key].length);
    const sampleCount = filteredBucket[key].length;
    const transactionRate = Math.round((sampleCount * 15) / 60);
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
      };
    }
  });
  return finalBucket;
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
      const filenames = await fs.promises.readdir("../load-generation/results");
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
        let buckets = {};
        let filteredBucket = {};
        let finalBucket = {};
        // buckets[normalizedTimestamps[0]] = [];
        // filename: userId-stepName-stepStartTime
        buckets[normalizedTimestamps[0]] =
          await groupByCurrentNormalizedTimestamp(
            filenames,
            lowerBound,
            upperBound
          ); // getfilenames every data point inside the first normalized timestamps

        // filteredBucket -> just the normalizedTimestamps[0] batch
        filteredBucket = filterBucket(buckets[normalizedTimestamps[0]]);
        // build finalBucket -> just the nromalizedTiemstamps[0] batch
        finalBucket = buildFinalBucket(filteredBucket);
        // send to S3 bucket
        // writeToS3(finalBucket);
        await writeToLocal(finalBucket);
        normalizedTimestamps.shift();
      } else {
        if (noNextDataPoint) {
          let buckets = {};
          let filteredBucket = {};
          let finalBucket = {};
          buckets[normalizedTimestamps[0]] =
            await groupByCurrentNormalizedTimestamp(
              filenames,
              lowerBound,
              upperBound
            );
          // filteredBucket -> just the normalizedTimestamps[0] batch
          filteredBucket = filterBucket(buckets[normalizedTimestamps[0]]);
          // build finalBucket -> just the nromalizedTiemstamps[0] batch
          finalBucket = buildFinalBucket(filteredBucket);
          // send to S3 bucket
          // writeToS3(finalBucket);
          await writeToLocal(finalBucket);
          normalizedTimestamps.shift();
        } else {
          noNextDataPoint = true;
        }
      }
    } catch (err) {
      await fs.promises.writeFile(`./log/error.json`, JSON.stringify(err));
    }
  }

  await sleep(60_000); // sleep for 1 min before processing the last batch
  const filenames = await fs.promises.readdir("../load-generation/results");
  const [lowerBound, upperBound] = [
    normalizedTimestamps[0] - timeWindow / 2,
    normalizedTimestamps[0] + timeWindow / 2,
  ];
  let buckets = {};
  let filteredBucket = {};
  let finalBucket = {};
  buckets[normalizedTimestamps[0]] = await groupByCurrentNormalizedTimestamp(
    filenames,
    lowerBound,
    upperBound
  );
  // filteredBucket -> just the normalizedTimestamps[0] batch
  filteredBucket = filterBucket(buckets[normalizedTimestamps[0]]);
  // build finalBucket -> just the nromalizedTiemstamps[0] batch
  finalBucket = buildFinalBucket(filteredBucket);
  // // send to S3 bucket
  // writeToS3(finalBucket);
  await writeToLocal(finalBucket);
  normalizedTimestamps.shift();
}

(async () => {
  await doNormalization();
})();
