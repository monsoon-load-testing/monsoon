const os = require("os");

const MONSOON_GLOBAL_DIRECTORY = os.homedir() + "/.monsoon";
const MONSOON_ENV_FILE_PATH = os.homedir() + "/.monsoon/.env";

module.exports = { MONSOON_GLOBAL_DIRECTORY, MONSOON_ENV_FILE_PATH };
