import * as cdk from "@aws-cdk/core";
import * as s3 from '@aws-cdk/aws-s3';

export class S3 extends cdk.Construct {
  scope: cdk.Construct;
  id: string;
  props: any;
  bucket: s3.Bucket;
  constructor(scope: cdk.Construct, id: string, props?: any) {
    super(scope, id);
    // define the s3

    this.bucket = new s3.Bucket(this, id, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
  }
}