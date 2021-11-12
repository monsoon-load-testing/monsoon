import * as cdk from '@aws-cdk/core';
import { S3 } from './s3';
import { StartingLambda } from './starting_lamba';
import { MetronomeLambda } from './metronome_lambda'
import { VPC } from './vpc';

export class AwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: any) {
    super(scope, id, props);

    const dummyBucket = new S3(this, "monsoon-load-testing");
    const metronomeLambda = new MetronomeLambda(this, "metronome-lambda")
    const customVpc = new VPC(this, "custom-vpc")

    const startingLambda = new StartingLambda(this, "starting-lambda", {
      bucketName: dummyBucket.bucket.bucketName,
      functionArn: metronomeLambda.handler.functionArn,
      metronomeLambdaName: metronomeLambda.handler.functionName,
      testLengthInMinutes: "1", // hard-coded: user enters in minute, extract CLI
      timeWindow: "15", // hard-coded: user enters in seconds, extract from CLI
      numberOfUsers: "10", // hard-coded, extract from CLI
      vpcId: customVpc.vpc.vpcId,
      clusterName: customVpc.cluster.clusterName,
      access_key: "AKIAZCVRTWYDA2X2MPRY ", // extract from CLI
      secret_access_key: "eKTZUPGVcykNkyeE7p7mBMLttyN++x1DBaMV/u/3", // extract from CLI
    })
    dummyBucket.bucket.grantReadWrite(startingLambda.handler);
  }
}
