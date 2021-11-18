import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";
import * as path from "path";
import { Duration } from "@aws-cdk/core";

export class StartingLambda extends cdk.Construct {
  scope: cdk.Construct;
  id: string;
  props: any;
  handler: lambda.Function;
  constructor(scope: any, id: any, props?: any) {
    super(scope, id);

    const ManagedPolicy = iam.ManagedPolicy;
    const lambdaRole = new iam.Role(this, "starting-lambda-role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess")
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonECS_FullAccess")
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonEventBridgeFullAccess")
    );
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess")
    );

    this.handler = new lambda.Function(this, id, {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "/../resources/Lambda-starting"),
        { exclude: ["node_modules", "package.json", "package-lock.json"] }
      ),
      handler: "starting-handler.handler",
      environment: {
        bucketName: props.bucketName,
        functionArn: props.functionArn,
        metronomeLambdaName: props.metronomeLambdaName,
        timeWindow: props.timeWindow,
        testLengthInMinutes: props.testLengthInMinutes,
        numberOfUsers: props.numberOfUsers,
        vpcId: props.vpcId,
        clusterName: props.clusterName,
        access_key: props.access_key,
        secret_access_key: props.secret_access_key,
        permissionStatementId: props.permissionStatementId,
        ecsSpinningUpLambdaName: props.ecsSpinningUpLambdaName,
        functionArnECSSpinningUp: props.functionArnECSSpinningUp,
        permissionStatementIdECS: props.permissionStatementIdECS,
      },
      role: lambdaRole,
      timeout: Duration.seconds(10),
    });
  }
}
