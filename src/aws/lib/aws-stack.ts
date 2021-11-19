import * as cdk from "@aws-cdk/core";
import { StartingLambda } from "./starting_lambda";
import { MetronomeLambda } from "./metronome-lambda";
import { VPC } from "./vpc";
import { AggregatingLambda } from "./aggregating-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import { TimestreamConstruct } from "./timestream";
import { nanoid } from "nanoid";

export class AwsStack extends cdk.Stack {
  constructor(scope: any, id: any, props?: any) {
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
      timeWindow: "15",
      vpcId: customVpc.vpc.vpcId,
      clusterName: customVpc.cluster.clusterName,
      permissionStatementId,
    });
    bucket.grantReadWrite(startingLambda.handler);

    const timeStreamDB = new TimestreamConstruct(this, "timestream", {
      databaseName,
    });
  }
}
