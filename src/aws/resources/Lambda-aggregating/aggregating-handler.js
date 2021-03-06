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
// const Bucket = "monsoon-load-testing-bucket";
const Bucket = process.env.BUCKET;
const databaseName = process.env.DATABASE_NAME;

const aggregateAllContents = async (event) => {
  // repeatedly calling AWS list objects because it only returns 1000 objects
  // totalTransactionRate: same as averageResponseTime
  // passRatio:
  // 1) sum number of passes and fails
  // 2) passSum / (passSum + failSum) * 100
  const accumulator = {
    responseTimeSumProd: 0,
    countUsers: 0,
    transactionRateSum: 0,
    passSum: 0,
    failSum: 0,
  };

  const results = {
    averageResponseTime: 0,
    concurrentUsers: 0,
    totalTransactionRate: 0,
    passRatio: 0,
  };

  let shouldContinue = true;
  let nextContinuationToken = null;
  const params = {
    Bucket,
    Prefix: event.Prefix,
    ContinuationToken: nextContinuationToken || undefined,
  };

  // calculate sums
  while (shouldContinue) {
    let res = await s3.listObjectsV2(params).promise();
    let contents = res.Contents; // this is a list of up to 1000 S3 resources
    if (contents.length === 0) {
      return "contents are empty";
    }
    let promises = contents.map((entry) => {
      const Key = entry.Key; // access a property on entry and assign it to Key
      const file = s3.getObject({ Bucket, Key }).promise();
      return file;
    });
    let finishedPromises = await Promise.allSettled(promises);

    finishedPromises.forEach((item) => {
      const obj = JSON.parse(item.value.Body);
      accumulator.countUsers += obj.usersPerContainer;
      delete obj.usersPerContainer;

      Object.values(obj).forEach((user) => {
        const {
          normalizedResponseTime,
          transactionRate,
          passCount,
          failCount,
        } = user.metrics;

        accumulator.responseTimeSumProd +=
          normalizedResponseTime * (passCount + failCount);

        accumulator.transactionRateSum += transactionRate;
        accumulator.passSum += passCount;
        accumulator.failSum += failCount;
      });
    });

    if (!res.IsTruncated) {
      shouldContinue = false;
      nextContinuationToken = null;
    } else {
      nextContinuationToken = res.NextContinuationToken;
    }
  }

  // calculate results
  const passAndFailSum = accumulator.passSum + accumulator.failSum;
  results.averageResponseTime = Math.round(
    accumulator.responseTimeSumProd / passAndFailSum
  );

  results.concurrentUsers = accumulator.countUsers;

  results.totalTransactionRate = Math.round(accumulator.transactionRateSum);

  results.passRatio = (100 * accumulator.passSum) / passAndFailSum;

  // write to db
  const tableName = event.tableName;

  const paramsListTables = {
    DatabaseName: databaseName,
  };
  const resListTables = await timestreamwrite
    .listTables(paramsListTables)
    .promise();
  const tables = resListTables.Tables;

  if (tables.filter((table) => table.TableName === tableName).length === 0) {
    const paramsCreateTables = {
      DatabaseName: databaseName,
      TableName: tableName,
      RetentionProperties: {
        MemoryStoreRetentionPeriodInHours: (24 * 30).toString(10),
        MagneticStoreRetentionPeriodInDays: (365).toString(10),
      },
    };

    const resCreateTable = await timestreamwrite
      .createTable(paramsCreateTables)
      .promise();
    console.log(resCreateTable);
  }

  const currentTime = Date.now().toString(); // Unix time in milliseconds
  const [normalizedTimestamp, stepName] = event.Prefix.split("/");

  const dimensions = [{ Name: "stepName", Value: `${stepName}` }];

  const responseTime = {
    Dimensions: dimensions,
    MeasureName: "response_time",
    MeasureValue: results.averageResponseTime.toString(),
    MeasureValueType: "DOUBLE",
    Time: normalizedTimestamp,
  };

  const concurrentUsers = {
    Dimensions: dimensions,
    MeasureName: "concurrent_users",
    MeasureValue: results.concurrentUsers.toString(),
    MeasureValueType: "DOUBLE",
    Time: normalizedTimestamp,
  };

  const transactionRate = {
    Dimensions: dimensions,
    MeasureName: "transaction_rate",
    MeasureValue: results.totalTransactionRate.toString(),
    MeasureValueType: "DOUBLE",
    Time: normalizedTimestamp,
  };

  const passRatio = {
    Dimensions: dimensions,
    MeasureName: "pass_ratio",
    MeasureValue: results.passRatio.toString(),
    MeasureValueType: "DOUBLE",
    Time: normalizedTimestamp,
  };

  const records = [responseTime, concurrentUsers, transactionRate, passRatio];

  const paramsWrite = {
    DatabaseName: databaseName,
    TableName: tableName, // tableName shouldd be dynamic. e.g. timeOrigin
    Records: records,
  };

  const res = await timestreamwrite.writeRecords(paramsWrite).promise();
  console.log(res);

  return results;
};

exports.handler = aggregateAllContents;
