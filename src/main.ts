import path from 'path';
import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    new NodejsFunction(this, 'hello-world', {
      entry: path.join(__dirname, 'lambda/hello-world.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_LATEST,
      logRetention: RetentionDays.THREE_MONTHS,
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'cdk-aws-study-dev', { env: devEnv });
// new MyStack(app, 'cdk-aws-study-prod', { env: prodEnv });

app.synth();