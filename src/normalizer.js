const fs = require("fs");

const originTimestamp = 1635530769000; // hard-coded for dummyResults

// window is 2 seconds, testDuration is 10s
const timeWindow = 2000; // 2s
const testDuration = 10_000; // 10s

// Intialize timestamps array
/*
  - initialize normalizedTimestamps array
  - start from originTimestamp
  - currentTime = originTimestamp
  - while currentTime < testDuration
    - normalizedTimestamps.push(currentTime)
    - increment the currentTime by timeWindow amount
  - return normalizedTimestamps
*/

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
console.log(normalizedTimestamps);

// const normalizedTimestamps = [
//   originTimestamp,
//   originTimestamp + 2000, // ms
//   originTimestamp + 4000,
//   originTimestamp + 6000,
//   originTimestamp + 8000,
//   originTimestamp + 10000,
// ];

// make the buckets object
let buckets = {};
normalizedTimestamps.forEach((normalizedTimestamp) => {
  buckets[normalizedTimestamp] = [];
});

// fs.readdir returns undefined
// fs.readdir works with an asynchronous callback
// fs.readdir("./results", (err, filenames) => {
//   try {
//     filenames.forEach((filename) => {
//       const stepName = filename.split("-")[1];

//       fs.readFile(`./results/${filename}`, "utf-8", (err, fileContents) => {
//         // NOTE: fileContents is initially a STRING
//         fileContents = JSON.parse(fileContents);
//         fileContents.stepName = stepName;
//         for (let idx = 1; idx < normalizedTimestamps.length; idx++) {
//           if (
//             fileContents.stepStartTime >= normalizedTimestamps[idx - 1] &&
//             fileContents.stepStartTime < normalizedTimestamps[idx]
//           ) {
//             let normalizedTimestamp = normalizedTimestamps[idx - 1];
//             buckets[normalizedTimestamp].push(fileContents);
//           }
//         }
//       });
//     });
//     // do the downsampling
//     // downsample();
//   } catch (error) {
//     console.log(error);
//   }
// });

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
  // console.log(buckets);
  /*
    iterate through normalizedTimestamps:
   - break down buckets[current normalizedTimestamp] BY STEP
     - for each time-window in buckets -> filter based on same user && same step
        - loop through each object of the bucket[normalizedTimestamp]
        - bucket2 = {}
        - check if the key=userId-stepName-normalizedTimestamp exists in bucket2
          - if not, bucket2[userId-stepName-normalizedTimestamp] = [currentObject]
          - if yes, bucket2[userId-stepname-normalizedTimestamp].push(currentObject)
        - bucket2[userId-stepName-normalizedTimestamp]
   - do averaging calculation for each step of each user in that time-window
     
   - make a new JSON with ALL users at that stepName/normalizedTimestamp combination
   - data structure:
      - stepName-normalizedTimestamp:
      - examples:
      - LoadMainPage-15.json -> {
        34f3n98: {
          stepName: "Load Main Page",
          userId: "34f3n98",
          stepStartTime: 17,
          metrics: {
            normalizedResponseTime: 900, // calculated average responseTime
          },
        },
        ...other users...
      }
  */
}, 3000);

const downsample = () => {
  const filteredBucket = {}; // based on same userId - same stepName
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
  console.log(filteredBucket);
};
