const { Command } = require("@oclif/command");

class StartCommand extends Command {
  async run() {
    console.log("start");
  }
}

/*
this command will navigate to the current monsoon directory (the user should be in
here when they issue monsoon commands)

this command will extract all the names of the directories (except the node_modules)
this command will display all options of the test names
The user has the option to choose which test they want to start

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
    }
spinner.succeed(``)
*/

StartCommand.description = `This is start command.`;

module.exports = StartCommand;
