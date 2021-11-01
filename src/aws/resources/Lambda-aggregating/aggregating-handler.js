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

// const Prefix = "130/Go to Main Page";
const Bucket = "monsoon-load-testing-bucket";
const aggregateAllContents = async (event) => {
  // repeatedly calling AWS list objects because it only returns 1000 objects
  const data = {
    totalResponseTime: 0,
    countUsers: 0,
  };

  const results = {
    averageResponseTime: 0,
    concurrentUsers: data.countUsers,
  };

  let shouldContinue = true;
  let nextContinuationToken = null;
  const params = {
    Bucket,
    Prefix: event.Prefix,
    ContinuationToken: nextContinuationToken || undefined,
  };
  console.log(params);

  while (shouldContinue) {
    let res = await s3.listObjectsV2(params).promise();
    // iterate across the 1000 objects in res and update data
    // res.Data.forEach(item => reduce(item))
    console.log(res);
    if (!res.IsTruncated) {
      shouldContinue = false;
      nextContinuationToken = null;
    } else {
      nextContinuationToken = res.NextContinuationToken;
    }
  }

  results.averageResponseTime = Math.round(
    data.totalResponseTime / data.countUsers
  );

  return results;
};

/*
// exports.handler = async (event, context) => {
//   // TODO implement
//   console.log(event);
//   const bucket = event.Records[0].s3.bucket.name;
//   console.log("bucket object:", event.Records[0].s3.bucket);
//   console.log("bucket", bucket);
//   const key = decodeURIComponent(
//     event.Records[0].s3.object.key.replace(/\+/g, " ")
//   );
//   const params = {
//     Bucket: bucket,
//     Key: key,
//   };
//   const paramsList = {
//     Bucket: bucket,
//     Prefix: "raw/",
//   };
//   console.log(params);

//   try {
//     const { ContentType } = await s3.getObject(params).promise();
//     const objectsInRaw = await s3.listObjectsV2(paramsList).promise();
//     console.log("objectsInRaw:", objectsInRaw);
//     console.log("content type:", ContentType);
//     return ContentType;
//   } catch (err) {
//     console.log(err);
//     const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
//     console.log(message);
//     throw new Error(message);
//   }
// };
*/
exports.handler = aggregateAllContents;
