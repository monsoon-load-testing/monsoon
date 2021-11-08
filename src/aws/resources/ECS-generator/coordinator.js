const { exec } = require("child_process");
const fs = require("fs");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const pm2 = require('pm2')
const { cwd } = require("process")

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

const executeCommand = (cmd, successCallback, errorCallback) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      // console.log(`error: ${error.message}`);
      if (errorCallback) {
        errorCallback(error.message);
      }
      return;
    }
    if (stderr) {
      //console.log(`stderr: ${stderr}`);
      if (errorCallback) {
        errorCallback(stderr);
      }
      return;
    }
    //console.log(`stdout: ${stdout}`);
    if (successCallback) {
      successCallback(stdout);
    }
  });
};

const startProcess = (success, error) => {
  pm2.connect(function(err) {
    if (err) {
      console.error(err)
      process.exit(2)
    }
  
    pm2.start({
      cwd: `${cwd()}/load-generation`,
      script: 'runner.js',
      autorestart: false,
      max_memory_restart: "350M"
      }, (err, apps) => {
        if (err) { throw err }
      })
    });

  // const commandNormalizer = "cd normalization; node normalizer.js";

  // executeCommand(
  //   commandNormalizer,
  //   (branch) => success(branch),
  //   (errormsg) => error(errormsg)
  // );
};

(async () => {
  const tempConfig = {
    TEST_LENGTH: 1 * 1 * 15 * 1000,
    TEST_UNIT: "milliseconds",
    TIME_WINDOW: 15_000,
    ORIGIN_TIMESTAMP: Date.now(),
    NUMBER_OF_USERS: 10,
    STEP_GRACE_PERIOD: 30 * 1000
  };
  fs.writeFileSync(
    `./load-generation/petrichor/config.json`,
    JSON.stringify(tempConfig)
  );
  // await fetchFile("config.json");
  // await fetchFile("test_script.js");


  startProcess(
    (message) => console.log(message),
    (error) => console.log(error)
  );
  setTimeout(() => {
    pm2.delete("runner", (err, apps) => pm2.disconnect());
  }, tempConfig.TEST_LENGTH + tempConfig.STEP_GRACE_PERIOD)
})();