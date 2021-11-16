const { parse } = require("json2csv");
const fs = require("fs");

const fields = [
  "userId",
  "stepName",
  "stepStartTime",
  "responseTime",
  "sampleCount",
];
(async () => {
  // const data = [];
  const promises = [];
  const stepNames = [];
  const stepStartTimes = [];
  const filenames = await fs.promises.readdir("./normalizer-output");
  // console.log(filenames);
  filenames.forEach(async (filename) => {
    let promise = fs.promises.readFile(`./normalizer-output/${filename}`, {
      encoding: "utf-8",
    });
    promises.push(promise);

    const [stepStartTime, stepName] = filename.split("-");
    stepStartTimes.push(stepStartTime);
    stepNames.push(stepName);
  });

  const data = (await Promise.all(promises)).flatMap((json, idx) => {
    const obj = JSON.parse(json);
    const entries = [];
    Object.keys(obj).forEach((userId) => {
      const { metrics, sampleCount } = obj[userId];
      entries.push({
        userId,
        stepName: stepNames[idx],
        stepStartTime: stepStartTimes[idx],
        responseTime: metrics.normalizedResponseTime,
        sampleCount,
      });
    });
    return entries;
  });
  console.log(data);
  try {
    const csv = parse(data, { fields });
    const directoryName = "./csv";
    const fileName = "normalizer-output.csv";
    if (!fs.existsSync(directoryName)) {
      fs.mkdirSync(directoryName);
    }
    fs.writeFile(`${directoryName}/${fileName}`, csv, (err) => {
      if (err) throw err;
      console.log(`${fileName} has been saved`);
    });
  } catch (err) {
    console.error(err);
  }
})();
