const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});
const { Command } = require("@oclif/command");
const Promisify = require("../util/promisify");
const inquirer = require("inquirer");
const fs = require("fs");

class StartCommand extends Command {
  async run() {
    await Promisify.changeDir(process.cwd());
    const names = fs.readdirSync("./", "utf-8");
    const excludedNames = ["node_modules", "package.json", "package-lock.json"];
    const targetNames = names.filter((name) => {
      return !excludedNames.includes(name);
    });

    const choices = targetNames.map((name) => {
      return { name };
    });
    const responses = await inquirer.prompt([
      {
        name: "dirName",
        message: "Choose your test's directory",
        type: "list",
        choices,
      },
    ]);
    const dirName = responses.dirName;
    // sdk codes running...
  }
}

/*
Sdk level (extract AWS_PROFILE from .monsoon/.env)
This command will look for any js file.
  list all buckets
  find the bucket that has `Monsoon-monsoonloadtesting` (includes)
  if there is any js file addition to test_script.js
    - upload the file to S3 bucket (change the name to test_script.js)
  else
    - upload the default test_script.js
  
List all the lambdas
Find the lambda with the name `monsoon-startinglambda` (includes)
Extract AWS_ACCESS_KEY_ID and AWS_SECRET_KEY
This command will read the test_config.json and send event to the startingLambda
  - testLengthInMinutes
  - numberOfUsers
Invoke the lambda and send information through the event object
  - even object includes
    { 
      testlengthInMinutes: ...,
      numberOfusers: ...,
      access_key: ....,
      secret_access_key: ....,
      testName: testDirectoryName (cannot have '-')
    }
spinner.succeed(``)
*/

StartCommand.description = `This is start command.`;

module.exports = StartCommand;
