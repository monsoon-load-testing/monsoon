const Promisify = require("../util/promisify");
const inquirer = require("inquirer");
const fs = require("fs");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const { MONSOON_ENV_FILE_PATH } = require("../constants/paths");
const path = require("path");

const chooseTestDirectory = async () => {
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

  return responses.dirName;
};

const uploadTestScript = async (dirName) => {
  await Promisify.changeDir(process.cwd()); // monsoon_test
  const params = {};
  const response = await s3.listBuckets(params).promise();
  const bucketName = response.Buckets.filter((bucket) => {
    return bucket.Name.toLowerCase().includes("monsoon-monsoonloadtesting");
  })[0].Name;
  await Promisify.changeDir(path.join(process.cwd(), dirName));
  const filenames = fs.readdirSync("./", "utf-8");
  const customTestFilename = filenames.find((filename) => {
    return (
      path.extname(filename) === ".js" && !filename.startsWith("test_script")
    );
  });
  const uploadFilename = customTestFilename || "test_script.js";
  const bodyContent = fs.readFileSync(`./${uploadFilename}`, "utf-8");
  const bucketParams = {
    Bucket: `${bucketName}`,
    Key: `test_script.js`,
    Body: bodyContent,
  };
  await s3.upload(bucketParams).promise();
};

const kickoffStartingLambda = async (dirName) => {
  const lambdas = await lambda.listFunctions({}).promise();
  const startingLambda = lambdas.Functions.filter((func) => {
    return func.FunctionName.toLowerCase().includes("monsoon-startinglambda");
  })[0];
  const startingLambdaName = startingLambda.FunctionName;

  const envVariables = await fs.promises.readFile(
    MONSOON_ENV_FILE_PATH,
    "utf-8"
  );
  const access_key = envVariables.split("\n")[0].split("=")[1];
  const secret_access_key = envVariables.split("\n")[1].split("=")[1];

  let testConfig = fs.readFileSync(`./test_config.json`, "utf-8");
  testConfig = JSON.parse(testConfig);
  const { testLengthInMinutes, numberOfUsers } = testConfig;
  const testName = dirName;

  const startingLambdaParams = {
    FunctionName: startingLambdaName,
    Payload: JSON.stringify({
      access_key,
      secret_access_key,
      testLengthInMinutes,
      numberOfUsers,
      testName,
    }),
  };
  await lambda.invoke(startingLambdaParams).promise();
};

module.exports = {
  chooseTestDirectory,
  uploadTestScript,
  kickoffStartingLambda,
};
