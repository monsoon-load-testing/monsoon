const AWS = require("aws-sdk");
const bucketName = process.env.BUCKET;

exports.handler = async function (event, context) {
  console.log("bucketName", bucketName);
  console.log("env bucket", process.env.BUCKET);
  console.log("metronome arn", process.env.functionArn);
};
