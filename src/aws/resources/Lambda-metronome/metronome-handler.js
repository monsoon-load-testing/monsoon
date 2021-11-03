/*


array of timestamps
    each unique step name

130/
    Go To Main Page
    Click Link 1
145/
    Click Link 2
    Go To Main Page
160/
    Click Link 1
    Click Link 2


For each timestamp
    let uniqueSteps = S3.list({ stepName: stepName })
    Query directory to get list of unique Steps
    uniqueSteps.forEach(() => {
        invoke aggregating Lambda
    })

INPUT: timestamps.json (this is generated by startingLambda)
    {
      timestamps: [130, 145, 160, 175, 190....],
      stepNames: ["Load main page", "Go to bin"]
    }
OUTPUT: Invoke aggregating lambda timestamp/stepName
EXPIRATION_TIME: 
  (e.g. 2 minutes) and needs to be > maxRuntime of the run iteration + 
  the time interval in which normalizer.js checks if there are new files to process
ALGO:
- Every X minutes
    - record current time Date.now(): currentTime
    - calculate expirationTimestamp = currentTime - EXPIRATION_TIME
    - metronome fetches timestamps.json from S3 bucket
    - filters out the timestamps that have expired (timestamp < expirationTimestamp)
    - for each expired timestamp
      - for each stepName
        - run aggregatingLambda({ Prefix: `${timestamp}/${stepName}`})
    - write new timestamps.json file back to S3
*/

/*
    let currentTime = Date.now()
    let expirationTimestamp = currentTime - EXPIRATION_TIME
    
    let timestampsFile = fetchFromS3();
    let { timestamps, stepNames } = timestampsFile
    
    let expiredTimestamps = [];
    let nonExpiredTimestamps = [];

    for (let i = 0; i < timestamps.length; i++) {
        if (timestamps[i] < expirationTimestamp) {
            expiredTimestamps.push(timestamps[i]);
        } else {
            nonExpiredTimestamps = timestamps.slice(i);
            break
        }
    }

    expiredTimestamps.forEach(timestamp => {
        stepNames.forEach(stepName => {
            // invoke aggregatingLambda({ Prefix: `${timestamp}/${stepName}`})
        })
    })

    S3.put(nonExpiredTimestamps)
*/
