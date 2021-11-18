const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const EventBridge = new AWS.EventBridge({ apiVersion: "2015-10-07" });
const lambda = new AWS.Lambda();
const ecs = new AWS.ECS();
const ec2 = new AWS.EC2();
const s3 = new AWS.S3();

// *****************************************************
// EVENTBRIDGE SETUP
// *****************************************************
const ruleName = "invoke-metronome-lambda-rule"; // make it an env variable

const addTarget = async () => {
  const params = {
    Rule: ruleName,
    Targets: [
      {
        Arn: process.env.functionArn,
        Id: "MetronomeLambdaTriggeredByEventBridgeRule",
      },
    ],
  };

  await EventBridge.putTargets(params).promise();
};

const createRule = async () => {
  const params = {
    Name: ruleName,
    Description: "Invokes the Metronome Lambda every 1 minute", // make it an env variable
    ScheduleExpression: "rate(1 minute)",
    State: "ENABLED",
  };

  await EventBridge.putRule(params).promise();
  await setMetronomeLambdaPermissions();
  await addTarget();
};

const extractArn = async () => {
  const response = await EventBridge.listRules({
    NamePrefix: ruleName,
  }).promise();
  const sourceArn = response.Rules[0].Arn;
  return sourceArn;
};

const setMetronomeLambdaPermissions = async () => {
  const sourceArn = await extractArn();
  const params = {
    Action: "lambda:InvokeFunction",
    FunctionName: process.env.metronomeLambdaName,
    Principal: "events.amazonaws.com",
    StatementId: process.env.permissionStatementId, // "Invoke_metronome_lambda_every_1_min"
    SourceArn: sourceArn,
  };

  await lambda.addPermission(params).promise();
};

// *****************************************************
// GENERATE CONFIG FILE AND SEND TO S3 BUCKET
// *****************************************************
const BUCKET_NAME = process.env.bucketName;

const fetchFile = async (fileName) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName, // test_script.js
  };

  try {
    let obj = await s3.getObject(params).promise();
    let str = obj.Body.toString("utf-8");
    return str;
  } catch (e) {
    console.log(e);
  }
};

const initializeTimestamps = (timeWindow, testDuration, originTimestamp) => {
  let currentTime = originTimestamp;
  const normalizedTimestamps = [];
  const finalTimestamp = originTimestamp + testDuration;
  while (currentTime < finalTimestamp) {
    normalizedTimestamps.push(currentTime);
    currentTime += timeWindow;
  }
  normalizedTimestamps.push(finalTimestamp);
  return normalizedTimestamps;
};

const extractStepNames = async (fileName) => {
  const testScript = await fetchFile(fileName);
  const matches = testScript.match(/(?<=measure\(\s*("|'))[^"']+(?=("|'),)/g);

  return matches;
};

const configObj = {
  TEST_LENGTH: 1 * 5 * 60 * 1000, // received through event
  TEST_UNIT: "milliseconds",
  TIME_WINDOW: Number(process.env.timeWindow) * 1000,
  ORIGIN_TIMESTAMP: Date.now() + 3 * 60 * 1000, // 3 mins in the future for the containers to spin up
  NUMBER_OF_USERS: 10, // received through event
  STEP_GRACE_PERIOD: 2 * 60 * 1000, // grace period for the normalizer to finish the final batch
};

// *****************************************************
// ECS
// *****************************************************

const vpcId = process.env.vpcId;

const retrieveSubnets = async (vpcId) => {
  const params = {
    Filters: [
      {
        Name: "vpc-id",
        Values: [vpcId],
      },
    ],
  };
  const response = await ec2.describeSubnets(params).promise();
  const subnets = response.Subnets.map((subnet) => subnet.SubnetId);
  return [subnets[0], subnets[1]];
};

const createTaskDefinition = async () => {
  const params = {
    memory: "4GB",
    cpu: "2 vCPU",
    networkMode: "awsvpc",
    containerDefinitions: [
      {
        name: "monsoon-container",
        image: "public.ecr.aws/q9a3w3h6/monsoon-load-testing:latest",
        environment: [
          {
            name: "AWS_ACCESS_KEY_ID",
            value: process.env.access_key,
          },
          {
            name: "AWS_SECRET_ACCESS_KEY",
            value: process.env.secret_access_key,
          },
          {
            name: "bucketName",
            value: process.env.bucketName,
          },
        ],
      },
    ],
    family: "monsoon-task",
  };
  await ecs.registerTaskDefinition(params).promise();
};

const createService = async (subnet1, subnet2) => {
  const desiredCount = 2; // number of tasks - passed from CLI through event
  const params = {
    desiredCount,
    cluster: process.env.clusterName,
    serviceName: "monsoon-service",
    taskDefinition: "monsoon-task",
    launchType: "FARGATE",
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: [subnet1, subnet2],
        assignPublicIp: "ENABLED",
      },
    },
  };
  await ecs.createService(params).promise();
};

// calling lambda handler
exports.handler = async (event) => {
  await createRule();
  const stepNames = await extractStepNames("test_script.js");
  const timestamps = initializeTimestamps(
    configObj.TIME_WINDOW,
    configObj.TEST_LENGTH,
    configObj.ORIGIN_TIMESTAMP
  );
  const testName = "downpour_test"; // testName needs to be passed through an event from the CLI client
  const normalizedTimestamps = {
    timestamps,
    stepNames,
    tableName: `${testName}-${configObj.ORIGIN_TIMESTAMP}`, // testName needs to be passed through an event from the CLI client
  };
  const configFileContents = JSON.stringify(configObj);
  const normalizedTimestampsContents = JSON.stringify(normalizedTimestamps);

  // for config file
  const configParams = {
    Bucket: BUCKET_NAME,
    Key: "config.json",
    Body: configFileContents,
  };

  // for metronome lambda
  const timestampsParams = {
    Bucket: BUCKET_NAME,
    Key: "timestamps.json",
    Body: normalizedTimestampsContents,
  };
  await s3.upload(configParams).promise();
  await s3.upload(timestampsParams).promise();

  // Retrieve subnetIds
  const [subnet1, subnet2] = await retrieveSubnets(vpcId);

  // Create task definition
  await createTaskDefinition();

  // Create a service
  await createService(subnet1, subnet2);
};
