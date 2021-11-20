const { Command } = require("@oclif/command");
const Promisify = require("../util/promisify");
const path = require("path");
const ora = require("ora");
const spinner = ora();

class WeatherChannelCommand extends Command {
  async run() {
    await Promisify.changeDir(path.join(__dirname, "../weather-channel"));
    spinner.succeed("You can view your results at http://localhost:5000");
    await Promisify.execute(`npm start`);
  }
}

WeatherChannelCommand.description = `Displays your test results dashboard on localhost:5000
---
Starts a local server that serves the test results dashboard. To view this dashboard, visit localhost:5000 in your browser.`;

module.exports = WeatherChannelCommand;
