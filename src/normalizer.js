const fs = require("fs");

const originTimestamp = 1635530769000; // hard-coded for dummyResults

// window is 2 seconds, testDuration is 10s
// need another algorithm to calculate the normalizedTimestamps array
// from time-window, originTimestamp, and testDuration constants
const normalizedTimestamps = [
  originTimestamp,
  originTimestamp + 2000, // ms
  originTimestamp + 4000,
  originTimestamp + 6000,
  originTimestamp + 8000,
  originTimestamp + 10000,
];

// make the buckets object
let buckets = {};
normalizedTimestamps.forEach((normalizedTimestamp) => {
  buckets[normalizedTimestamp] = [];
});

fs.readdir("./results", (err, filenames) => {
  try {
    filenames.forEach((filename) => {
      const stepName = filename.split("-")[1];

      fs.readFile(`./results/${filename}`, "utf-8", (err, fileContents) => {
        // NOTE: fileContents is initially a STRING
        fileContents = JSON.parse(fileContents);
        fileContents.stepName = stepName;
        for (let idx = 1; idx < normalizedTimestamps.length; idx++) {
          if (
            fileContents.stepStartTime >= normalizedTimestamps[idx - 1] &&
            fileContents.stepStartTime < normalizedTimestamps[idx]
          ) {
            let normalizedTimestamp = normalizedTimestamps[idx - 1];
            // console.log(normalizedTimestamp);
            buckets[normalizedTimestamp].push(fileContents);
          }
        }
        // console.log(buckets);
      });
    });
  } catch (error) {
    console.log(error);
  }
});

setTimeout(() => {
  console.log(buckets);
}, 2000);
