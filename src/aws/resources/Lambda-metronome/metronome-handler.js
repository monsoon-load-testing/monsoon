const AWS = require("aws-sdk");
const s3 = new AWS.S3({});
const lambda = new AWS.Lambda();

const handler = async (event) => {
  const EXPIRATION_TIME = 2 * 60_000;
  const currentTime = Date.now();
  const expirationTimestamp = currentTime - EXPIRATION_TIME;

  const params = {
    Bucket: "monsoon-load-testing-bucket",
    Key: "timestamps.json",
  };
  const timestampsFile = await s3.getObject(params).promise();

  const { timestamps, stepNames } = JSON.parse(timestampsFile.Body);

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
  
  const promises = []
  expiredTimestamps.forEach((timestamp) => {
    stepNames.forEach((stepName) => {
      const Prefix = `${timestamp}/${stepName}`;
      console.log(Prefix);
      const lambdaParams = {
        FunctionName: "Aggregating-Lambda",
        InvocationType: "Event",
        LogType: "None",
        Payload: JSON.stringify({ Prefix }),
      };
      promises.push(lambda.invoke(lambdaParams).promise());
    });
  });
  await Promise.allSettled(promises)
};

exports.handler = handler;
