const { Command } = require("@oclif/command");
const { cli } = require("cli-ux");
const fs = require("fs");
const ora = require("ora");
const Promisify = require("../util/promisify");

const spinner = ora();

const {
  setAWSCredentials,
  updateAWSCredentials,
} = require("../util/monsoonConfig");

const {
  MONSOON_ENV_FILE_PATH,
  START_HERE_REPO,
} = require("../constants/paths");

const cloneStartHereRepo = async () => {
  await Promisify.changeDir(process.cwd());

  const repoExists = fs.existsSync("./monsoon_tests"); // hard_coded folder test name
  if (!repoExists) {
    spinner.start(`Generating monsoon directory && installing packages.`);
    await Promisify.execute(`git clone -q ${START_HERE_REPO}`);
    await Promisify.execute(`cd monsoon_tests && rm -rf .git && npm i`);
    spinner.succeed(`Monsoon directory is successfully generated.`);
  } else {
    spinner.start();
    spinner.succeed(`Monsoon directory monsoon_tests already exists`);
  }
};

class InitCommand extends Command {
  async run() {
    if (fs.existsSync(MONSOON_ENV_FILE_PATH)) {
      console.log("");
      spinner.start();
      spinner.succeed("Your monsoon AWS env file already exists.");
      let updateAWS = await cli.prompt(
        "Do you want to update your AWS information?(y/n)"
      );
      if (updateAWS.toLowerCase().startsWith("y")) {
        await updateAWSCredentials(true);
      }
    } else {
      await setAWSCredentials();
      await cloneStartHereRepo();
    }
  }
}

InitCommand.description = `Create global .monsoon directory and .env file
---
The Monsoon directory is located at home directory ~/.monsoon.
The .env file inside contains your AWS credentials and AWS profile name for Monsoon to work with the infranstructure.
`;

module.exports = InitCommand;
