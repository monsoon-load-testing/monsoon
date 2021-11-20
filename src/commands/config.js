const { Command } = require("@oclif/command");
const fs = require("fs");
const {
  MONSOON_ENV_FILE_PATH,
  MONSOON_GLOBAL_DIRECTORY,
} = require("../constants/paths");

const { updateAWSCredentials } = require("../util/monsoonConfig");

class ConfigCommand extends Command {
  async run() {
    if (!fs.existsSync(MONSOON_ENV_FILE_PATH)) {
      fs.mkdirSync(MONSOON_GLOBAL_DIRECTORY);
    }
    await updateAWSCredentials(true);
  }
}

ConfigCommand.description = `Allows you to change the AWS credentials associated with your Monsoon infrastructure

You will need:
  - your AWS access key
  - your AWS secret key
  - your AWS profile name
`;

module.exports = ConfigCommand;
