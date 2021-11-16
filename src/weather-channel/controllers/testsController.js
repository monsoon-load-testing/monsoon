const HttpError = require("../models/httpError");
const { validationResult } = require("express-validator");
const aws = require("aws-sdk");
const timestreamwrite = new aws.TimestreamWrite({ region: "us-east-1" });
const timestreamquery = new aws.TimestreamQuery({ region: "us-east-1" });

const processTableData = (stepRawData) => {
  const data = {
    concurrentUsers: [],
    responseTime: [],
    transactionRate: [],
    passRatio: [],
  };
  stepRawData.Rows.forEach((datum) => {
    datum = datum.Data;
    const stepName = datum[0].ScalarValue;
    const metricName = datum[1].ScalarValue;
    const timestamp = datum[2].ScalarValue;
    const metricValue = datum[3].ScalarValue;

    if (metricName === "concurrent_users") {
      data.concurrentUsers.push({
        time: timestamp,
        metric: "Concurrent Users",
        unit: "",
        value: metricValue,
      });
    } else if (metricName === "response_time") {
      data.responseTime.push({
        time: timestamp,
        metric: "Response Time",
        unit: "ms",
        value: metricValue,
      });
    } else if (metricName === "transaction_rate") {
      data.transactionRate.push({
        time: timestamp,
        metric: "Transaction Rate",
        unit: "transactions/min",
        value: metricValue,
      });
    } else if (metricName === "pass_ratio") {
      data.passRatio.push({
        time: timestamp,
        metric: "Pass Ratio",
        unit: "%",
        value: metricValue,
      });
    }
  });
  return data;
};

const querySteps = async (tableName) => {
  const paramsStepNames = {
    QueryString: `SELECT DISTINCT stepName FROM "${process.env.DATABASE_NAME}"."${tableName}" `,
  };

  const stepNamesData = await timestreamquery.query(paramsStepNames).promise();
  const stepNames = stepNamesData.Rows.map((row) => row.Data[0].ScalarValue);
  return stepNames;
};

const getSteps = async (req, res, next) => {
  let tableName = req.params.tableName;

  const stepNames = await querySteps(tableName);
  res.send(stepNames);
};

const getTableData = async (req, res, next) => {
  let tableName = req.params.tableName;
  const stepNames = await querySteps(tableName);

  const promises = stepNames.map(async (stepName) => {
    const params = {
      QueryString: `SELECT * FROM "${process.env.DATABASE_NAME}"."${tableName}" WHERE stepName='${stepName}'`,
    };
    return timestreamquery.query(params).promise();
  });
  const rawData = await Promise.all(promises);
  console.log("rawData", rawData);
  const data = rawData.reduce((acc, stepRawData, idx) => {
    const stepName = stepNames[idx];
    return { ...acc, [stepName]: processTableData(stepRawData) };
  }, {});
  res.send(data);
};

const data = {
  "Load main page": {
    responseTime: [
      { time: 1234, value: 765, metrics: "Response Time", unit: "ms" },
      { time: 1234, value: 765, metrics: "Response Time", unit: "ms" },
    ],

    concurrentUsers: [
      { time: 1234, value: 765, metrics: "Concurrent users", unit: "" },
    ],
  },
  "Go to bin": {
    responseTime: [
      { time: 1234, value: 765, metrics: "Response Time", unit: "ms" },
      { time: 1234, value: 765, metrics: "Response Time", unit: "ms" },
    ],

    concurrentUsers: [
      { time: 1234, value: 765, metrics: "Concurrent users", unit: "" },
    ],
  },
};
// const data2 = [
//   { a: new Date(1982, 1, 1), b: 125, c: "ms" },
//   { a: new Date(1987, 1, 1), b: 257, c: "ms" },
//   { a: new Date(1993, 1, 1), b: 345, c: "ms" },
//   { a: new Date(1997, 1, 1), b: 515, c: "ms" },
//   { a: new Date(2001, 1, 1), b: 132, c: "ms" },
//   { a: new Date(2005, 1, 1), b: 305, c: "ms" },
//   { a: new Date(2011, 1, 1), b: 270, c: "ms" },
//   { a: new Date(2015, 1, 1), b: 470, c: "ms" },
// ];

// const responseTime = [
//   { time: 1234, value: 765, metrics: "Response Time", unit: "ms" },
//   { time: 1234, value: 765, metrics: "Response Time", unit: "ms" },
// ];
// const concurrentUsers=[
//   { time: 1234, value: 765, metrics: "Concurrent users", unit: "" },
// ]

/*
https://docs.aws.amazon.com/timestream/latest/developerguide/aggregate-functions.html

Response Time
- percentile 95 approx_percentile(x, w, percentages)
- average: avg(x)
- minimum: min(x)
- maximum: max(x)
*/

const processStat = (nestedTimestreamObj) => {
  return nestedTimestreamObj.Rows[0].Data[0].ScalarValue;
};

const getTableStats = async (req, res, next) => {
  const results = {};
  const tableName = req.params.tableName;
  const stepNames = await querySteps(tableName);

  const percentile95Promises = stepNames.map(async (step) => {
    const params = {
      QueryString: `
        SELECT approx_percentile(measure_value::double, 0.95) as p95
        FROM "${process.env.DATABASE_NAME}"."${tableName}"
        WHERE stepName = '${step}' AND measure_name = 'response_time'
      `,
    };
    return timestreamquery.query(params).promise();
  });
  const data = await Promise.all(percentile95Promises);
  const newData = data.map((datum) => processStat(datum));
  console.log(newData);

  // const averagePromises = stepNames.map(async (step) => {
  //   const params = {
  //     QueryString: `
  //       //find the average
  //     `,
  //   };
  //   return timestreamquery.query(params).promise();
  // });

  // const minPromises = stepNames.map(async (step) => {
  //   const params = {
  //     QueryString: `
  //       //find the min
  //     `,
  //   };
  //   return timestreamquery.query(params).promise();
  // });

  // p95 stats for stepNames[0] will always be p95Promises[0]

  /*
    {
      "Go to bin": {
        responseTime: {
          percentile95: "123",
          average: "50",
          min: "10",
          max: "140"
        },
        "Load main page": {}
      }    
  */

  res.send(results);
};

const getTestList = async (req, res, next) => {
  const paramsListTables = {
    DatabaseName: process.env.DATABASE_NAME,
  };
  const resListTables = await timestreamwrite
    .listTables(paramsListTables)
    .promise();
  const tables = resListTables.Tables;
  const newTables = tables.map((table) => {
    let testName = "downpour-test";
    let timestamp = "1637014373298";
    // let [testName, timestamp] = table.TableName.split("-");
    return {
      testName,
      date: timestamp,
    };
  });
  res.send(newTables);
};

module.exports = {
  getTableData,
  getTableStats,
  getTestList,
};
