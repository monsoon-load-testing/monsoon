import * as cdk from '@aws-cdk/core';
import { S3 } from './s3';
import { StartingLambda } from './starting_lamba';
import { MetronomeLambda } from './metronome_lambda'

export class AwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: any) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'AwsQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    const dummyBucket = new S3(this, "ms-dummy-monsoon-load-testing");
    const metronomeLambda = new MetronomeLambda(this, "metronome-lambda")
    const startingLambda = new StartingLambda(this, "starting-lambda", {
      bucketName: dummyBucket.bucket.bucketName,
      functionArn: metronomeLambda.handler.functionArn,
      metronomeLambdaName: metronomeLambda.handler.functionName,
      testLengthInMinutes: "1", // hard-coded: user enters in minute
      timeWindow: "15", // hard-coded: user enters in seconds
      numberOfUsers: "10", // hard-coded
    })
    // console.log('metronomeLambda', metronomeLambda.handler.functionArn)
    // console.log('bucketArn', dummyBucket.bucket.bucketArn)
    // console.log('bucketName', dummyBucket.bucket.bucketName)
  }
}
