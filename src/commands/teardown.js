const { Command } = require("@oclif/command");
const Promisify = require("../util/promisify");
const ora = require("ora");
const path = require("path");

const spinner = ora();

class TeardownCommand extends Command {
  async run() {
    const cdkPath = path.join(__dirname, "../aws");
    await Promisify.changeDir(cdkPath);

    spinner.start(`Currently tearing down the infrastructure.`);
    await Promisify.execute(`cdk destroy --force`);
    spinner.succeed(`Successfully teared-down.`);
  }
}

TeardownCommand.description = `This is teardown command`;

module.exports = TeardownCommand;
