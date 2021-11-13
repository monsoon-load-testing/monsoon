import * as cdk from "@aws-cdk/core";
import { StartingLambda } from "./starting_lamba";
import { MetronomeLambda } from "./metronome-lambda";
import { VPC } from "./vpc";
import { AggregatingLambda } from "./aggregating-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import { TimestreamConstruct } from "./timestream";
import { nanoid } from "nanoid";

export class AwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: any) {
    super(scope, id, props);
    const databaseName = "monsoonDB";
    const permissionStatementId = nanoid();
    const customVpc = new VPC(this, "custom-vpc");

    const bucket = new s3.Bucket(this, "monsoon-load-testing-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const aggregatingLambda = new AggregatingLambda(
      this,
      "aggregating-lambda",
      { bucketName: bucket.bucketName, databaseName }
    );

    const metronomeLambda = new MetronomeLambda(this, "metronome-lambda", {
      ruleName: "invoke-metronome-lambda-rule",
      targetId: "MetronomeLambdaTriggeredByEventBridgeRule",
      permissionStatementId,
      bucketName: bucket.bucketName,
      aggregatingLambdaName: aggregatingLambda.handler.functionName,
    });

    const startingLambda = new StartingLambda(this, "starting-lambda", {
      bucketName: bucket.bucketName,
      functionArn: metronomeLambda.handler.functionArn,
      metronomeLambdaName: metronomeLambda.handler.functionName,
      testLengthInMinutes: "1", // will be passed to startingLambda event
      timeWindow: "15",
      numberOfUsers: "10", // will be passed to startingLambda event
      vpcId: customVpc.vpc.vpcId,
      clusterName: customVpc.cluster.clusterName,
      access_key: "KEY-XXXX", // extract from CLI
      secret_access_key: "KEY-XXXX", // extract from CLI
      permissionStatementId,
    });
    bucket.grantReadWrite(startingLambda.handler);

    const timeStreamDB = new TimestreamConstruct(this, "timestream", {
      databaseName,
    });
  }
}
