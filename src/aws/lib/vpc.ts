import * as ec2 from "@aws-cdk/aws-ec2"
import * as cdk from "@aws-cdk/core";
import * as ecs from "@aws-cdk/aws-ecs";

export class VPC extends cdk.Construct {
  scope: cdk.Construct;
  id: string;
  props: any;
  cluster: ecs.Cluster;
  vpc: ec2.Vpc;
  constructor(scope: cdk.Construct, id: string, props?: any) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, id, {
      maxAzs: 6, // Default is all AZs in region
      natGateways: 1
    })

    // create an ECS cluster within our VPC
    this.cluster = new ecs.Cluster(this, "monsoon-load-testing", {
      vpc: this.vpc
    });
  }
}
