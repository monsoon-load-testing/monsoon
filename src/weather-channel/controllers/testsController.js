const HttpError = require("../models/httpError");
const { validationResult } = require("express-validator");
const aws = require("aws-sdk");
const timestreamwrite = new aws.TimestreamWrite({ region: "us-east-1" });
const timestreamquery = new aws.TimestreamQuery({ region: "us-east-1" });

const processData = (stepRawData) => {
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

const getTableData = async (req, res, next) => {
  let tableName = req.params.tableName;

  const paramsStepNames = {
    QueryString: `SELECT DISTINCT stepName FROM "${process.env.DATABASE_NAME}"."${tableName}" `,
  };

  const stepNamesData = await timestreamquery.query(paramsStepNames).promise();
  const stepNames = stepNamesData.Rows.map((row) => row.Data[0].ScalarValue);
  console.log("stepNames", stepNames);

  const promises = stepNames.map(async (stepName) => {
    const params = {
      QueryString: `SELECT * FROM "${process.env.DATABASE_NAME}"."${tableName}" WHERE stepName='${stepName}'`,
    };
    return timestreamquery.query(params).promise();
  });
  const rawData = await Promise.all(promises);
  console.log("rawData", rawData);
  // const data = await timestreamquery.query(params).promise();
  // console.log(data);
  const data = rawData.reduce((acc, stepRawData, idx) => {
    const stepName = stepNames[idx];
    return { ...acc, [stepName]: processData(stepRawData) };
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
SELECT approx_percentile(measure_value::double, 0.95) as p95
FROM "monsoon".test1
WHERE stepName = 'Load main page' AND measure_name = 'response_time'


Returned format is:
{
  Rows: [
    {
      Data: [
        {
          "ScalarValue": stepName,
        },
        {
          "ScalarValue": metricName,
        },
        {
          "ScalarValue": timestamp,
        },
        {
          "ScalarValue": metricValue,
        },
      ]
    },
  ]
}
================================================================================
Desired format is:
{
  "stepName1": {
    metricName1: [
      { time: 1234, value: 765, metrics: "metricName1", unit: "ms" },
      { time: 1234, value: 765, metrics: "metricName1", unit: "ms" },
    ],

    metricName2: [
      { time: 1234, value: 765, metrics: "Concurrent users", unit: "" },
    ],
  },
  "stepName2": {
    metricName1: [
      { time: 1234, value: 765, metrics: "Response Time", unit: "ms" },
      { time: 1234, value: 765, metrics: "Response Time", unit: "ms" },
    ],

    metricName2: [
      { time: 1234, value: 765, metrics: "Concurrent users", unit: "" },
    ],
  },
};
*/
const getTableStats = (req, res, next) => {};

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
