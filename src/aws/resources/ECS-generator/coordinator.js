const fs = require("fs");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const pm2 = require("pm2");
const { cwd } = require("process");

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function fetchFile(fileName) {
  const paramsObj = {
    Bucket: process.env.bucketName,
    Key: fileName,
  };

  try {
    const obj = await s3.getObject(paramsObj).promise();
    fs.writeFileSync(`./load-generation/petrichor/${fileName}`, obj.Body);
  } catch (e) {
    console.log(e);
  }
}

const startProcess = (success, error) => {
  pm2.connect(function (err) {
    if (err) {
      console.error(err);
      process.exit(2);
    }

    pm2.start(
      {
        cwd: `${cwd()}/load-generation`,
        script: "runner.js",
        autorestart: true,
        max_memory_restart: "500M",
      },
      (err, apps) => {
        if (err) {
          throw err;
        }
      }
    );

    pm2.start(
      {
        cwd: `${cwd()}/normalization`,
        script: "normalizer.js",
        autorestart: true,
        max_memory_restart: "500M",
      },
      (err, apps) => {
        if (err) {
          throw err;
        }
      }
    );
  });
};

(async () => {
  // const tempConfig = {
  //   TEST_LENGTH: 1 * 2 * 60 * 1000,
  //   TEST_UNIT: "milliseconds",
  //   TIME_WINDOW: 15_000,
  //   ORIGIN_TIMESTAMP: Date.now(),
  //   NUMBER_OF_USERS: 10,
  //   STEP_GRACE_PERIOD: 30 * 1000,
  //   RAMP_UP_LENGTH: 60000,
  // };
  fs.writeFileSync(
    `./load-generation/petrichor/config.json`,
    JSON.stringify(tempConfig)
  );
  await fetchFile("config.json");
  await fetchFile("test_script.js");

  const config = JSON.parse(
    fs.readFileSync("./load-generation/petrichor/config.json", "utf-8")
  );

  const originTimestamp = config.ORIGIN_TIMESTAMP;
  const currentTime = Date.now();

  const waitTime =
    currentTime < originTimestamp ? originTimestamp - currentTime : 0;

  await sleep(waitTime);

  startProcess(
    (message) => console.log(message),
    (error) => console.log(error)
  );

  setTimeout(() => {
    pm2.delete("runner", (err, apps) =>
      pm2.delete("normalizer", (err, apps) => pm2.disconnect())
    );
  }, config.TEST_LENGTH + config.STEP_GRACE_PERIOD);
})();
