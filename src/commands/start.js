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
  printLines,
} = require("../util/startCommand");

class StartCommand extends Command {
  async run() {
    const dirName = await chooseTestDirectory();
    await uploadTestScript(dirName);
    await kickoffStartingLambda(dirName);
    await printLines();
    // spinner.succeed("Monsoon has started the test.");
  }
}

StartCommand.description = `Starts the load test
---
Allows you to choose the directory containing the test script you want to run and begins running that test.
`;

module.exports = StartCommand;
