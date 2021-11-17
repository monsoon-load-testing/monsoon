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
  const AWS_PROFILE = await cli.prompt(
    "Please enter the name of your AWS profile"
  );
  const ENV_VARIABLES = `AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}\nAWS_SECRET_KEY=${AWS_SECRET_KEY}\nAWS_PROFILE=${AWS_PROFILE}\n`;
  console.log("");
  spinner.start();
  spinner.succeed(
    "Your AWS credentials are saved in global .monsoon directory."
  );

  spinner.start();
  if (!existGlobalDir) {
    fs.mkdirSync(MONSOON_GLOBAL_DIRECTORY);
    // Write AWS credentials to /enmonsoon .env file
    fs.writeFileSync(MONSOON_ENV_FILE_PATH, ENV_VARIABLES);
    spinner.succeed("Credentials saved to monsoon environment\n");
  }
};

const updateAWSCredentials = async (existGlobalDir) => {
  await setAWSCredentials(existGlobalDir);
};

module.exports = { setAWSCredentials, updateAWSCredentials };
