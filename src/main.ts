import path from 'path';
import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';


export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);



    const func = new NodejsFunction(this, 'hello-world', {
      entry: path.join(__dirname, 'lambda/hello-world.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_LATEST,
      logRetention: RetentionDays.THREE_MONTHS,
    });

    const api = new HttpApi(this, 'Api');
    api.addRoutes({
      methods: [HttpMethod.GET],
      path: '/hello',
      integration: new HttpLambdaIntegration('hello', func),
    });

    new CfnOutput(this, 'ApiUrl', {value: api.url!});
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