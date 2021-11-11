import * as cdk from "@aws-cdk/core";
import { AggregatingLambda } from "./aggregating-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import { MetronomeLambda } from "./metronome-lambda";
import { TimestreamConstruct } from "./timestream";
// import * as sqs from '@aws-cdk/aws-sqs';

export class AwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "monsoon-bucket-dummy", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const aggregatingLambda = new AggregatingLambda(
      this,
      "aggregating-lambda",
      { bucketName: bucket.bucketName }
    );

    const metronomeLambda = new MetronomeLambda(this, "metronome-lambda", {
      ruleName: "invoke-metronome-lambda-rule",
      targetId: "MetronomeLambdaTriggeredByEventBridgeRule",
      permissionStatementId: "Invoke_metronome_lambda_every_1_min",
      bucketName: bucket.bucketName,
      aggregatingLambdaName: aggregatingLambda.handler.functionName,
    });

    const timeStreamDB = new TimestreamConstruct(this, "timestream", {
      databaseName: "monsoonDB",
      tableName: "monsoonTable",
    })
  }
}
