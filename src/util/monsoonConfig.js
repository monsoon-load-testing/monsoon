const { cli } = require("cli-ux");
const ora = require("ora");
const spinner = ora();
const fs = require("fs");
const path = require("path");
const {
  MONSOON_GLOBAL_DIRECTORY,
  MONSOON_ENV_FILE_PATH,
} = require("../constants/paths");

const setAWSCredentials = async (existGlobalDir = false) => {
  const AWS_ACCESS_KEY_ID = await cli.prompt(
    "Please enter your AWS ACCESS KEY ID",
    { type: "hide" }
  );
  const AWS_SECRET_ACCESS_KEY = await cli.prompt(
    "Please enter your AWS SECRET Key",
    {
      type: "hide",
    }
  );
  const AWS_PROFILE = await cli.prompt(
    "Please enter the name of your AWS profile"
  );
  const ENV_VARIABLES = `AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}\nAWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}\nAWS_PROFILE=${AWS_PROFILE}\n`;
  console.log("");

  if (!existGlobalDir) {
    fs.mkdirSync(MONSOON_GLOBAL_DIRECTORY);
  }
  spinner.start();
  // Write AWS credentials to /.monsoon .env file
  fs.writeFileSync(MONSOON_ENV_FILE_PATH, ENV_VARIABLES);
  // Write AWS_PROFILE to package .env file
  fs.writeFileSync(
    path.join(__dirname, "../../.env"),
    `AWS_PROFILE=${AWS_PROFILE}\nAWS_REGION=us-east-1`
  );
  spinner.succeed("Your AWS credentials saved to monsoon environment\n");
};

const updateAWSCredentials = async (existGlobalDir) => {
  await setAWSCredentials(existGlobalDir);
};

module.exports = { setAWSCredentials, updateAWSCredentials };
