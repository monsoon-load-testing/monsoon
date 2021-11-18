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

WeatherChannelCommand.description = `This is list command.`;

module.exports = WeatherChannelCommand;
