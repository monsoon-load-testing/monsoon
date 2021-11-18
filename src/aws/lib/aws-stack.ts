import * as cdk from "@aws-cdk/core";
import { StartingLambda } from "./starting_lambda";
import { ECSSpinningUpLambda } from "./ecs-spinning-up-lambda";
import { MetronomeLambda } from "./metronome-lambda";
import { VPC } from "./vpc";
import { AggregatingLambda } from "./aggregating-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import { TimestreamConstruct } from "./timestream";
import { nanoid } from "nanoid";

export class AwsStack extends cdk.Stack {
  constructor(scope: any, id: any, props?: any) {
    super(scope, id, props);
    const databaseName = "monsoonDBTest"; // rename to monsoonDB
    const permissionStatementId = nanoid(); // rename to permissionStatementIdMetronome
    const permissionStatementIdECS = nanoid();
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

    const ecsSpinningUpLambda = new ECSSpinningUpLambda(
      this,
      "ecs-spinning-up-lambda",
      {
        ruleName: "invoke-ecs-spinning-up-lambda",
        targetId: "ECSSPinningUpLambdaTriggeredByEventBridgeRule",
        permissionStatementIdECS,
        vpcId: customVpc.vpc.vpcId,
        clusterName: customVpc.cluster.clusterName,
        bucketName: bucket.bucketName,
      }
    );

    const startingLambda = new StartingLambda(this, "starting-lambda", {
      bucketName: bucket.bucketName,
      functionArn: metronomeLambda.handler.functionArn, // rename to functionArnMetronome
      metronomeLambdaName: metronomeLambda.handler.functionName,
      testLengthInMinutes: "1", // will be passed to startingLambda event
      timeWindow: "15",
      numberOfUsers: "10", // will be passed to startingLambda event
      vpcId: customVpc.vpc.vpcId,
      clusterName: customVpc.cluster.clusterName,
      access_key: "KEY-XXXX", // extract from CLI (delete)
      secret_access_key: "KEY-XXXX", // extract from CLI (delete)
      permissionStatementId, // rename to  permissionStatementIdMetronome
    });
    bucket.grantReadWrite(startingLambda.handler);

    const timeStreamDB = new TimestreamConstruct(this, "timestream", {
      databaseName,
    });
  }
}
