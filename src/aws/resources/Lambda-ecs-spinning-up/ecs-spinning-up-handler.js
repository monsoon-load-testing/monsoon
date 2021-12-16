const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const EventBridge = new AWS.EventBridge({ apiVersion: "2015-10-07" });
const lambda = new AWS.Lambda();
const ecs = new AWS.ECS();
const ec2 = new AWS.EC2();
const s3 = new AWS.S3();

/*
 - fetch config from S3. Compare with Date.now(). Wait as needed
 - calculate tasksIncrements
 - get list of tasks
 - loopLimit = nbrOfTasks + taskIncrement
 - while nbrOfTasks < desiredCount && nbrOfTask < loopLimit
   - spin up task
*/

const ruleName = process.env.ruleName; // "invoke-ecs-spinning-up-lambda"
const targetId = process.env.targetId; // "ECSSPinningUpLambdaTriggeredByEventBridgeRule"
const permissionStatementId = process.env.permissionStatementIdECS;
const vpcId = process.env.vpcId;
const clusterName = process.env.clusterName;
const bucketName = process.env.bucketName;

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const listTasks = async () => {
  const params = {
    cluster: process.env.clusterName, // Passed from cdk level
  };
  const tasks = await ecs.listTasks(params).promise();
  return tasks.taskArns;
};

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

const removeTarget = async () => {
  const targetParams = {
    Rule: ruleName,
    Ids: [targetId],
    Force: true,
  };
  await EventBridge.removeTargets(targetParams).promise();
};

const deleteRule = async () => {
  const params = {
    Name: ruleName,
    Force: true,
  };
  await EventBridge.deleteRule(params).promise();
};

const removeECSSpinningUpPermissions = async (functionName) => {
  const params = {
    FunctionName: functionName,
    StatementId: permissionStatementId,
  };

  await lambda.removePermission(params).promise();
  console.log("ECS Spinning up lambda permissions removed");
};

const fetchConfig = async () => {
  const params = {
    Bucket: bucketName,
    Key: "config.json",
  };

  return s3.getObject(params).promise();
};

exports.handler = async (event, context) => {
  const functionName = context.functionName;
  const configRes = await fetchConfig();
  const config = JSON.parse(configRes.Body);

  const originTimestamp = config.ORIGIN_TIMESTAMP;
  const currentTime = Date.now();
  const nbrOfUsers = config.NUMBER_OF_USERS;
  const rampUpLengthInMin = config.RAMP_UP_LENGTH / 1000 / 60;

  const usersPerContainer = 20;
  const desiredTaskCount = nbrOfUsers / usersPerContainer;
  let tasksIncrementPerMin =
    desiredTaskCount / rampUpLengthInMin !== Infinity
      ? Math.round(desiredTaskCount / rampUpLengthInMin)
      : desiredTaskCount;

  let currentTasks = await listTasks();
  let currentTasksCount = currentTasks.length;
  let failedTasksCount =
    tasksIncrementPerMin - (currentTasksCount % tasksIncrementPerMin);
  const iterationTaskCountLimit =
    currentTasksCount + tasksIncrementPerMin + failedTasksCount;
  const taskPromises = [];

  // const waitTime =
  //   currentTime < originTimestamp ? originTimestamp - currentTime : 0;

  console.log(
    "nbrOfUsers, desiredTaskCount, rampUpLengthInMin, tasksIncrementPerMin:",
    nbrOfUsers,
    desiredTaskCount,
    rampUpLengthInMin,
    tasksIncrementPerMin
  );
  console.log(
    "currentTasksCount, iterationTaskCountLimit:",
    currentTasksCount,
    iterationTaskCountLimit
  );

  if (currentTasksCount > 0 && currentTime < originTimestamp) {
    console.log("not yet!");
    return;
  }

  if (currentTasksCount === desiredTaskCount) {
    await sleep(2 * 60 * 1000);
    currentTasks = await listTasks();
    currentTasksCount = currentTasks.length;

    if (currentTasksCount === desiredTaskCount) {
      await removeECSSpinningUpPermissions(functionName);
      await removeTarget();
      await deleteRule();
      return;
    }
  }

  // Retrieve subnetIds
  const [subnet1, subnet2] = await retrieveSubnets(vpcId);
  console.log("subnets:", subnet1, subnet2);
  console.log("clusterName", clusterName);
  const paramsTasks = {
    cluster: clusterName,
    taskDefinition: "monsoon-task",
    launchType: "FARGATE",
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: [subnet1, subnet2],
        assignPublicIp: "ENABLED",
      },
    },
  };

  while (
    currentTasksCount < iterationTaskCountLimit &&
    currentTasksCount < desiredTaskCount
  ) {
    taskPromises.push(ecs.runTask(paramsTasks).promise());
    currentTasksCount++;
  }
  await Promise.allSettled(taskPromises);
  console.log("currentTasksCount AFTER:", currentTasksCount);
};
