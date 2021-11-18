const { Command } = require("@oclif/command");
const Promisify = require("../util/promisify");
const { cli } = require("cli-ux");
const fs = require("fs");
const ora = require("ora");
const spinner = ora();
const { testTemplate, testConfig } = require("../constants/template");

class NewTestCommand extends Command {
  async run() {
    await Promisify.changeDir(process.cwd());
    let dirNameExists = true;
    let dirName;
    while (dirNameExists) {
      dirName = await cli.prompt(
        "What name would you like to use for your new test directory?"
      );
      dirNameExists = fs.existsSync(`./${dirName}`);
      if (!dirNameExists) {
        break;
      } else {
        spinner.fail(`The name ${dirName} already exists.`);
      }
    }
    spinner.succeed(`The new test directory ${dirName} has been created.`);
    await fs.promises.mkdir(`./${dirName}`);
    await Promisify.changeDir(`./${dirName}`);
    await fs.promises.writeFile("./test_script.js", testTemplate);
    await fs.promises.writeFile(
      "./test_config.json",
      JSON.stringify(testConfig)
    );
  }
}

NewTestCommand.description = `This is new-test command.`;

module.exports = NewTestCommand;
