const { Command } = require("@oclif/command");
const Promisify = require("../util/promisify");
const ora = require("ora");
const path = require("path");
const fs = require("fs");

const { MONSOON_ENV_FILE_PATH } = require("../constants/paths");

const spinner = ora();

const generateDatabaseName = () => `monsoonDB-${Date.now()}`;

const writeDatabaseNameInEnvFile = async () => {
  const DATABASE_NAME = generateDatabaseName();
  process.env.DATABASE_NAME = DATABASE_NAME;
  const envPath = path.join(__dirname, "../../.env"); // the current file path
  const envVariables = await fs.promises.readFile(envPath, "utf-8");
  const updatedEnvVariables = envVariables
    .split("\n")
    .map((keyVal) => {
      if (keyVal.includes("DATABASE_NAME")) {
        return `DATABASE_NAME=${DATABASE_NAME}`;
      }
      return keyVal;
    })
    .join("\n");
  fs.writeFileSync(envPath, updatedEnvVariables);
};

class DeployCommand extends Command {
  async run() {
    const cdkPath = path.join(__dirname, "../aws"); // the current file path
    await Promisify.changeDir(cdkPath);
    // extract profile name from .env file
    const envVariables = await fs.promises.readFile(
      MONSOON_ENV_FILE_PATH,
      "utf-8"
    );
    const AWS_PROFILE = envVariables.split("\n")[2].split("=")[1];
    await writeDatabaseNameInEnvFile();

    spinner.start(`Currently compiling your CloudFormation.`);
    await Promisify.execute(`cdk synth --profile=${AWS_PROFILE}`);
    spinner.succeed(`☔ Successfully compiled.`);

    spinner.start(`Currently bootstraping the infrastructure.`);
    await Promisify.execute(`cdk bootstrap --profile=${AWS_PROFILE}`);
    spinner.succeed(`☔ Successfully bootstraped.`);

    spinner.start(`Currently deploying the infrastructure.`);
    await Promisify.execute(
      `cdk deploy --require-approval never --profile=${AWS_PROFILE}`
    );
    spinner.succeed(`🌧️  Successfully deployed.`);
  }
}

DeployCommand.description = `Deploys Monsoon infrastructure inside your AWS account`;

module.exports = DeployCommand;
