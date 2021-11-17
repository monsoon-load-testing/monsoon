const os = require("os");

const { Command } = require("@oclif/command");
const ora = require("ora");
const path = require("path");

const Promisify = require("../util/promisify");

const spinner = ora();

class DestroyCommand extends Command {
  async run() {
    await Promisify.changeDir(os.homedir());
    await Promisify.execute(`rm -rf .monsoon`);
    spinner.succeed(`.monsoon directory successfully removed`);
  }
}

DestroyCommand.description = `Deletes the .monsoon directory from the user's local machine`;

module.exports = DestroyCommand;
