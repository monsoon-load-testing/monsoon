import * as cdk from '@aws-cdk/core';
import { AggregatingLambda } from './aggregating-lambda';
// import * as sqs from '@aws-cdk/aws-sqs';

export class AwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const aggregatingLambda = new AggregatingLambda(this, "aggregating-lambda-test", {bucketName: "dummy-bucket"});


    // example resource
    // const queue = new sqs.Queue(this, 'AwsQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
/*
METRONOME LAMBDA
AGGREGATING LAMBDA
TIMESTREAM
S3 BUCKET (dummy)
*/

// const lambdaRole = new iam.Role(this, 'lambda_basic_execution', {
//   assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
// });
// lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'));