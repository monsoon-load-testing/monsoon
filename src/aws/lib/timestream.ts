import { Construct } from "@aws-cdk/core";
import { CfnDatabase, CfnTable } from "@aws-cdk/aws-timestream";

export interface TimestreamConstructProps {
  databaseName: string;
}

export class TimestreamConstruct extends Construct {
  public database: CfnDatabase;
  public table: CfnTable;
  scope: Construct;
  id: string;
  constructor(scope: Construct, id: string, props: TimestreamConstructProps) {
    super(scope, id);
    this.database = new CfnDatabase(this, "TimeStreamDatabase", {
      databaseName: props.databaseName,
    });
  }
}
