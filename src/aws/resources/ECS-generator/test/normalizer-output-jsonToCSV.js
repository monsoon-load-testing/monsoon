const { parse } = require("json2csv");
const fs = require("fs");

const fields = ["userId", "stepName", "stepStartTime", "responseTime"];
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
  const data = (await Promise.all(promises)).map((json, idx) => {
    const { userId, stepStartTime, metrics } = JSON.parse(json);
    const stepName = stepNames[idx];
    const stepStartTime = stepStartTimes[idx];
    return {
      userId,
      stepName,
      stepStartTime,
      responseTime: metrics.normalizedResponseTime,
    };
  });
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
