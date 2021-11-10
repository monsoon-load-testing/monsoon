import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";
import * as path from "path";

export class MetronomeLambda extends cdk.Construct {
  scope: cdk.Construct;
  id: string;
  props: any;
  handler: lambda.Function;
  constructor(scope: any, id: any, props?: any) {
    super(scope, id);

    const ManagedPolicy = iam.ManagedPolicy;
    const lambdaRole = new iam.Role(this, `${id}-role`, {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess")
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess")
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonEventBridgeFullAccess")
    );

    this.handler = new lambda.Function(this, id, {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "/../resources/Lambda-metronome")
      ),
      handler: "metronome-handler.handler",
      environment: {
        BUCKET: props.bucketName,
      },
      role: lambdaRole,
    });
  }
}
