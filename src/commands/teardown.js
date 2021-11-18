const { Command } = require("@oclif/command");
const Promisify = require("../util/promisify");
const ora = require("ora");
const path = require("path");
const fs = require("fs");
const { MONSOON_ENV_FILE_PATH } = require("../constants/paths");

const spinner = ora();

class TeardownCommand extends Command {
  async run() {
    const envVariables = await fs.promises.readFile(
      MONSOON_ENV_FILE_PATH,
      "utf-8"
    );
    const AWS_PROFILE = envVariables.split("\n")[2].split("=")[1];
    const cdkPath = path.join(__dirname, "../aws");
    await Promisify.changeDir(cdkPath);

    spinner.start(`Currently tearing down the infrastructure.`);
    await Promisify.execute(`cdk destroy --force --profile=${AWS_PROFILE}`);
    spinner.succeed(`Successfully teared-down.`);
  }
}

TeardownCommand.description = `This is teardown command`;

module.exports = TeardownCommand;
