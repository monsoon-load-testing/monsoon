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

async function fetchScript() {

}

async function fetchConfig() {
  return 
}

// modules.exports = {
  
// }

// USER_SCRIPT_LOCATION = process.env[3]
// https://dev.to/alexdhaenens/how-to-execute-shell-commands-in-js-2j5j

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
  const script = await fetchScript();
  const config = await fetchConfig();
  startProcess();
})();

/*
inside runner.js
const config = require('../configuration/config.js')
*/