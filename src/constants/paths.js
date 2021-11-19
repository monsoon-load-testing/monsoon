const os = require("os");

const MONSOON_GLOBAL_DIRECTORY = os.homedir() + "/.monsoon";
const MONSOON_ENV_FILE_PATH = os.homedir() + "/.monsoon/.env";
const START_HERE_REPO =
  "https://github.com/monsoon-load-testing/monsoon_tests.git";

module.exports = {
  MONSOON_GLOBAL_DIRECTORY,
  MONSOON_ENV_FILE_PATH,
  START_HERE_REPO,
};
