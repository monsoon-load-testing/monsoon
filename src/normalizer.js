const fs = require("fs");

const originTimestamp = 1635530769000; // hard-coded for dummyResults

// window is 2 seconds
// need another algorithm to calculate the normalizedTimestamps array
// from time-window, originTimestamp, and testDuration constants
const normalizedTimestamps = [
  originTimestamp,
  originTimestamp + 2000, // ms
  originTimestamp + 4000,
  originTimestamp + 6000,
  originTimestamp + 8000,
];

// make the buckets object
let buckets = {};
normalizedTimestamps.forEach((normalizedTimestamp) => {
  buckets[normalizedTimestamp] = [];
});

let files;

// we need both the filename AND the file contents
(async () => {
  console.log("inside iffe");
  files = await fs.promises.readdir("./results");
  console.log(files);
})();
