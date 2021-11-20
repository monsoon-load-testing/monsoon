const { Command } = require("@oclif/command");
const Promisify = require("../util/promisify");
const ora = require("ora");
const path = require("path");
const fs = require("fs");
const { MONSOON_ENV_FILE_PATH } = require("../constants/paths");

const spinner = ora();

class DeployCommand extends Command {
  async run() {
    const cdkPath = path.join(__dirname, "../aws"); // the current file path
    await Promisify.changeDir(cdkPath);
    // extract profile name from .env file
    const envVariables = await fs.promises.readFile(
      MONSOON_ENV_FILE_PATH,
      "utf-8"
    );
    const AWS_PROFILE = envVariables.split("\n")[2].split("=")[1];

    spinner.start(`Currently compiling your CloudFormation.`);
    await Promisify.execute(`cdk synth --profile=${AWS_PROFILE}`);
    spinner.succeed(`Successfully compiled.`);

    spinner.start(`Currently bootstraping the infrastructure.`);
    await Promisify.execute(`cdk bootstrap --profile=${AWS_PROFILE}`);
    spinner.succeed(`Successfully bootstraped.`);

    spinner.start(`Currently deploying the infrastructure.`);
    await Promisify.execute(
      `cdk deploy --require-approval never --profile=${AWS_PROFILE}`
    );
    spinner.succeed(`Successfully deployed.`);
  }
}

DeployCommand.description = `Deploy the infrastructure on your AWS account`;

module.exports = DeployCommand;
