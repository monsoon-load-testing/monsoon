const express = require("express");
const router = express.Router();
const testsController = require("../controllers/testsController");

router.get("/tests", testsController.getTestList);
router.get("/tests/:tableName", testsController.getTableData);
router.get("/tests/:tableName/steps", testsController.getSteps);
router.get("/tests/:tableName/stats", testsController.getTableStats);
module.exports = router;

// http://localhost:5000/api/tests
// http://localhost:5000/api/tests/downpour-test-1637014373298
// http://localhost:5000/api/tests/downpour-test-1637014373298/stats
// BACKEND
// '/'
//   'GET'

// '/api'
//   '/tests'
//     GET list of tests (table names -> split test name and timestamp)
//   '/tests/:tableName'
//     'GET' all data from timestream for the specified table. transform as required
//   '/tests/:tableName/stats
//     GET all aggregated metrics from timestream for the specified table
