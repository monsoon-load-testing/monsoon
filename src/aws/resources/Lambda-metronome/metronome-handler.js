const AWS = require("aws-sdk");
const s3 = new AWS.S3({});
const lambda = new AWS.Lambda();
const EventBridge = new AWS.EventBridge({ apiVersion: "2015-10-07" });
// const ruleName = "invoke-metronome-lambda-rule";

const ruleName = process.env.RULE_NAME; // "invoke-metronome-lambda-rule"
const targetId = process.env.TARGET_ID; // "MetronomeLambdaTriggeredByEventBridgeRule"
const permissionStatementId = process.env.PERMISSION_STATEMENT_ID; // "Invoke_metronome_lambda_every_1_min"

const bucketName = process.env.BUCKET; // "monsoon-load-testing-bucket"
const aggregatingLambdaName = process.env.AGGREGATING_LAMBDA_NAME; // "Aggregating-Lambda"

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

const removeMetronomePermissions = async () => {
  const params = {
    FunctionName: "Metronome-Lambda",
    StatementId: permissionStatementId,
  };

  await lambda.removePermission(params).promise();
  console.log("Metronome-Lambda permissions removed");
};

const handler = async (event) => {
  console.log(
    "ruleName, targetId, permissionStatementId",
    ruleName,
    targetId,
    permissionStatementId
  ); // delete
  console.log(
    "bucket and aggregating lambda names",
    bucketName,
    aggregatingLambdaName
  ); // delete

  const EXPIRATION_TIME = 2 * 60_000;
  const currentTime = Date.now();
  const expirationTimestamp = currentTime - EXPIRATION_TIME;

  const params = {
    Bucket: bucketName,
    Key: "timestamps.json",
  };
  const timestampsFile = await s3.getObject(params).promise();

  const { timestamps, stepNames, tableName } = JSON.parse(timestampsFile.Body);
  if (timestamps.length === 0) {
    // disable metronome-lambda because all timestamps have been handled

    await removeMetronomePermissions();
    await removeTarget();
    await deleteRule();
    return;
  }

  const expiredTimestamps = [];
  let nonExpiredTimestamps = [];

  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i] <= expirationTimestamp) {
      expiredTimestamps.push(timestamps[i]);
    } else {
      nonExpiredTimestamps = timestamps.slice(i);
      break;
    }
  }

  const promises = [];
  expiredTimestamps.forEach((timestamp) => {
    stepNames.forEach((stepName) => {
      const Prefix = `${timestamp}/${stepName}`;
      const lambdaParams = {
        FunctionName: aggregatingLambdaName,
        InvocationType: "Event",
        LogType: "None",
        Payload: JSON.stringify({ Prefix, tableName }),
      };
      promises.push(lambda.invoke(lambdaParams).promise());
    });
  });
  const res = await Promise.allSettled(promises);
  console.log("invocations", res);
  const body = JSON.stringify({
    timestamps: nonExpiredTimestamps,
    stepNames: stepNames,
  });
  const uploadParams = { ...params, Body: body };
  await s3.upload(uploadParams).promise();
};

exports.handler = handler;
