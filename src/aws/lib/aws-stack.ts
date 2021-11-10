import * as cdk from '@aws-cdk/core';
import { S3 } from './s3';

export class AwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'AwsQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    const bucket = new S3(this, "ms-dummy-monsoon-load-testing");
    // extract details
    console.log('bucketArn', bucket.bucket.bucketArn)
  }
}
