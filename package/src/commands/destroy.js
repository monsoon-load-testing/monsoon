const { Command } = require("@oclif/command");
const Promisify = require("../util/promisify");
const ora = require("ora");
const path = require("path");

const spinner = ora();

class DestroyCommand extends Command {
  async run() {
    const cdkPath = path.join(__dirname, "../aws");
    await Promisify.changeDir(cdkPath);

    spinner.start(`Currently tearing down the infrastructure.`);
    await Promisify.execute(`cdk destroy --force`);
    spinner.succeed(`Successfully teared-down.`);
  }
}

DestroyCommand.description = `This is destroy command`;

module.exports = DestroyCommand;
