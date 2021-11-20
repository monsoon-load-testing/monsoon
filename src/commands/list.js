const { Command } = require("@oclif/command");
const Promisify = require("../util/promisify");
const fs = require("fs");

class ListCommand extends Command {
  async run() {
    await Promisify.changeDir(process.cwd());
    const names = fs.readdirSync("./", "utf-8");
    const excludedNames = [
      "node_modules",
      "package.json",
      "package-lock.json",
      ".git",
    ];
    const targetNames = names.filter((name) => {
      return !excludedNames.includes(name);
    });

    targetNames.forEach((name) => console.log(name));
  }
}

ListCommand.description = `Lists all current test directories in the monsoon_tests folder`;

module.exports = ListCommand;
