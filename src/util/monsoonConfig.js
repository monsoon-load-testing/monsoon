const { cli } = require("cli-ux");
const Promisify = require("../util/promisify");
const ora = require("ora");
const spinner = ora();
const fs = require("fs");
const {
  MONSOON_GLOBAL_DIRECTORY,
  MONSOON_ENV_FILE_PATH,
} = require("../constants/paths");

const setAWSCredentials = async (existGlobalDir = false) => {
  const AWS_ACCESS_KEY_ID = await cli.prompt(
    "Please enter your AWS ACCESS KEY ID",
    { type: "hide" }
  );
  const AWS_SECRET_KEY = await cli.prompt("Please enter your AWS SECRET Key", {
    type: "hide",
  });
  const AWS_REGION = await cli.prompt("Please enter your AWS REGION");
  const ENV_VARIABLES = `AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}\nAWS_SECRET_KEY=${AWS_SECRET_KEY}\nAWS_REGION=${AWS_REGION}\n`;

  spinner.start("Updating AWS config file...");
  await Promisify.execute(`aws configure set region ${AWS_REGION}`);
  await Promisify.execute(
    `aws configure set aws_access_key_id ${AWS_ACCESS_KEY_ID}`
  );
  await Promisify.execute(
    `aws configure set aws_secret_access_key ${AWS_SECRET_KEY}`
  );
  spinner.succeed("AWS config file updated with credentials");

  spinner.start();
  if (!existGlobalDir) {
    fs.mkdirSync(MONSOON_GLOBAL_DIRECTORY);
  }
  fs.writeFileSync(MONSOON_ENV_FILE_PATH, ENV_VARIABLES);
  spinner.succeed("Credentials saved to monsoon environment\n");
};

const updateAWSCredentials = async (existGlobalDir) => {
  await setAWSCredentials(existGlobalDir);
};

module.exports = { setAWSCredentials, updateAWSCredentials };
