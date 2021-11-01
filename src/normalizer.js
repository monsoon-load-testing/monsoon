const fs = require("fs");

const originTimestamp = 1635530769000; // hard-coded for dummyResults

// window is 2 seconds, testDuration is 10s
const timeWindow = 2000; // 2s
const testDuration = 10_000; // 10s

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
console.log({ normalizedTimestamps });

// make the buckets object
let buckets = {};
normalizedTimestamps.forEach((normalizedTimestamp) => {
  buckets[normalizedTimestamp] = [];
});

(async () => {
  try {
    const filenames = await fs.promises.readdir("./results");
    filenames.forEach(async (filename) => {
      const stepName = filename.split("-")[1];

      let fileContents = await fs.promises.readFile(`./results/${filename}`, {
        encoding: "utf-8",
      });
      fileContents = JSON.parse(fileContents);
      fileContents.stepName = stepName;
      for (let idx = 1; idx < normalizedTimestamps.length; idx++) {
        if (
          fileContents.stepStartTime >= normalizedTimestamps[idx - 1] &&
          fileContents.stepStartTime < normalizedTimestamps[idx]
        ) {
          let normalizedTimestamp = normalizedTimestamps[idx - 1];
          buckets[normalizedTimestamp].push(fileContents);
        }
      }
    });
  } catch (err) {
    console.error(err);
  }
})();

setTimeout(() => {
  downsample();
}, 3000);

let finalBucket;
const downsample = () => {
  const filteredBucket = filterBucket(); // based on same userId - same stepName
  buildFinalBucket(filteredBucket);
  console.log(filteredBucket);
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
        filteredBucket.push(dataPoint);
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
      finalBucket[key] = {};
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
  console.log(finalBucket);
};

/*
Goal: convert finalBucket to a bunch of JSON files:
          finalBucket key -> filename
          finalBucket value -> file contents
      send it to a temporary folder dummyS3
*/
