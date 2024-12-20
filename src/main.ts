import path from 'path';
import { App, CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { ComparisonOperator, Metric, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { FilterPattern, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription, LambdaSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';


export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    //エラー通知用トピック
    const emailTopic = new Topic(this, 'EmailTopic', {
      fifo: false,
    });
    emailTopic.addSubscription(new EmailSubscription('my-mailadress'));

    //エラー通知用Lambda
    const myFunction = new NodejsFunction(this, 'error-event', {
      entry: path.join(__dirname, 'lambda/error-event.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_LATEST,
      logRetention: RetentionDays.THREE_MONTHS,
      environment: {
        EMAIL_TOPIC_ARN: emailTopic.topicArn,
      },
    });

    //エラー通知用ラムダのPublish
    myFunction.addToRolePolicy(new PolicyStatement({
      actions: ['sns:Publish'],
      resources: [emailTopic.topicArn],
    }));

    const alertTopic = new Topic(this, 'alert-topic', {
      fifo: false,
    });
    alertTopic.addSubscription(new LambdaSubscription(myFunction));

    const func = new NodejsFunction(this, 'hello-world', {
      entry: path.join(__dirname, 'lambda/hello-world.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_LATEST,
      logRetention: RetentionDays.THREE_MONTHS,
    });

    const metricNamespace = 'LogMetrics';
    const metricName = 'Error';
    func.logGroup.addMetricFilter('erro-metric-filter', {
      metricNamespace,
      metricName,
      filterPattern: FilterPattern.literal('Error'),
    });

    const metric = new Metric({
      namespace: metricNamespace,
      metricName,
      period: Duration.minutes(1),
      statistic: 'Sum',
    });

    metric.createAlarm(this, 'error-alarm', {
      alarmName: 'error-alarm',
      evaluationPeriods: 1,
      threshold: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      actionsEnabled: true,
    }).addAlarmAction(new SnsAction(alertTopic));

    const api = new HttpApi(this, 'Api');
    api.addRoutes({
      methods: [HttpMethod.GET],
      path: '/hello',
      integration: new HttpLambdaIntegration('hello', func),
    });

    new CfnOutput(this, 'ApiUrl', { value: api.url! });
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