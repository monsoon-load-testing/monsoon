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

  const stepNames = (await querySteps(tableName)).sort();
  res.send(stepNames);
};

const getTableData = async (req, res, next) => {
  let tableName = req.params.tableName;
  const stepNames = await querySteps(tableName);

  const promises = stepNames.map(async (stepName) => {
    const params = {
      QueryString: `SELECT * FROM "${process.env.DATABASE_NAME}"."${tableName}" WHERE stepName='${stepName}' ORDER BY time ASC`,
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

const processStat = (nestedTimestreamObj) => {
  return nestedTimestreamObj.Rows[0].Data[0].ScalarValue;
};

const queryP95 = (tableName, stepNames) => {
  const percentile95Promises = stepNames.map((step) => {
    const params = {
      QueryString: `
        SELECT approx_percentile(measure_value::double, 0.95) as p95
        FROM "${process.env.DATABASE_NAME}"."${tableName}"
        WHERE stepName = '${step}' AND measure_name = 'response_time'
      `,
    };
    return timestreamquery.query(params).promise();
  });
  return percentile95Promises;
};

const queryAVG = (tableName, stepNames) => {
  const avgPromises = stepNames.map((step) => {
    const params = {
      QueryString: `
        SELECT avg(measure_value::double) as avg
        FROM "${process.env.DATABASE_NAME}"."${tableName}"
        WHERE stepName = '${step}' AND measure_name = 'response_time'
      `,
    };
    return timestreamquery.query(params).promise();
  });
  return avgPromises;
};

const queryMax = (tableName, stepNames) => {
  const maxPromises = stepNames.map((step) => {
    const params = {
      QueryString: `
        SELECT max(measure_value::double) as max
        FROM "${process.env.DATABASE_NAME}"."${tableName}"
        WHERE stepName = '${step}' AND measure_name = 'response_time'
      `,
    };
    return timestreamquery.query(params).promise();
  });
  return maxPromises;
};

const queryMin = (tableName, stepNames) => {
  const minPromises = stepNames.map((step) => {
    const params = {
      QueryString: `
        SELECT min(measure_value::double) as min
        FROM "${process.env.DATABASE_NAME}"."${tableName}"
        WHERE stepName = '${step}' AND measure_name = 'response_time'
      `,
    };
    return timestreamquery.query(params).promise();
  });
  return minPromises;
};

const processResults = (stepNames, data, metricNames) => {
  // data is an array of values
  // stepNames is an array of stepNames
  // metricNames is an array of string values, representing metric names

  const results = {};
  const nbrOfSteps = stepNames.length;

  stepNames.forEach((stepName, stepIdx) => {
    let dataIdx = stepIdx;
    results[stepName] = { responseTime: {} };
    metricNames.forEach((metricName, metricIdx) => {
      results[stepName]["responseTime"][metricName] = data[dataIdx];
      dataIdx += nbrOfSteps;
    });
  });

  return results;
};

const getTableStats = async (req, res, next) => {
  const tableName = req.params.tableName;
  const stepNames = await querySteps(tableName);

  const q95promises = queryP95(tableName, stepNames);
  const avgPromises = queryAVG(tableName, stepNames);
  const maxPromises = queryMax(tableName, stepNames);
  const minPromises = queryMin(tableName, stepNames);
  const promises = [
    ...q95promises,
    ...avgPromises,
    ...maxPromises,
    ...minPromises,
  ];
  const metricNames = ["95th Percentile", "Average", "Max", "Min"];

  const data = await Promise.all(promises);
  const newData = data.map((datum) => processStat(datum));

  const results = processResults(stepNames, newData, metricNames);
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
    // let testName = "downpour-test";
    // let timestamp = "1637014373298";
    let [testName, timestamp] = table.TableName.split("-");
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
  getSteps,
};
