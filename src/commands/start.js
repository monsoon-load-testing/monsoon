const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});
const { Command } = require("@oclif/command");
const ora = require("ora");
const spinner = ora();

const {
  chooseTestDirectory,
  uploadTestScript,
  kickoffStartingLambda,
} = require("../util/startCommand");

class StartCommand extends Command {
  async run() {
    const dirName = await chooseTestDirectory();
    await uploadTestScript(dirName);
    await kickoffStartingLambda(dirName);

    spinner.succeed("Monsoon has started the test.");
  }
}

StartCommand.description = `This is start command.`;

module.exports = StartCommand;
