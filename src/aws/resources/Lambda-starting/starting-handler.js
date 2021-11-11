const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const ecs = new AWS.ECS();
const ec2 = new AWS.EC2();

// *****************************************************
// EVENTBRIDGE SETUP
// *****************************************************

const EventBridge = new AWS.EventBridge({ apiVersion: "2015-10-07" });
const lambda = new AWS.Lambda();
const ruleName = "invoke-metronome-lambda-rule";

const addTarget = async () => {
  const targetParams = {
    Rule: ruleName,
    Targets: [
      {
        Arn: process.env.functionArn,
        Id: "MetronomeLambdaTriggeredByEventBridgeRule",
      },
    ],
  };

  await EventBridge.putTargets(targetParams).promise();
};

const createRule = async () => {
  const ruleParams = {
    Name: ruleName,
    Description: "Invokes the Metronome Lambda every 1 minute",
    ScheduleExpression: "rate(1 minute)",
    State: "ENABLED",
  };

  await EventBridge.putRule(ruleParams).promise();
  await setMetronomeLambdaPermissions();
  await addTarget();
};

const extractArn = async () => {
  const response = await EventBridge.listRules({
    NamePrefix: ruleName,
  }).promise();
  const sourceArn = response.Rules[0].Arn;
  console.log(sourceArn);
  return sourceArn;
};

const setMetronomeLambdaPermissions = async () => {
  const sourceArn = await extractArn();
  const paramsAddPermission = {
    Action: "lambda:InvokeFunction",
    FunctionName: process.env.metronomeLambdaName,
    Principal: "events.amazonaws.com",
    StatementId: "Invoke_metronome_lambda_every_1_min1",
    SourceArn: sourceArn,
  };

  await lambda.addPermission(paramsAddPermission).promise();
};

/*
NOTE: 
The dummyMetronomeLambda needs permission to talk to EventBridge, S3, Logs -> 
permissions granted manually in AWS console (custom execution role: metronome-lambda)
*/

// *****************************************************
// GENERATE CONFIG FILE AND SEND TO S3 BUCKET
// *****************************************************

// generate timestamps
const s3 = new AWS.S3();

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

const configObj = {
  TEST_LENGTH: Number(process.env.testLengthInMinutes) * 60 * 1000,
  TEST_UNIT: "milliseconds",
  TIME_WINDOW: Number(process.env.timeWindow) * 1000,
  ORIGIN_TIMESTAMP: Date.now() + 3 * 60 * 1000,
  NUMBER_OF_USERS: Number(process.env.numberOfUsers),
  STEP_GRACE_PERIOD: 2 * 60 * 1000,
};

const normalizedTimestamps = {
  timestamps: initializeTimestamps(
    configObj.TIME_WINDOW,
    configObj.TEST_LENGTH,
    configObj.ORIGIN_TIMESTAMP
  ),
  stepNames: ["Load main page", "Go to bin"],
};

const configFileContents = JSON.stringify(configObj);
const normalizedTimestampsContents = JSON.stringify(normalizedTimestamps);

const BUCKET_NAME = process.env.bucketName;

// for config file
const params = {
  Bucket: BUCKET_NAME,
  Key: "config.json",
  Body: configFileContents,
};

// for metronome lambda
const params2 = {
  Bucket: BUCKET_NAME,
  Key: "timestamps.json",
  Body: normalizedTimestampsContents,
};

// *****************************************************
// ECS
// *****************************************************

/*
prototype scenario: one task definition -> two containers -> 10 users
  - how to retrieve the default vpc id (can be hard-coded for prototype but important for production)
      - for production: try to find sdk method to retrieve the default vpc-id/use AWS CloudShell
  - from vpc id -> retrieve subnet ids (can be done)
  - create a cluster
  - create a task definition with our docker image
    - prototype: one task definition
  - create a service (require subnet-ids) -> should automatically spin up the specified number of tasks
  
  problems:
    - figure out the memory and cpu the container is using (for lambda, there is aws memory optomization, is there some for ecs, containers?) - until we fix memory leak and the normalizer
*/

const vpcId = process.env.vpcId;

// calling lambda handler
exports.handler = async (event) => {
  await createRule();
  await s3.upload(params).promise();
  await s3.upload(params2).promise();

  const subnetParams = {
    Filters: [
      {
        Name: "vpc-id",
        Values: [vpcId],
      },
    ],
  };

  // Retrieve subnetIds
  const response = await ec2.describeSubnets(subnetParams).promise();
  const subnets = response.Subnets.map((subnet) => subnet.SubnetId);
  const [subnet1, subnet2] = [subnets[0], subnets[1]];

  // Create task definition
  const taskParams = {
    memory: "2GB",
    cpu: "1 vCPU",
    executionRoleArn: "ecsTaskExecutionRole",
    taskRoleArn: "ecsTaskExecutionRole",
    networkMode: "awsvpc",
    containerDefinitions: [
      {
        name: "prototype-container-1",
        image: "public.ecr.aws/q9a3w3h6/monsoon-load-testing:latest",
        environment: [
          {
            name: "AWS_ACCESS_KEY_ID",
            value: process.env.AWS_ACCESS_KEY_ID,
          },
          {
            name: "AWS_SECRET_ACCESS_KEY",
            value: process.env.AWS_SECRET_ACCESS_KEY,
          },
          {
            name: "bucketName",
            value: process.env.bucketName,
          },
        ],
      },
    ],
    family: "ecs-prototype-test-one-container",
  };

  await ecs.registerTaskDefinition(taskParams).promise();

  // Create a service
  const createServiceParams = {
    desiredCount: 2, // number of tasks
    cluster: process.env.clusterName,
    serviceName: "monsoon-prototype",
    taskDefinition: "ecs-prototype-test-one-container",
    launchType: "FARGATE",
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: [subnet1, subnet2],
        assignPublicIp: "ENABLED",
      },
    },
  };

  await ecs.createService(createServiceParams).promise();
};

// *****************************************************
// {"TEST_LENGTH":1200000,"TEST_UNIT":"milliseconds","TIME_WINDOW":15000,"ORIGIN_TIMESTAMP":1635975930522,"NUMBER_OF_USERS":10}
//
// Config todos:
//  Create EventBridge rule to trigger Metronome Lambda every X minutes. - DONE
//  Create originTimestamp (Date.now()) - inside config.json
//
//  Create config.json from test parameters (number of users and test duration) and save in S3 bucket.
//     - hard code for prototype
//     - in prod, grab the config parameters from what the end user typed into CLI
//  Create normalizedTimestamps.json and save in S3 bucket.
//     - remove code from normalizer.js (and tweak normalizer.js to use the config)
//  Send start command to ECS
