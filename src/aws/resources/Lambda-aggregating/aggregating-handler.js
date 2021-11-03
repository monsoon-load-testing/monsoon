/*
Aggregating lambda
Filename pattern: timestamp-stepName-randomHash
E.g. 130/Go To Main/12h5kljh

event:
  - prefixes: timestamp and stepName
aggregate(event) void {}
    access S3, only accessing data for that timestamp and stepName
    aggregate metrics
        responseTime
            average
    send to Timestream

*/
// {"dn34u94":{"metrics":{"normalizedResponseTime":108}}}
const AWS = require("aws-sdk");
const s3 = new AWS.S3({});
const timestreamwrite = new AWS.TimestreamWrite({ region: "us-east-1" });

// const Prefix = "130/Go to Main Page";
const Bucket = "monsoon-load-testing-bucket";
const aggregateAllContents = async (event) => {
  // repeatedly calling AWS list objects because it only returns 1000 objects
  const accumulator = {
    responseTimeSum: 0,
    countUsers: 0,
  };

  const results = {
    averageResponseTime: 0,
    concurrentUsers: 0,
  };

  let shouldContinue = true;
  let nextContinuationToken = null;
  const params = {
    Bucket,
    Prefix: event.Prefix,
    ContinuationToken: nextContinuationToken || undefined,
  };

  while (shouldContinue) {
    let res = await s3.listObjectsV2(params).promise();
    let contents = res.Contents; // this is a list of up to 1000 S3 resources
    let promises = contents.map((entry) => {
      const Key = entry.Key; // access a property on entry and assign it to Key
      const file = s3.getObject({ Bucket, Key }).promise();
      return file;
    });
    let finishedPromises = await Promise.allSettled(promises);


    finishedPromises.forEach((item) => {
      const obj = JSON.parse(item.value.Body);
      Object.values(obj).forEach((user) => {
        accumulator.responseTimeSum += user.metrics.normalizedResponseTime;
        accumulator.countUsers += 1;
      });
    });

    if (!res.IsTruncated) {
      shouldContinue = false;
      nextContinuationToken = null;
    } else {
      nextContinuationToken = res.NextContinuationToken;
    }
  }

  results.averageResponseTime = Math.round(
    accumulator.responseTimeSum / accumulator.countUsers
  );

  results.concurrentUsers = accumulator.countUsers;

  
  // write to db example
  const currentTime = Date.now().toString(); // Unix time in milliseconds
  const [normalizedTimestamp, stepName] = event.Prefix.split("/");
  
  const dimensions = [
    { Name: "stepName", Value: `${stepName}`}
  ]


  const responseTime = {
    Dimensions: dimensions,
    MeasureName: "response_time",
    MeasureValue: results.averageResponseTime.toString(),
    MeasureValueType: "DOUBLE",
    Time: normalizedTimestamp
  }
  
  const concurrentUsers = {
    Dimensions: dimensions,
    MeasureName: "concurrent_users",
    MeasureValue: results.concurrentUsers.toString(),
    MeasureValueType: "DOUBLE",
    Time: normalizedTimestamp
  }


  const records = [responseTime, concurrentUsers];

  const paramsWrite = {
    DatabaseName: "monsoon",
    TableName: "test1",
    Records: records,
  };

  
  const res = await timestreamwrite.writeRecords(paramsWrite).promise();
  console.log(res);

  return results;
};

exports.handler = aggregateAllContents;