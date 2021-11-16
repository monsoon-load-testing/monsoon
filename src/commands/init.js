const { Command } = require("@oclif/command");
const { cli } = require("cli-ux");
const fs = require("fs");
const ora = require("ora");

const spinner = ora();
const {
  setAWSCredentials,
  updateAWSCredentials,
} = require("../util/monsoonConfig");

const {
  MONSOON_GLOBAL_DIRECTORY,
  MONSOON_ENV_FILE_PATH,
} = require("../constants/paths");

class InitCommand extends Command {
  async run() {
    if (fs.existsSync(MONSOON_ENV_FILE_PATH)) {
      console.log("");
      spinner.start();
      spinner.succeed("Your monsoon AWS env file already exists.");
      let updateAWS = await cli.prompt("Do you want to update your AWS?");
      if (updateAWS === "y") {
        await updateAWSCredentials();
      }
    } else {
      await setAWSCredentials();
    }
    let goodDirectory = await cli.prompt(
      `You are currently in ${process.cwd()}\nDo you want to create your Monsoon folder here? (y/n)`
    );
    goodDirectory = goodDirectory.toLowerCase();
    if (goodDirectory === "y") {
      // await createNewTemplate();
      console.log(MONSOON_GLOBAL_DIRECTORY);
    } else if (goodDirectory === "n") {
      console.log("Please move to where you want your Monsoon project to be.");
    }
  }
}

InitCommand.description = `This is init command description`;

module.exports = InitCommand;
