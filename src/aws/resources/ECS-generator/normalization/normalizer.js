const fs = require("fs");
const AWS = require("aws-sdk");
const { nanoid } = require("nanoid");
const config = JSON.parse(
  fs.readFileSync("../load-generation/petrichor/config.json", "utf-8")
);

(async () => {
  // Faking the polling logic where we reach out to the results folder
  const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  await sleep(5_000);

  // constants
  const originTimestamp = config.ORIGIN_TIMESTAMP;
  const timeWindow = config.TIME_WINDOW;
  const testDuration = config.TEST_LENGTH;

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

  // make the buckets object
  let buckets = {};
  normalizedTimestamps.forEach((normalizedTimestamp) => {
    buckets[normalizedTimestamp] = [];
  });

  (async () => {
    try {
      const filenames = await fs.promises.readdir("../load-generation/results");
      filenames.forEach(async (filename) => {
        const stepName = filename.split("-")[1];

        let fileContents = await fs.promises.readFile(
          `../load-generation/results/${filename}`,
          {
            encoding: "utf-8",
          }
        );
        fileContents = JSON.parse(fileContents);
        fileContents.stepName = stepName;
        for (let idx = 0; idx < normalizedTimestamps.length; idx++) {
          const [lowerBound, upperBound] = [
            normalizedTimestamps[idx] - timeWindow / 2,
            normalizedTimestamps[idx] + timeWindow / 2,
          ];
          if (
            fileContents.stepStartTime >= lowerBound &&
            fileContents.stepStartTime < upperBound
          ) {
            let normalizedTimestamp = normalizedTimestamps[idx];
            buckets[normalizedTimestamp].push(fileContents);
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  })();

  let finalBucket = {};
  const downsample = () => {
    const filteredBucket = filterBucket(); // based on same userId - same stepName
    buildFinalBucket(filteredBucket);
  };

  const filterBucket = () => {
    const filteredBucket = {};
    normalizedTimestamps.forEach((normalizedTimestamp) => {
      if (buckets[normalizedTimestamp].length === 0) {
        filteredBucket[normalizedTimestamp] = [];
      }
      buckets[normalizedTimestamp].forEach((dataPoint) => {
        const key = `${dataPoint.userId}-${dataPoint.stepName}-${String(
          normalizedTimestamp
        )}`;
        if (filteredBucket[key]) {
          filteredBucket[key].push(dataPoint);
        } else {
          filteredBucket[key] = [dataPoint];
        }
      });
    });
    return filteredBucket;
  };

  const buildFinalBucket = (filteredBucket) => {
    Object.keys(filteredBucket).forEach((key) => {
      let sum = 0;
      filteredBucket[key].forEach((dataPoint) => {
        sum += dataPoint.metrics.responseTime;
      });
      const normalizedResponseTime = sum / filteredBucket[key].length;
      const [userId, stepName, normalizedTimestamp] = key.split("-");
      const newKey = `${stepName}-${normalizedTimestamp}`;

      if (filteredBucket[key].length === 0) {
        // finalBucket[key] = {};
      } else if (finalBucket[newKey]) {
        // if newKey already exists
        finalBucket[newKey][userId] = {
          metrics: {
            normalizedResponseTime,
          },
        };
      } else {
        // newKey doesn't exist yet
        finalBucket[newKey] = {
          [userId]: {
            metrics: {
              normalizedResponseTime,
            },
          },
        };
      }
    });
    console.log("final bucket", finalBucket);
  };

  const writeToS3 = () => {
    const BUCKET_NAME = "monsoon-load-testing-bucket";
    AWS.config.update({
      accessKeyId: process.env.AWS_ACC_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    });

    const s3 = new AWS.S3();
    for (let filename in finalBucket) {
      // stepName-normalizedTimestamp
      // if there is no data in the time window -> normalizedTimestamp
      let [stepName, normalizedTimestamp] = filename.split("-");
      if (!normalizedTimestamp) {
        normalizedTimestamp = "noDataPointsForThisTimeWindow(s)";
      }
      const params = {
        Bucket: BUCKET_NAME,
        Key: `${normalizedTimestamp}/${stepName}/${nanoid(7)}.json`, // File name you want to save as in S3
        Body: JSON.stringify(finalBucket[filename]),
      };
      s3.upload(params, function (err, data) {
        if (err) {
          console.log(err);
        }
        console.log(`File uploaded successfully. ${data.Location}`);
      });
    }
  };

  (async () => {
    await sleep(60_000); // blocking sleep function
    downsample();
    writeToS3();
  })();
})();