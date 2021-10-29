const { exec } = require('child_process');
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

const option1 = {
  stepName: "Load Main Page",
  userId: "34f3n98",
  stepStartTime: 134,
  responseTime: 900,
};

*/

async function fetchScript() { //To be done once we have an S3 bucket
// fetch script and save in folder
}

async function fetchConfig() { //To be done once we have an S3 bucket
  // fetch config and save in folder
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

const startProcess = (numberOfUsers=5, success, error) => {
  let command = "";
  for (let i = 0; i < numberOfUsers; i++) {
    command = command + "node runner.js & ";
  }
  command += "node normalizer.js";
  executeCommand(
    command,
    branch => success(branch),
    errormsg => error(errormsg)
  );
}; 

(async () => {
  const scriptFile = await fetchScript();
  const configFile = await fetchConfig();
  // save to folder
  startProcess();
})();


