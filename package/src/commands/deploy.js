const { Command } = require("@oclif/command");
const Promisify = require("../util/promisify");
const ora = require("ora");
const os = require("os");
const path = require("path");

const spinner = ora();

class DeployCommand extends Command {
  async run() {
    console.log(os.homedir()); // home directory for each os
    console.log(process.cwd()); // current working directory that the user is in their local machine
    const cdkPath = path.join(__dirname, "../aws"); // the current file path
    await Promisify.changeDir(cdkPath);

    spinner.start(`Currently synthing your AWS account`);
    await Promisify.execute(`cdk synth`);
    spinner.succeed(`Successfully synthesized`);

    spinner.start(`Currently bootstraping the infrastructure`);
    await Promisify.execute(`cdk bootstrap`);
    spinner.succeed(`Successfully bootstraped`);

    spinner.start(`Currently deploying the infrastructure`);
    await Promisify.execute(`cdk deploy --require-approval never`);
    spinner.succeed(`Successfully deployed.`);
  }
}

DeployCommand.description = `This is deploy command`;

module.exports = DeployCommand;
