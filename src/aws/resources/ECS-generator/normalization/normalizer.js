/*
go from batch processing to stream processing

input:
  - config -> originTimestamp, timeWindow, timestamps, testDuration
  - json files being generated by weather-station (./load-generation/results)

output: 
  - FINAL BUCKET OBJECT:
  - key: stepName-normalizedTimestamp
  - value is an object. Inside the object, property is unique userId with their normalized metrics
  - value: an object with 1 or more userIds as keys:
                value: { metrics: { 
                    normalizedResponseTime: 108
                }}

- track current upperBound of the current normalizedTimestamp
- as soon as we see a raw timestamp > upperbound, package up the current normalizedTimestamp's datapoints

Algorithm:
  - const initialOffset = 15s
  - polling time after initialOffset = 15s

  - global object: const normalizedTimestamps = config.timestamps;

  - set initialOffset = 15_000
  - let shouldRunningNormalization = true
  - inside the while loop: (polling every 15s) while (shouldRunningNormalization)
      - if (normalizedTimestamps.length === 0) {   
        shouldRunningNormalization = false
        break
      }
      - calculate the lowerBound & upperBound of normalizedTimestamps[0]
      - let shouldProcess = false
      - loop through each json file generated by weather-station
          - if the stepStartTime >= upperBound {
              shouldProcess = true
              break
            }
      - if (shouldProcess) {
        - only process all data points in normalizedTimestamps[0] (delete json files after process as well)
          - only data points with stepStartTime between lowerBound & upperBound (>=lowerBound & < upperBound)
        - build filterdBucket
        - build finalBucket
        - send only the data points from  normalizedTimestamps[0] to S3 bucket 
        - chop off the normalizedTimestamps[0]
      }
*/

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

// Uncomment for prototype
// let timestampsObj;
// let normalizedTimestamps;

// (async () => {
//   timestampsObj = await fetchFile("timestamps.json");
//   normalizedTimestamps = timestampsObj.timestamps;
// })(); // The fetching should be finished before the normalizedTimestamps is used.

const originTimestamp = config.ORIGIN_TIMESTAMP;
const timeWindow = config.TIME_WINDOW;
const testDuration = config.TEST_LENGTH;

const initialOffset = 15_000; // should cover the case where average response time of a request is 3s
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
  const BUCKET_NAME = "monsoon-load-testing-bucket";

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

// for excel testing
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

  while (shouldRunningNormalization) {
    await sleep(pollingTime); // polling
    let shouldProcess = false;
    if (normalizedTimestamps.length === 1) {
      shouldRunningNormalization = false; // RdH typo fixed (used to read Normaliation)
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
        buckets[normalizedTimestamps[0]] = [];
        // filename: userId-stepName-stepStartTime - refactor to one function
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
            buckets[normalizedTimestamps[0]].push(fileContents);
          }
        }

        // filteredBucket -> just the normalizedTimestamps[0] batch - reactor to one function
        buckets[normalizedTimestamps[0]].forEach((dataPoint) => {
          const key = `${dataPoint.userId}-${dataPoint.stepName}-${normalizedTimestamps[0]}`;
          if (filteredBucket[key]) {
            filteredBucket[key].push(dataPoint);
          } else {
            filteredBucket[key] = [dataPoint];
          }
        });

        // // build finalBucket -> just the nromalizedTiemstamps[0] batch - refactor to one function
        Object.keys(filteredBucket).forEach((key) => {
          let sum = 0;
          filteredBucket[key].forEach((dataPoint) => {
            sum += dataPoint.metrics.responseTime;
          });
          const normalizedResponseTime = Math.round(
            sum / filteredBucket[key].length
          );
          const [userId, stepName, normalizedTimestamp] = key.split("-");
          const newKey = `${stepName}-${normalizedTimestamp}`;

          if (finalBucket[newKey]) {
            // if newKey already exists
            finalBucket[newKey][userId] = {
              metrics: {
                normalizedResponseTime,
              },
              sampleCount: filteredBucket[key].length,
            };
          } else {
            // newKey doesn't exist yet
            finalBucket[newKey] = {
              [userId]: {
                metrics: {
                  normalizedResponseTime,
                },
                sampleCount: filteredBucket[key].length,
              },
            };
          }
        });
        // send to S3 bucket
        await writeToS3(finalBucket);
        // await writeToLocal(finalBucket);
        normalizedTimestamps.shift();
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
  buckets[normalizedTimestamps[0]] = [];
  // filename: userId-stepName-stepStartTime - refactor to one function
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
      buckets[normalizedTimestamps[0]].push(fileContents);
    }
  }
  // filteredBucket -> just the normalizedTimestamps[0] batch - reactor to one function
  buckets[normalizedTimestamps[0]].forEach((dataPoint) => {
    const key = `${dataPoint.userId}-${dataPoint.stepName}-${normalizedTimestamps[0]}`;
    if (filteredBucket[key]) {
      filteredBucket[key].push(dataPoint);
    } else {
      filteredBucket[key] = [dataPoint];
    }
  });

  // // build finalBucket -> just the nromalizedTiemstamps[0] batch - refactor to one function
  Object.keys(filteredBucket).forEach((key) => {
    let sum = 0;
    filteredBucket[key].forEach((dataPoint) => {
      sum += dataPoint.metrics.responseTime;
    });
    const normalizedResponseTime = Math.round(sum / filteredBucket[key].length);
    const [userId, stepName, normalizedTimestamp] = key.split("-");
    const newKey = `${stepName}-${normalizedTimestamp}`;

    if (finalBucket[newKey]) {
      // if newKey already exists
      finalBucket[newKey][userId] = {
        metrics: {
          normalizedResponseTime,
        },
        ampleCount: filteredBucket[key].length,
      };
    } else {
      // newKey doesn't exist yet
      finalBucket[newKey] = {
        [userId]: {
          metrics: {
            normalizedResponseTime,
          },
          ampleCount: filteredBucket[key].length,
        },
      };
    }
  });
  // send to S3 bucket
  await writeToS3(finalBucket);
  // await writeToLocal(finalBucket);
  normalizedTimestamps.shift();
}
doNormalization();
