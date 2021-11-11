import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam"
import * as path from 'path'

export class StartingLambda extends cdk.Construct {
  scope: cdk.Construct;
  id: string;
  props: any;
  handler: lambda.Function;
  constructor(scope: any, id: any, props?: any) {
    super(scope, id);

    const ManagedPolicy = iam.ManagedPolicy;
    const lambdaRole = new iam.Role(this, "ms-dummy-starting-lambda-role", {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'));
    // lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonECS_FullAccess'));
    // lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaExecute'));
    // lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonECSTaskExecutionRolePolicy'));
    // lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaBasicExecutionRole'));
    // lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaRole'));
    lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEventBridgeFullAccess'));
    lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'));
    
    this.handler = new lambda.Function(this, id, {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(path.join(__dirname,"/../resources/Lambda-starting")),
      handler: "dummy_starting_lambda.handler",
      environment: {
        BUCKET: props.bucketName,
        functionArn: props.functionArn
      },
      role: lambdaRole,
    });
  }
}