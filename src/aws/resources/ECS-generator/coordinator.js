const { exec } = require("child_process");
const fs = require("fs");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

/*
MENTAL MODEL:
 - coordinator tells config.js to fetch script and config from s3 bucket
 - Start X instances of runner and 1 instance of normalizer
*/

/*
START_RAIN or START_STORM - Petrichor
  - Gets test script from location (S3 prod, local file test)
  - Gets total test length from location (S3 prod, local file test)
  - Gets Origin Timestamp from location (S3 prod, local file test)
  - Gets number of users from location (S3 prod, local file test)
  - Start X instances of runner and 1 instance of normalizer
*/

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

const startProcess = (numberOfUsers = 5, success, error) => {
  let commandRunner = "node runner.js";
  for (let i = 0; i < numberOfUsers - 1; i++) {
    commandRunner = commandRunner + " & node runner.js";
  }
  let commandNormalizer = "node normalizer.js";
  console.log(commandRunner);
  console.log(commandNormalizer);

  executeCommand(
    "echo hi",
    (branch) => success(branch),
    (errormsg) => error(errormsg)
  );
  executeCommand(
    "cd load-generation",
    (branch) => success(branch),
    (errormsg) => error(errormsg)
  );

  console.log(__dirname);
  // /home/stephanie/monsoon/src/aws/resources/ECS-generator
  // /home/stephanie/monsoon/src/aws/resources/ECS-generator/load-generation
  executeCommand(
    commandRunner,
    (branch) => success(branch),
    (errormsg) => error(errormsg)
  );
  executeCommand(
    "cd ../normalization",
    (branch) => success(branch),
    (errormsg) => error(errormsg)
  );
  executeCommand(
    commandNormalizer,
    (branch) => success(branch),
    (errormsg) => error(errormsg)
  );
};

(async () => {
  // await fetchFile("test_script.js");
  // await fetchFile("config.json");
  const tempConfig = {
    TEST_LENGTH: 1200000,
    TEST_UNIT: "milliseconds",
    TIME_WINDOW: 15_000,
    ORIGIN_TIMESTAMP: Date.now(),
    NUMBER_OF_USERS: 10,
  };

  fs.writeFileSync(
    `./load-generation/petrichor/config.json`,
    JSON.stringify(tempConfig)
  );

  startProcess(
    1,
    () => {},
    () => {}
  );
})();
